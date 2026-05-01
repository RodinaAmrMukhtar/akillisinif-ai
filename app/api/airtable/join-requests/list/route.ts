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
  Okul_No?: string;
};

type AirtableClassFields = {
  Sinif_Adi?: string;
  Ders_Adi?: string;
  Ogretmen?: string[];
  Aktif_Kod?: string;
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const teacherAuthId = url.searchParams.get("teacherAuthId")?.trim();

    if (!teacherAuthId) {
      return NextResponse.json(
        {
          ok: false,
          message: "teacherAuthId parametresi gereklidir.",
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

    const [classesResponse, membershipsResponse, usersResponse] =
      await Promise.all([
        airtableRequest<AirtableListResponse<AirtableClassFields>>(
          `/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}?maxRecords=100`,
        ),
        airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
          `/${encodeURIComponent(
            AIRTABLE_TABLES.sinifUyelikleri,
          )}?maxRecords=100`,
        ),
        airtableRequest<AirtableListResponse<AirtableUserFields>>(
          `/${encodeURIComponent(AIRTABLE_TABLES.kullanicilar)}?maxRecords=100`,
        ),
      ]);

    const teacherClasses = classesResponse.records.filter((record) => {
      const teacherLinks = record.fields.Ogretmen || [];
      return teacherLinks.includes(teacher.id);
    });

    const teacherClassIds = teacherClasses.map((record) => record.id);

    const classMap = new Map(
      classesResponse.records.map((record) => [record.id, record]),
    );

    const userMap = new Map(
      usersResponse.records.map((record) => [record.id, record]),
    );

    const pendingRequests = membershipsResponse.records
      .filter((record) => {
        const linkedClasses = record.fields.Sinif || [];
        const status = record.fields.Durum;

        return (
          status === "Onay Bekliyor" &&
          linkedClasses.some((classId) => teacherClassIds.includes(classId))
        );
      })
      .map((record) => {
        const classId = record.fields.Sinif?.[0] || "";
        const userId = record.fields.Kullanici?.[0] || "";
        const classRecord = classMap.get(classId);
        const studentRecord = userMap.get(userId);

        return {
          id: record.id,
          studentName: studentRecord?.fields.Ad_Soyad || "Öğrenci",
          studentEmail: studentRecord?.fields.Eposta || "",
          schoolNumber: studentRecord?.fields.Okul_No || "Tanımlanmadı",
          className: classRecord?.fields.Sinif_Adi || "Sınıf",
          courseName: classRecord?.fields.Ders_Adi || "Ders",
          classCode: classRecord?.fields.Aktif_Kod || "",
          requestedAt: record.fields.Katilma_Tarihi || "",
          status: record.fields.Durum || "Onay Bekliyor",
        };
      });

    return NextResponse.json({
      ok: true,
      requests: pendingRequests,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Airtable katılım isteği listeleme işlemi başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}