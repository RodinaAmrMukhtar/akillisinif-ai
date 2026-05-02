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

type AirtableMembershipFields = {
  Sinif?: string[];
  Kullanici?: string[];
  Uyelik_Rolu?: string;
  Durum?: string;
};

type AirtableAssignmentFields = {
  Odev_Basligi?: string;
  Sinif?: string[];
  Teslim_Tarihi?: string;
  Durum?: string;
};

type AirtableSubmissionFields = {
  Teslim_Adi?: string;
  Odev?: string[];
  Ogrenci?: string[];
  Sinif?: string[];
  Teslim_Metni?: string;
  Teslim_Tarihi?: string;
  Durum?: string;
  Gec_Mi?: boolean;
};

type SubmitAssignmentBody = {
  studentAuthId?: string;
  assignmentId?: string;
  submissionText?: string;
};

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function isLate(dueDate?: string) {
  if (!dueDate) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return today > due;
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SubmitAssignmentBody;

    const studentAuthId = body.studentAuthId?.trim();
    const assignmentId = body.assignmentId?.trim();
    const submissionText = body.submissionText?.trim();

    if (!studentAuthId || !assignmentId || !submissionText) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Teslim için studentAuthId, assignmentId ve submissionText gereklidir.",
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

    const assignment = await airtableRequest<
      AirtableRecord<AirtableAssignmentFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.odevler)}/${assignmentId}`);

    const classId = assignment.fields.Sinif?.[0];

    if (!classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Ödev herhangi bir sınıfa bağlı değil.",
        },
        { status: 400 },
      );
    }

    const [membershipsResponse, submissionsResponse] = await Promise.all([
      airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableSubmissionFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.odevTeslimleri)}?maxRecords=100`,
      ),
    ]);

    const activeMembership = membershipsResponse.records.find((membership) => {
      const linkedUsers = membership.fields.Kullanici || [];
      const linkedClasses = membership.fields.Sinif || [];

      return (
        linkedUsers.includes(student.id) &&
        linkedClasses.includes(classId) &&
        membership.fields.Uyelik_Rolu === "Ogrenci" &&
        membership.fields.Durum === "Aktif"
      );
    });

    if (!activeMembership) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu ödevi teslim etmek için sınıfta aktif öğrenci olmanız gerekir.",
        },
        { status: 403 },
      );
    }

    const existingSubmission = submissionsResponse.records.find((submission) => {
      const linkedAssignments = submission.fields.Odev || [];
      const linkedStudents = submission.fields.Ogrenci || [];

      return (
        linkedAssignments.includes(assignmentId) &&
        linkedStudents.includes(student.id)
      );
    });

    const late = isLate(assignment.fields.Teslim_Tarihi);
    const submissionStatus = late ? "Gec Teslim" : "Teslim Edildi";
    const today = getTodayDate();

    if (existingSubmission) {
      const updatedSubmission = await airtableRequest<
        AirtableRecord<AirtableSubmissionFields>
      >(
        `/${encodeURIComponent(AIRTABLE_TABLES.odevTeslimleri)}/${
          existingSubmission.id
        }`,
        {
          method: "PATCH",
          body: {
            typecast: true,
            fields: {
              Teslim_Metni: submissionText,
              Teslim_Tarihi: today,
              Durum: submissionStatus,
              Gec_Mi: late,
            },
          },
        },
      );

      return NextResponse.json({
        ok: true,
        action: "updated",
        message: "Ödev tesliminiz güncellendi.",
        submission: {
          id: updatedSubmission.id,
          status: updatedSubmission.fields.Durum,
        },
      });
    }

    const submissionName = `${student.fields.Ad_Soyad || "Öğrenci"} - ${
      assignment.fields.Odev_Basligi || "Ödev"
    }`;

    const createdSubmission = await airtableRequest<
      AirtableCreateResponse<AirtableSubmissionFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.odevTeslimleri)}`, {
      method: "POST",
      body: {
        typecast: true,
        records: [
          {
            fields: {
              Teslim_Adi: submissionName,
              Odev: [assignmentId],
              Ogrenci: [student.id],
              Sinif: [classId],
              Teslim_Metni: submissionText,
              Teslim_Tarihi: today,
              Durum: submissionStatus,
              Gec_Mi: late,
            },
          },
        ],
      },
    });

    return NextResponse.json({
      ok: true,
      action: "created",
      message: "Ödev tesliminiz başarıyla kaydedildi.",
      submission: {
        id: createdSubmission.records[0]?.id,
        status: submissionStatus,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Ödev teslim işlemi başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
