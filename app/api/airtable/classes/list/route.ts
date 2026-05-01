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
  Akademik_Yil?: string;
  Donem?: string;
  Seviye?: string;
  Aciklama?: string;
  Aktif_Kod?: string;
  Katilim_Onayi_Gerekli_Mi?: boolean;
  Durum?: string;
  Ogrenci_Sayisi?: number;
  Riskli_Ogrenci_Sayisi?: number;
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

    const classesResponse = await airtableRequest<
      AirtableListResponse<AirtableClassFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}?maxRecords=100`);

    const teacherClasses = classesResponse.records.filter((record) => {
      const teacherLinks = record.fields.Ogretmen || [];

      return teacherLinks.includes(teacher.id);
    });

    return NextResponse.json({
      ok: true,
      classes: teacherClasses.map((record) => ({
        id: record.id,
        className: record.fields.Sinif_Adi || "İsimsiz Sınıf",
        courseName: record.fields.Ders_Adi || "Ders belirtilmedi",
        academicYear: record.fields.Akademik_Yil || "2025-2026",
        term: record.fields.Donem || "1. Dönem",
        level: record.fields.Seviye || "Seviye belirtilmedi",
        description: record.fields.Aciklama || "",
        classCode: record.fields.Aktif_Kod || "",
        joinApprovalRequired:
          record.fields.Katilim_Onayi_Gerekli_Mi ?? true,
        status: record.fields.Durum || "Aktif",
        studentCount: record.fields.Ogrenci_Sayisi || 0,
        riskyStudentCount: record.fields.Riskli_Ogrenci_Sayisi || 0,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Airtable sınıf listeleme işlemi başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}