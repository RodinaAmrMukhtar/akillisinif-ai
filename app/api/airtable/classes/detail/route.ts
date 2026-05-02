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

function formatStudent(
  membership: AirtableRecord<AirtableMembershipFields>,
  student?: AirtableRecord<AirtableUserFields>,
) {
  return {
    membershipId: membership.id,
    studentId: student?.id || "",
    studentName: student?.fields.Ad_Soyad || "Öğrenci",
    studentEmail: student?.fields.Eposta || "",
    schoolNumber: student?.fields.Okul_No || "Tanımlanmadı",
    status: membership.fields.Durum || "Onay Bekliyor",
    joinedAt: membership.fields.Katilma_Tarihi || "",
  };
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const teacherAuthId = url.searchParams.get("teacherAuthId")?.trim();
    const classId = url.searchParams.get("classId")?.trim();

    if (!teacherAuthId || !classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "teacherAuthId ve classId parametreleri gereklidir.",
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

    const [classRecord, membershipsResponse, usersResponse] = await Promise.all([
      airtableRequest<AirtableRecord<AirtableClassFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}/${classId}`,
      ),
      airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableUserFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.kullanicilar)}?maxRecords=100`,
      ),
    ]);

    const teacherLinks = classRecord.fields.Ogretmen || [];

    if (!teacherLinks.includes(teacher.id)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu sınıfı görüntüleme yetkiniz yok.",
        },
        { status: 403 },
      );
    }

    const userMap = new Map(usersResponse.records.map((record) => [record.id, record]));

    const classMemberships = membershipsResponse.records.filter((membership) => {
      const linkedClasses = membership.fields.Sinif || [];
      const role = membership.fields.Uyelik_Rolu;

      return linkedClasses.includes(classId) && role === "Ogrenci";
    });

    const activeStudents = classMemberships
      .filter((membership) => membership.fields.Durum === "Aktif")
      .map((membership) => {
        const studentId = membership.fields.Kullanici?.[0] || "";
        return formatStudent(membership, userMap.get(studentId));
      });

    const pendingRequests = classMemberships
      .filter((membership) => membership.fields.Durum === "Onay Bekliyor")
      .map((membership) => {
        const studentId = membership.fields.Kullanici?.[0] || "";
        return formatStudent(membership, userMap.get(studentId));
      });

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
        joinApprovalRequired:
          classRecord.fields.Katilim_Onayi_Gerekli_Mi ?? true,
        status: classRecord.fields.Durum || "Aktif",
        activeStudentCount: activeStudents.length,
        pendingRequestCount: pendingRequests.length,
        riskyStudentCount: 0,
      },
      activeStudents,
      pendingRequests,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sınıf detay verisi alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
