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
  Aciklama?: string;
  Teslim_Tarihi?: string;
  Maksimum_Puan?: number;
  Odev_Turu?: string;
  Zorluk_Seviyesi?: string;
  Kaynak_Link?: string;
  Durum?: string;
};

type CreateAssignmentBody = {
  teacherAuthId?: string;
  classId?: string;
  title?: string;
  description?: string;
  dueDate?: string;
  maxPoints?: number;
  assignmentType?: string;
  difficulty?: string;
  resourceLink?: string;
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateAssignmentBody;

    const teacherAuthId = body.teacherAuthId?.trim();
    const classId = body.classId?.trim();
    const title = body.title?.trim();
    const description = body.description?.trim() || "";
    const dueDate = body.dueDate?.trim();
    const maxPoints = Number(body.maxPoints || 100);
    const assignmentType = body.assignmentType?.trim() || "Odev";
    const difficulty = body.difficulty?.trim() || "Orta";
    const resourceLink = body.resourceLink?.trim() || "";

    if (!teacherAuthId || !classId || !title || !dueDate) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Ödev oluşturmak için teacherAuthId, classId, title ve dueDate gereklidir.",
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

    const classRecord = await airtableRequest<
      AirtableRecord<AirtableClassFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}/${classId}`);

    const teacherLinks = classRecord.fields.Ogretmen || [];

    if (!teacherLinks.includes(teacher.id)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu sınıf için ödev oluşturma yetkiniz yok.",
        },
        { status: 403 },
      );
    }

    const fields: AirtableAssignmentFields = {
      Odev_Basligi: title,
      Sinif: [classId],
      Ogretmen: [teacher.id],
      Aciklama: description,
      Teslim_Tarihi: dueDate,
      Maksimum_Puan: maxPoints,
      Odev_Turu: assignmentType,
      Zorluk_Seviyesi: difficulty,
      Durum: "Yayinda",
    };

    if (resourceLink) {
      fields.Kaynak_Link = resourceLink;
    }

    const createdAssignment = await airtableRequest<
      AirtableCreateResponse<AirtableAssignmentFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.odevler)}`, {
      method: "POST",
      body: {
        typecast: true,
        records: [
          {
            fields,
          },
        ],
      },
    });

    const assignment = createdAssignment.records[0];

    return NextResponse.json({
      ok: true,
      message: "Ödev başarıyla oluşturuldu.",
      assignment: {
        id: assignment.id,
        title: assignment.fields.Odev_Basligi,
        dueDate: assignment.fields.Teslim_Tarihi,
        status: assignment.fields.Durum,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Airtable ödev oluşturma işlemi başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
