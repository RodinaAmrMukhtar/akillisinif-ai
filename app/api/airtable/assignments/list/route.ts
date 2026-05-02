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
};

type AirtableAssignmentFields = {
  Odev_Basligi?: string;
  Sinif?: string[];
  Ogretmen?: string[];
  Aciklama?: string;
  Teslim_Tarihi?: string;
  Maksimum_Puan?: number;
  Odev_Turu?: string;
  Zorluk_Seviyesi?: string;
  Kaynak_Link?: string;
  Durum?: string;
  Olusturma_Tarihi?: string;
};

type AirtableSubmissionFields = {
  Teslim_Adi?: string;
  Odev?: string[];
  Ogrenci?: string[];
  Sinif?: string[];
  Teslim_Metni?: string;
  Teslim_Tarihi?: string;
  Durum?: string;
  Puan?: number;
  Ogretmen_Geri_Bildirimi?: string;
  Gec_Mi?: boolean;
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

    const [
      assignmentsResponse,
      classesResponse,
      submissionsResponse,
      usersResponse,
    ] = await Promise.all([
      airtableRequest<AirtableListResponse<AirtableAssignmentFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.odevler)}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableClassFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableSubmissionFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.odevTeslimleri)}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableUserFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.kullanicilar)}?maxRecords=100`,
      ),
    ]);

    const classMap = new Map(
      classesResponse.records.map((record) => [record.id, record]),
    );

    const userMap = new Map(
      usersResponse.records.map((record) => [record.id, record]),
    );

    const teacherAssignments = assignmentsResponse.records.filter((assignment) => {
      const teacherLinks = assignment.fields.Ogretmen || [];
      return teacherLinks.includes(teacher.id);
    });

    const assignments = teacherAssignments.map((assignment) => {
      const classId = assignment.fields.Sinif?.[0] || "";
      const classRecord = classMap.get(classId);

      const assignmentSubmissions = submissionsResponse.records.filter((submission) => {
        const linkedAssignments = submission.fields.Odev || [];
        return linkedAssignments.includes(assignment.id);
      });

      const submittedCount = assignmentSubmissions.filter((submission) =>
        ["Teslim Edildi", "Gec Teslim", "Degerlendirildi"].includes(
          submission.fields.Durum || "",
        ),
      ).length;

      const gradedCount = assignmentSubmissions.filter(
        (submission) => submission.fields.Durum === "Degerlendirildi",
      ).length;

      return {
        id: assignment.id,
        title: assignment.fields.Odev_Basligi || "İsimsiz Ödev",
        classId,
        className: classRecord?.fields.Sinif_Adi || "Sınıf",
        courseName: classRecord?.fields.Ders_Adi || "Ders",
        description: assignment.fields.Aciklama || "",
        dueDate: assignment.fields.Teslim_Tarihi || "",
        maxPoints: assignment.fields.Maksimum_Puan || 100,
        assignmentType: assignment.fields.Odev_Turu || "Odev",
        difficulty: assignment.fields.Zorluk_Seviyesi || "Orta",
        resourceLink: assignment.fields.Kaynak_Link || "",
        status: assignment.fields.Durum || "Yayinda",
        submittedCount,
        gradedCount,
        submissions: assignmentSubmissions.map((submission) => {
          const studentId = submission.fields.Ogrenci?.[0] || "";
          const student = userMap.get(studentId);

          return {
            id: submission.id,
            studentId,
            studentName: student?.fields.Ad_Soyad || "Öğrenci",
            studentEmail: student?.fields.Eposta || "",
            schoolNumber: student?.fields.Okul_No || "Tanımlanmadı",
            submissionText: submission.fields.Teslim_Metni || "",
            submittedAt: submission.fields.Teslim_Tarihi || "",
            status: submission.fields.Durum || "Teslim Edildi",
            score: submission.fields.Puan ?? null,
            feedback: submission.fields.Ogretmen_Geri_Bildirimi || "",
            late: submission.fields.Gec_Mi ?? false,
          };
        }),
      };
    });

    return NextResponse.json({
      ok: true,
      assignments,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Airtable ödev listeleme işlemi başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
