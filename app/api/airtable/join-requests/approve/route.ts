import { NextResponse } from "next/server";
import { AIRTABLE_TABLES, airtableRequest } from "@/lib/airtableClient";

type AirtableRecord<T> = {
  id: string;
  fields: T;
};

type AirtableListResponse<T> = {
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
};

type AirtableMembershipFields = {
  Uyelik_Adi?: string;
  Sinif?: string[];
  Kullanici?: string[];
  Uyelik_Rolu?: string;
  Durum?: string;
  Davet_Kodu?: string[];
  Katilma_Tarihi?: string;
  Onaylayan_Ogretmen?: string[];
  Onay_Tarihi?: string;
};

type AirtableInviteCodeFields = {
  Kod?: string;
  Kullanim_Sayisi?: number;
};

type ApproveJoinRequestBody = {
  teacherAuthId?: string;
  membershipId?: string;
};

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
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

async function safelyIncrementInviteUsage(inviteCodeId: string) {
  try {
    const inviteCode = await airtableRequest<
      AirtableRecord<AirtableInviteCodeFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.davetKodlari)}/${inviteCodeId}`);

    const currentCount = inviteCode.fields.Kullanim_Sayisi || 0;

    await airtableRequest<AirtableRecord<AirtableInviteCodeFields>>(
      `/${encodeURIComponent(AIRTABLE_TABLES.davetKodlari)}/${inviteCodeId}`,
      {
        method: "PATCH",
        body: {
          fields: {
            Kullanim_Sayisi: currentCount + 1,
          },
        },
      },
    );
  } catch {
    // Kullanim_Sayisi güncellenemezse onay işlemini bozmayalım.
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ApproveJoinRequestBody;

    const teacherAuthId = body.teacherAuthId?.trim();
    const membershipId = body.membershipId?.trim();

    if (!teacherAuthId || !membershipId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Onay işlemi için teacherAuthId ve membershipId gereklidir.",
        },
        { status: 400 },
      );
    }

    const teacher = await findTeacherByAuthId(teacherAuthId);

    if (!teacher) {
      return NextResponse.json(
        {
          ok: false,
          message: "Öğretmen Airtable üzerinde bulunamadı.",
        },
        { status: 404 },
      );
    }

    const membership = await airtableRequest<
      AirtableRecord<AirtableMembershipFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}/${membershipId}`);

    const classId = membership.fields.Sinif?.[0];

    if (!classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Katılım isteği herhangi bir sınıfa bağlı değil.",
        },
        { status: 400 },
      );
    }

    const classRecord = await airtableRequest<
      AirtableRecord<AirtableClassFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}/${classId}`);

    const teacherLinks = classRecord.fields.Ogretmen || [];

    if (!teacherLinks.includes(teacher.id)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu katılım isteğini onaylama yetkiniz yok.",
        },
        { status: 403 },
      );
    }

    const updatedMembership = await airtableRequest<
      AirtableRecord<AirtableMembershipFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}/${membershipId}`, {
      method: "PATCH",
      body: {
        typecast: true,
        fields: {
          Durum: "Aktif",
          Onaylayan_Ogretmen: [teacher.id],
        },
      },
    });

    const inviteCodeId = membership.fields.Davet_Kodu?.[0];

    if (inviteCodeId) {
      await safelyIncrementInviteUsage(inviteCodeId);
    }

    return NextResponse.json({
      ok: true,
      message: "Katılım isteği onaylandı.",
      membership: {
        id: updatedMembership.id,
        status: updatedMembership.fields.Durum,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Airtable katılım isteği onaylama işlemi başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}