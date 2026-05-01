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

    if (!studentAuthId) {
      return NextResponse.json(
        {
          ok: false,
          message: "studentAuthId parametresi gereklidir.",
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

    const [membershipsResponse, classesResponse] = await Promise.all([
      airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableClassFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}?maxRecords=100`,
      ),
    ]);

    const classMap = new Map(
      classesResponse.records.map((record) => [record.id, record]),
    );

    const studentMemberships = membershipsResponse.records.filter((record) => {
      const linkedUsers = record.fields.Kullanici || [];
      return linkedUsers.includes(student.id);
    });

    const classes = studentMemberships.map((membership) => {
      const classId = membership.fields.Sinif?.[0] || "";
      const classRecord = classMap.get(classId);

      return {
        membershipId: membership.id,
        classId,
        className: classRecord?.fields.Sinif_Adi || "Sınıf",
        courseName: classRecord?.fields.Ders_Adi || "Ders",
        academicYear: classRecord?.fields.Akademik_Yil || "2025-2026",
        term: classRecord?.fields.Donem || "1. Dönem",
        level: classRecord?.fields.Seviye || "Seviye belirtilmedi",
        description: classRecord?.fields.Aciklama || "",
        classCode: classRecord?.fields.Aktif_Kod || "",
        status: membership.fields.Durum || "Onay Bekliyor",
        joinedAt: membership.fields.Katilma_Tarihi || "",
      };
    });

    return NextResponse.json({
      ok: true,
      classes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Öğrenci sınıfları listeleme işlemi başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}