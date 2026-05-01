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
};

type AirtableClassFields = {
  Sinif_Adi?: string;
  Ders_Adi?: string;
  Ogretmen?: string[];
  Akademik_Yil?: string;
  Donem?: string;
  Seviye?: string;
  Aciklama?: string;
  Aktif_Kod?: string;
  Katilim_Onayi_Gerekli_Mi?: boolean;
  Durum?: string;
};

type AirtableInviteCodeFields = {
  Kod?: string;
  Sinif?: string[];
  Olusturan_Ogretmen?: string[];
  Aktif_Mi?: boolean;
  Son_Kullanim_Tarihi?: string;
  Maksimum_Kullanim?: number;
  Kullanim_Sayisi?: number;
};

type CreateClassBody = {
  teacherAuthId?: string;
  className?: string;
  courseName?: string;
  academicYear?: string;
  term?: string;
  level?: string;
  description?: string;
  maxUsage?: number;
  joinApprovalRequired?: boolean;
};

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
}

function generateClassCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return `AS-${code}`;
}

function getDateAfterDays(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return date.toISOString().split("T")[0];
}

async function findTeacherByAuthId(authId: string) {
  const safeAuthId = escapeAirtableFormulaValue(authId);
  const filterFormula = `{Auth_ID}='${safeAuthId}'`;

  const result = await airtableRequest<AirtableListResponse<AirtableUserFields>>(
    `/${encodeURIComponent(
      AIRTABLE_TABLES.kullanicilar,
    )}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`,
  );

  return result.records[0];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateClassBody;

    const teacherAuthId = body.teacherAuthId?.trim();
    const className = body.className?.trim();
    const courseName = body.courseName?.trim();
    const academicYear = body.academicYear?.trim() || "2025-2026";
    const term = body.term?.trim() || "1. Dönem";
    const level = body.level?.trim() || "Lise";
    const description = body.description?.trim() || "";
    const maxUsage = Number(body.maxUsage || 40);
    const joinApprovalRequired = body.joinApprovalRequired ?? true;

    if (!teacherAuthId || !className || !courseName) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Sınıf oluşturmak için teacherAuthId, className ve courseName gereklidir.",
        },
        { status: 400 },
      );
    }

    const teacher = await findTeacherByAuthId(teacherAuthId);

    if (!teacher) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Öğretmen Airtable Kullanicilar tablosunda bulunamadı. Lütfen önce giriş yaparak kullanıcı eşitlemesini tamamlayın.",
        },
        { status: 404 },
      );
    }

    const classCode = generateClassCode();

    const createdClass = await airtableRequest<
      AirtableCreateResponse<AirtableClassFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}`, {
      method: "POST",
      body: {
        typecast: true,
        records: [
          {
            fields: {
              Sinif_Adi: className,
              Ders_Adi: courseName,
              Ogretmen: [teacher.id],
              Akademik_Yil: academicYear,
              Donem: term,
              Seviye: level,
              Aciklama: description,
              Aktif_Kod: classCode,
              Katilim_Onayi_Gerekli_Mi: joinApprovalRequired,
              Durum: "Aktif",
            },
          },
        ],
      },
    });

    const classRecord = createdClass.records[0];

    if (!classRecord) {
      return NextResponse.json(
        {
          ok: false,
          message: "Sınıf kaydı oluşturulamadı.",
        },
        { status: 500 },
      );
    }

    const createdInviteCode = await airtableRequest<
      AirtableCreateResponse<AirtableInviteCodeFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.davetKodlari)}`, {
      method: "POST",
      body: {
        typecast: true,
        records: [
          {
            fields: {
              Kod: classCode,
              Sinif: [classRecord.id],
              Olusturan_Ogretmen: [teacher.id],
              Aktif_Mi: true,
              Son_Kullanim_Tarihi: getDateAfterDays(90),
              Maksimum_Kullanim: maxUsage,
              Kullanim_Sayisi: 0,
            },
          },
        ],
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Sınıf ve davet kodu başarıyla oluşturuldu.",
      class: {
        id: classRecord.id,
        className: classRecord.fields.Sinif_Adi,
        courseName: classRecord.fields.Ders_Adi,
        academicYear: classRecord.fields.Akademik_Yil,
        term: classRecord.fields.Donem,
        level: classRecord.fields.Seviye,
        description: classRecord.fields.Aciklama,
        classCode,
      },
      inviteCode: {
        id: createdInviteCode.records[0]?.id,
        code: classCode,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Airtable sınıf oluşturma işlemi başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}