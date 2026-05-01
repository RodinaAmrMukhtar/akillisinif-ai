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
  Davet_Kodu?: string[];
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

function isActiveStudentMembership(record: AirtableRecord<AirtableMembershipFields>) {
  return record.fields.Uyelik_Rolu === "Ogrenci" && record.fields.Durum === "Aktif";
}

function isPendingStudentMembership(record: AirtableRecord<AirtableMembershipFields>) {
  return (
    record.fields.Uyelik_Rolu === "Ogrenci" &&
    record.fields.Durum === "Onay Bekliyor"
  );
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

    const [classesResponse, membershipsResponse] = await Promise.all([
      airtableRequest<AirtableListResponse<AirtableClassFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}?maxRecords=100`,
      ),
    ]);

    const teacherClasses = classesResponse.records.filter((record) => {
      const teacherLinks = record.fields.Ogretmen || [];
      return teacherLinks.includes(teacher.id);
    });

    const teacherClassIds = teacherClasses.map((record) => record.id);

    const classSummaries = teacherClasses.map((classRecord) => {
      const classMemberships = membershipsResponse.records.filter((membership) => {
        const linkedClasses = membership.fields.Sinif || [];
        return linkedClasses.includes(classRecord.id);
      });

      const activeStudentCount = classMemberships.filter(isActiveStudentMembership).length;
      const pendingJoinRequestCount = classMemberships.filter(isPendingStudentMembership).length;

      return {
        id: classRecord.id,
        className: classRecord.fields.Sinif_Adi || "İsimsiz Sınıf",
        courseName: classRecord.fields.Ders_Adi || "Ders belirtilmedi",
        academicYear: classRecord.fields.Akademik_Yil || "2025-2026",
        term: classRecord.fields.Donem || "1. Dönem",
        status: classRecord.fields.Durum || "Aktif",
        classCode: classRecord.fields.Aktif_Kod || "",
        studentCount: activeStudentCount,
        pendingJoinRequestCount,
        riskyStudentCount: 0,
      };
    });

    const activeClassCount = teacherClasses.filter(
      (record) => (record.fields.Durum || "Aktif") === "Aktif",
    ).length;

    const activeStudentIds = new Set<string>();

    membershipsResponse.records.forEach((membership) => {
      const linkedClasses = membership.fields.Sinif || [];
      const linkedUsers = membership.fields.Kullanici || [];
      const belongsToTeacherClass = linkedClasses.some((classId) =>
        teacherClassIds.includes(classId),
      );

      if (belongsToTeacherClass && isActiveStudentMembership(membership)) {
        linkedUsers.forEach((userId) => activeStudentIds.add(userId));
      }
    });

    const pendingJoinRequestCount = membershipsResponse.records.filter((membership) => {
      const linkedClasses = membership.fields.Sinif || [];
      const belongsToTeacherClass = linkedClasses.some((classId) =>
        teacherClassIds.includes(classId),
      );

      return belongsToTeacherClass && isPendingStudentMembership(membership);
    }).length;

    return NextResponse.json({
      ok: true,
      dashboard: {
        activeClassCount,
        totalStudentCount: activeStudentIds.size,
        pendingJoinRequestCount,
        highRiskStudentCount: 0,
        classSummaries,
        riskModuleStatus:
          "Risk analizi modülü gerçek veriye bağlanmadığı için şu anda 0 gösteriliyor.",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Airtable öğretmen dashboard verisi alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
