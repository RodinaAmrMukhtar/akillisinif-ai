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

type AirtableClassFields = {
  Sinif_Adi?: string;
  Ders_Adi?: string;
  Ogretmen?: string[];
};

type AirtableAssignmentFields = {
  Odev_Basligi?: string;
  Sinif?: string[];
  Ogretmen?: string[];
  Maksimum_Puan?: number;
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
};

type AirtableGradeFields = {
  Not_Kaydi?: string;
  Ogrenci?: string[];
  Sinif?: string[];
  Ogretmen?: string[];
  Not_Turu?: string;
  Puan?: number;
  Maksimum_Puan?: number;
  Tarih?: string;
  Aciklama?: string;
};

type GradeSubmissionBody = {
  teacherAuthId?: string;
  submissionId?: string;
  score?: number;
  feedback?: string;
};

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GradeSubmissionBody;

    const teacherAuthId = body.teacherAuthId?.trim();
    const submissionId = body.submissionId?.trim();
    const score = Number(body.score);
    const feedback = body.feedback?.trim() || "";

    if (!teacherAuthId || !submissionId || Number.isNaN(score)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Değerlendirme için teacherAuthId, submissionId ve score gereklidir.",
        },
        { status: 400 },
      );
    }

    if (score < 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Puan 0'dan küçük olamaz.",
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

    const submission = await airtableRequest<
      AirtableRecord<AirtableSubmissionFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.odevTeslimleri)}/${submissionId}`);

    const assignmentId = submission.fields.Odev?.[0];
    const studentId = submission.fields.Ogrenci?.[0];
    const classId = submission.fields.Sinif?.[0];

    if (!assignmentId || !studentId || !classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Teslim kaydı ödev, öğrenci veya sınıf bağlantısı içermiyor.",
        },
        { status: 400 },
      );
    }

    const [assignment, classRecord, student] = await Promise.all([
      airtableRequest<AirtableRecord<AirtableAssignmentFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.odevler)}/${assignmentId}`,
      ),
      airtableRequest<AirtableRecord<AirtableClassFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}/${classId}`,
      ),
      airtableRequest<AirtableRecord<AirtableUserFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.kullanicilar)}/${studentId}`,
      ),
    ]);

    const classTeacherLinks = classRecord.fields.Ogretmen || [];
    const assignmentTeacherLinks = assignment.fields.Ogretmen || [];

    if (
      !classTeacherLinks.includes(teacher.id) &&
      !assignmentTeacherLinks.includes(teacher.id)
    ) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu teslimi değerlendirme yetkiniz yok.",
        },
        { status: 403 },
      );
    }

    const maxPoints = assignment.fields.Maksimum_Puan || 100;

    if (score > maxPoints) {
      return NextResponse.json(
        {
          ok: false,
          message: `Puan maksimum ${maxPoints} değerinden büyük olamaz.`,
        },
        { status: 400 },
      );
    }

    const updatedSubmission = await airtableRequest<
      AirtableRecord<AirtableSubmissionFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.odevTeslimleri)}/${submissionId}`, {
      method: "PATCH",
      body: {
        typecast: true,
        fields: {
          Puan: score,
          Ogretmen_Geri_Bildirimi: feedback,
          Durum: "Teslim Edildi",
        },
      },
    });

    const gradeName = `${student.fields.Ad_Soyad || "Öğrenci"} - ${
      assignment.fields.Odev_Basligi || "Ödev"
    }`;

    const allGrades = await airtableRequest<AirtableListResponse<AirtableGradeFields>>(
      `/${encodeURIComponent(AIRTABLE_TABLES.notlar)}?maxRecords=100`,
    );

    const existingGrade = allGrades.records.find((grade) => {
      const linkedStudents = grade.fields.Ogrenci || [];
      const linkedClasses = grade.fields.Sinif || [];

      return (
        grade.fields.Not_Kaydi === gradeName &&
        linkedStudents.includes(studentId) &&
        linkedClasses.includes(classId)
      );
    });

    const gradeFields: AirtableGradeFields = {
      Not_Kaydi: gradeName,
      Ogrenci: [studentId],
      Sinif: [classId],
      Ogretmen: [teacher.id],
      Not_Turu: "Odev",
      Puan: score,
      Maksimum_Puan: maxPoints,
      Tarih: getTodayDate(),
      Aciklama: feedback
        ? `Ödev değerlendirmesi: ${feedback}`
        : "Ödev teslimi öğretmen tarafından değerlendirildi.",
    };

    let gradeRecordId = "";

    if (existingGrade) {
      const updatedGrade = await airtableRequest<AirtableRecord<AirtableGradeFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.notlar)}/${existingGrade.id}`,
        {
          method: "PATCH",
          body: {
            typecast: true,
            fields: gradeFields,
          },
        },
      );

      gradeRecordId = updatedGrade.id;
    } else {
      const createdGrade = await airtableRequest<
        AirtableCreateResponse<AirtableGradeFields>
      >(`/${encodeURIComponent(AIRTABLE_TABLES.notlar)}`, {
        method: "POST",
        body: {
          typecast: true,
          records: [
            {
              fields: gradeFields,
            },
          ],
        },
      });

      gradeRecordId = createdGrade.records[0]?.id || "";
    }

    return NextResponse.json({
      ok: true,
      message: "Teslim değerlendirildi ve Notlar tablosuna işlendi.",
      submission: {
        id: updatedSubmission.id,
        status: updatedSubmission.fields.Durum,
        score: updatedSubmission.fields.Puan,
        feedback: updatedSubmission.fields.Ogretmen_Geri_Bildirimi,
      },
      grade: {
        id: gradeRecordId,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Teslim değerlendirme işlemi başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
