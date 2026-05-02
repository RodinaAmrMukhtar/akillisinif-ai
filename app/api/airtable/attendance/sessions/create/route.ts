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

type AirtableAttendanceSessionFields = {
  Oturum_Adi?: string;
  Sinif?: string[];
  Ogretmen?: string[];
  Oturum_Kodu?: string;
  Tarih?: string;
  Ders_Saati?: number;
  Baslangic_Zamani?: string;
  Bitis_Zamani?: string;
  Aktif_Mi?: boolean;
  Durum?: string;
};

type CreateSessionBody = {
  teacherAuthId?: string;
  classId?: string;
  lessonHour?: number;
};

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function addMinutes(date: Date, minutes: number) {
  const copy = new Date(date);
  copy.setMinutes(copy.getMinutes() + minutes);
  return copy;
}

function generateAttendanceCode() {
  return `YK-${Math.floor(100000 + Math.random() * 900000)}`;
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
    const body = (await request.json()) as CreateSessionBody;

    const teacherAuthId = body.teacherAuthId?.trim();
    const classId = body.classId?.trim();
    const lessonHour = Number(body.lessonHour || 1);

    if (!teacherAuthId || !classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Yoklama oturumu için teacherAuthId ve classId gereklidir.",
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
          message: "Bu sınıf için yoklama oturumu oluşturma yetkiniz yok.",
        },
        { status: 403 },
      );
    }

    const now = new Date();
    const endTime = addMinutes(now, 20);
    const code = generateAttendanceCode();
    const today = getTodayDate();

    const sessionName = `${classRecord.fields.Sinif_Adi || "Sınıf"} - ${today} - ${lessonHour}. Ders`;

    const createdSession = await airtableRequest<
      AirtableCreateResponse<AirtableAttendanceSessionFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.yoklamaOturumlari)}`, {
      method: "POST",
      body: {
        typecast: true,
        records: [
          {
            fields: {
              Oturum_Adi: sessionName,
              Sinif: [classId],
              Ogretmen: [teacher.id],
              Oturum_Kodu: code,
              Tarih: today,
              Ders_Saati: lessonHour,
              Baslangic_Zamani: now.toISOString(),
              Bitis_Zamani: endTime.toISOString(),
              Aktif_Mi: true,
              Durum: "Aktif",
            },
          },
        ],
      },
    });

    const session = createdSession.records[0];

    return NextResponse.json({
      ok: true,
      message: "Yoklama oturumu oluşturuldu.",
      session: {
        id: session.id,
        code,
        classId,
        className: classRecord.fields.Sinif_Adi || "Sınıf",
        courseName: classRecord.fields.Ders_Adi || "Ders",
        date: today,
        lessonHour,
        startsAt: now.toISOString(),
        endsAt: endTime.toISOString(),
        status: "Aktif",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Yoklama oturumu oluşturulamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
