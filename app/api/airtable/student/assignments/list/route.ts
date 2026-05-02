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

type AirtableMembershipFields = {
  Sinif?: string[];
  Kullanici?: string[];
  Uyelik_Rolu?: string;
  Durum?: string;
};

type AirtableClassFields = {
  Sinif_Adi?: string;
  Ders_Adi?: string;
};

type AirtableAssignmentFields = {
  Odev_Basligi?: string;
  Sinif?: string[];
  Aciklama?: string;
  Teslim_Tarihi?: string;
  Maksimum_Puan?: number;
  Odev_Turu?: string;
  Zorluk_Seviyesi?: string;
  Kaynak_Link?: string;
  Durum?: string;
};

type AirtableSubmissionFields = {
  Odev?: string[];
  Ogrenci?: string[];
  Teslim_Metni?: string;
  Teslim_Tarihi?: string;
  Durum?: string;
  Puan?: number;
  Ogretmen_Geri_Bildirimi?: string;
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

    const [membershipsResponse, assignmentsResponse, classesResponse, submissionsResponse] =
      await Promise.all([
        airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
          `/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}?maxRecords=100`,
        ),
        airtableRequest<AirtableListResponse<AirtableAssignmentFields>>(
          `/${encodeURIComponent(AIRTABLE_TABLES.odevler)}?maxRecords=100`,
        ),
        airtableRequest<AirtableListResponse<AirtableClassFields>>(
          `/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}?maxRecords=100`,
        ),
        airtableRequest<AirtableListResponse<AirtableSubmissionFields>>(
          `/${encodeURIComponent(AIRTABLE_TABLES.odevTeslimleri)}?maxRecords=100`,
        ),
      ]);

    const activeClassIds = membershipsResponse.records
      .filter((membership) => {
        const linkedUsers = membership.fields.Kullanici || [];
        return (
          linkedUsers.includes(student.id) &&
          membership.fields.Uyelik_Rolu === "Ogrenci" &&
          membership.fields.Durum === "Aktif"
        );
      })
      .flatMap((membership) => membership.fields.Sinif || []);

    const classMap = new Map(
      classesResponse.records.map((record) => [record.id, record]),
    );

    const assignments = assignmentsResponse.records
      .filter((assignment) => {
        const linkedClasses = assignment.fields.Sinif || [];
        return (
          assignment.fields.Durum === "Yayinda" &&
          linkedClasses.some((classId) => activeClassIds.includes(classId))
        );
      })
      .map((assignment) => {
        const classId = assignment.fields.Sinif?.[0] || "";
        const classRecord = classMap.get(classId);

        const submission = submissionsResponse.records.find((submissionRecord) => {
          const linkedAssignments = submissionRecord.fields.Odev || [];
          const linkedStudents = submissionRecord.fields.Ogrenci || [];

          return (
            linkedAssignments.includes(assignment.id) &&
            linkedStudents.includes(student.id)
          );
        });

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
          submission: submission
            ? {
                id: submission.id,
                text: submission.fields.Teslim_Metni || "",
                submittedAt: submission.fields.Teslim_Tarihi || "",
                status: submission.fields.Durum || "Teslim Edildi",
                points: submission.fields.Puan ?? null,
                feedback: submission.fields.Ogretmen_Geri_Bildirimi || "",
              }
            : null,
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
        message: "Öğrenci ödevleri listelenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
