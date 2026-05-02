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
  Akademik_Yil?: string;
  Donem?: string;
  Seviye?: string;
  Aciklama?: string;
  Aktif_Kod?: string;
  Katilim_Onayi_Gerekli_Mi?: boolean;
  Durum?: string;
};

type AirtableMembershipFields = {
  Uyelik_Adi?: string;
  Sinif?: string[];
  Kullanici?: string[];
  Uyelik_Rolu?: string;
  Durum?: string;
  Katilma_Tarihi?: string;
};

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const studentAuthId = url.searchParams.get("studentAuthId")?.trim();
    const classId = url.searchParams.get("classId")?.trim();

    if (!studentAuthId || !classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "studentAuthId ve classId parametreleri gereklidir.",
        },
        { status: 400 },
      );
    }

    const student = await findStudentByAuthId(studentAuthId);

    if (!student) {
      return NextResponse.json(
        {
          ok: false,
          message: "Öğrenci Airtable üzerinde bulunamadı.",
        },
        { status: 404 },
      );
    }

    const [classRecord, membershipsResponse] = await Promise.all([
      airtableRequest<AirtableRecord<AirtableClassFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}/${classId}`,
      ),
      airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}?maxRecords=100`,
      ),
    ]);

    const membership = membershipsResponse.records.find((record) => {
      const linkedClasses = record.fields.Sinif || [];
      const linkedUsers = record.fields.Kullanici || [];

      return linkedClasses.includes(classId) && linkedUsers.includes(student.id);
    });

    if (!membership) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu sınıf için öğrenci üyeliği bulunamadı.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({
      ok: true,
      class: {
        id: classRecord.id,
        className: classRecord.fields.Sinif_Adi || "İsimsiz Sınıf",
        courseName: classRecord.fields.Ders_Adi || "Ders belirtilmedi",
        academicYear: classRecord.fields.Akademik_Yil || "2025-2026",
        term: classRecord.fields.Donem || "1. Dönem",
        level: classRecord.fields.Seviye || "Seviye belirtilmedi",
        description: classRecord.fields.Aciklama || "",
        classCode: classRecord.fields.Aktif_Kod || "",
        status: classRecord.fields.Durum || "Aktif",
      },
      membership: {
        id: membership.id,
        status: membership.fields.Durum || "Onay Bekliyor",
        joinedAt: membership.fields.Katilma_Tarihi || "",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Öğrenci sınıf detay verisi alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
