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

type AirtableAttendanceSessionFields = {
  Sinif?: string[];
  Ogretmen?: string[];
  Oturum_Kodu?: string;
  Tarih?: string;
  Ders_Saati?: number;
  Aktif_Mi?: boolean;
  Durum?: string;
};

type AirtableAttendanceFields = {
  Yoklama_Kaydi?: string;
  Ogrenci?: string[];
  Sinif?: string[];
  Ogretmen?: string[];
  Tarih?: string;
  Durum?: string;
  Ders_Saati?: number;
  Aciklama?: string;
};

type MarkAttendanceBody = {
  studentAuthId?: string;
  code?: string;
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

async function findSessionByCode(code: string) {
  const safeCode = escapeAirtableFormulaValue(code);
  const filterFormula = `{Oturum_Kodu}='${safeCode}'`;

  const result = await airtableRequest<
    AirtableListResponse<AirtableAttendanceSessionFields>
  >(
    `/${encodeURIComponent(
      AIRTABLE_TABLES.yoklamaOturumlari,
    )}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`,
  );

  return result.records[0];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as MarkAttendanceBody;

    const studentAuthId = body.studentAuthId?.trim();
    const code = body.code?.trim().toUpperCase();

    if (!studentAuthId || !code) {
      return NextResponse.json(
        {
          ok: false,
          message: "Yoklama için studentAuthId ve code gereklidir.",
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

    const session = await findSessionByCode(code);

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu yoklama kodu bulunamadı.",
        },
        { status: 404 },
      );
    }

    if (session.fields.Aktif_Mi === false || session.fields.Durum !== "Aktif") {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu yoklama oturumu aktif değil.",
        },
        { status: 400 },
      );
    }

    const classId = session.fields.Sinif?.[0];
    const teacherId = session.fields.Ogretmen?.[0];

    if (!classId || !teacherId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Yoklama oturumu sınıf veya öğretmen bilgisi içermiyor.",
        },
        { status: 400 },
      );
    }

    const [membershipsResponse, attendanceResponse] = await Promise.all([
      airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.sinifUyelikleri)}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableAttendanceFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.yoklamalar)}?maxRecords=100`,
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
          message: "Bu yoklamaya katılmak için sınıfta aktif öğrenci olmanız gerekir.",
        },
        { status: 403 },
      );
    }

    const sessionDate = session.fields.Tarih || new Date().toISOString().split("T")[0];
    const lessonHour = session.fields.Ders_Saati || 1;

    const existingAttendance = attendanceResponse.records.find((attendance) => {
      const linkedStudents = attendance.fields.Ogrenci || [];
      const linkedClasses = attendance.fields.Sinif || [];

      return (
        linkedStudents.includes(student.id) &&
        linkedClasses.includes(classId) &&
        attendance.fields.Tarih === sessionDate &&
        attendance.fields.Ders_Saati === lessonHour
      );
    });

    if (existingAttendance) {
      return NextResponse.json({
        ok: true,
        action: "already_exists",
        message: "Bu yoklama için daha önce katılım kaydınız alınmış.",
        attendance: {
          id: existingAttendance.id,
          status: existingAttendance.fields.Durum || "Geldi",
        },
      });
    }

    const attendanceName = `${student.fields.Ad_Soyad || "Öğrenci"} - ${sessionDate} - ${lessonHour}. Ders`;

    const createdAttendance = await airtableRequest<
      AirtableCreateResponse<AirtableAttendanceFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.yoklamalar)}`, {
      method: "POST",
      body: {
        typecast: true,
        records: [
          {
            fields: {
              Yoklama_Kaydi: attendanceName,
              Ogrenci: [student.id],
              Sinif: [classId],
              Ogretmen: [teacherId],
              Tarih: sessionDate,
              Durum: "Geldi",
              Ders_Saati: lessonHour,
              Aciklama: "Yoklama kodu ile öğrenci tarafından onaylandı.",
            },
          },
        ],
      },
    });

    return NextResponse.json({
      ok: true,
      action: "created",
      message: "Yoklama kaydınız başarıyla alındı.",
      attendance: {
        id: createdAttendance.records[0]?.id,
        status: "Geldi",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Yoklama kaydı oluşturulamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
