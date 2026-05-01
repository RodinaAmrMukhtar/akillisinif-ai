import { NextResponse } from "next/server";
import { AIRTABLE_TABLES, airtableRequest } from "@/lib/airtableClient";

type AirtableRecord<T> = {
  id: string;
  fields: T;
};

type AirtableListResponse<T> = {
  records: AirtableRecord<T>[];
};

type AirtableCreateResponse<T> = {
  records: AirtableRecord<T>[];
};

type AirtableUserFields = {
  Ad_Soyad?: string;
  Eposta?: string;
  Rol?: string;
  Auth_ID?: string;
  Okul_No?: string;
};

type AirtableClassFields = {
  Sinif_Adi?: string;
  Ders_Adi?: string;
  Ogretmen?: string[];
  Akademik_Yil?: string;
  Donem?: string;
  Seviye?: string;
  Aktif_Kod?: string;
  Katilim_Onayi_Gerekli_Mi?: boolean;
  Durum?: string;
};

type AirtableInviteCodeFields = {
  Kod?: string;
  Sinif?: string[];
  Aktif_Mi?: boolean;
  Son_Kullanim_Tarihi?: string;
  Maksimum_Kullanim?: number;
  Kullanim_Sayisi?: number;
};

type AirtableMembershipFields = {
  Uyelik_Adi?: string;
  Sinif?: string[];
  Kullanici?: string[];
  Uyelik_Rolu?: string;
  Durum?: string;
  Davet_Kodu?: string[];
  Katilma_Tarihi?: string;
};

type CreateJoinRequestBody = {
  studentAuthId?: string;
  classCode?: string;
};

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
}

function normalizeClassCode(value: string) {
  const cleaned = value.trim().toUpperCase().replace(/\s+/g, "");

  if (!cleaned.startsWith("AS-") && cleaned.length === 6) {
    return `AS-${cleaned}`;
  }

  return cleaned;
}

async function findStudentByAuthId(authId: string) {
  const safeAuthId = escapeAirtableFormulaValue(authId);
  const filterFormula = `{Auth_ID}='${safeAuthId}'`;

  const result = await airtableRequest<AirtableListResponse<AirtableUserFields>>(
    `/${encodeURIComponent(
      AIRTABLE_TABLES.kullanicilar,
    )}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`,
  );

  return result.records[0];
}

async function findInviteCode(code: string) {
  const safeCode = escapeAirtableFormulaValue(code);
  const filterFormula = `{Kod}='${safeCode}'`;

  const result = await airtableRequest<
    AirtableListResponse<AirtableInviteCodeFields>
  >(
    `/${encodeURIComponent(
      AIRTABLE_TABLES.davetKodlari,
    )}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`,
  );

  return result.records[0];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateJoinRequestBody;

    const studentAuthId = body.studentAuthId?.trim();
    const classCode = normalizeClassCode(body.classCode || "");

    if (!studentAuthId || !classCode) {
      return NextResponse.json(
        {
          ok: false,
          message: "Katılım isteği için studentAuthId ve classCode gereklidir.",
        },
        { status: 400 },
      );
    }

    const student = await findStudentByAuthId(studentAuthId);

    if (!student) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Öğrenci Airtable Kullanicilar tablosunda bulunamadı. Lütfen tekrar giriş yapın.",
        },
        { status: 404 },
      );
    }

    if (student.fields.Rol !== "Ogrenci") {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Sınıfa katılım isteği yalnızca öğrenci hesapları için geçerlidir.",
        },
        { status: 403 },
      );
    }

    const inviteCode = await findInviteCode(classCode);

    if (!inviteCode) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu sınıf kodu bulunamadı. Lütfen kodu kontrol edin.",
        },
        { status: 404 },
      );
    }

    if (inviteCode.fields.Aktif_Mi === false) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu sınıf kodu artık aktif değil.",
        },
        { status: 400 },
      );
    }

    const classId = inviteCode.fields.Sinif?.[0];

    if (!classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Davet kodu herhangi bir sınıfa bağlı değil.",
        },
        { status: 400 },
      );
    }

    const classRecord = await airtableRequest<
      AirtableRecord<AirtableClassFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}/${classId}`);

    const allMemberships = await airtableRequest<
      AirtableListResponse<AirtableMembershipFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}?maxRecords=100`);

    const existingMembership = allMemberships.records.find((record) => {
      const linkedUsers = record.fields.Kullanici || [];
      const linkedClasses = record.fields.Sinif || [];

      return linkedUsers.includes(student.id) && linkedClasses.includes(classId);
    });

    if (existingMembership) {
      return NextResponse.json({
        ok: true,
        action: "already_exists",
        message:
          existingMembership.fields.Durum === "Aktif"
            ? "Bu sınıfa zaten aktif olarak kayıtlısınız."
            : "Bu sınıf için katılım isteğiniz zaten beklemede.",
        membership: {
          id: existingMembership.id,
          status: existingMembership.fields.Durum || "Onay Bekliyor",
        },
      });
    }

    const approvalRequired = classRecord.fields.Katilim_Onayi_Gerekli_Mi ?? true;
    const membershipStatus = approvalRequired ? "Onay Bekliyor" : "Aktif";

    const membershipName = `${student.fields.Ad_Soyad || "Öğrenci"} - ${
      classRecord.fields.Sinif_Adi || "Sınıf"
    }`;

    const createdMembership = await airtableRequest<
      AirtableCreateResponse<AirtableMembershipFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}`, {
      method: "POST",
      body: {
        typecast: true,
        records: [
          {
            fields: {
              Uyelik_Adi: membershipName,
              Sinif: [classId],
              Kullanici: [student.id],
              Uyelik_Rolu: "Ogrenci",
              Durum: membershipStatus,
              Davet_Kodu: [inviteCode.id],
            },
          },
        ],
      },
    });

    return NextResponse.json({
      ok: true,
      action: "created",
      message:
        membershipStatus === "Aktif"
          ? "Sınıfa başarıyla katıldınız."
          : "Katılım isteğiniz öğretmen onayına gönderildi.",
      membership: {
        id: createdMembership.records[0]?.id,
        status: membershipStatus,
      },
      class: {
        id: classRecord.id,
        className: classRecord.fields.Sinif_Adi,
        courseName: classRecord.fields.Ders_Adi,
        classCode,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Airtable sınıf katılım isteği başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}