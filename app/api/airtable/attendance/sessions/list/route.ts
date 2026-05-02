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

type AirtableAttendanceFields = {
  Ogrenci?: string[];
  Sinif?: string[];
  Ogretmen?: string[];
  Tarih?: string;
  Durum?: string;
  Ders_Saati?: number;
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

    const [sessionsResponse, classesResponse, attendanceResponse] =
      await Promise.all([
        airtableRequest<AirtableListResponse<AirtableAttendanceSessionFields>>(
          `/${encodeURIComponent(AIRTABLE_TABLES.yoklamaOturumlari)}?maxRecords=100`,
        ),
        airtableRequest<AirtableListResponse<AirtableClassFields>>(
          `/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}?maxRecords=100`,
        ),
        airtableRequest<AirtableListResponse<AirtableAttendanceFields>>(
          `/${encodeURIComponent(AIRTABLE_TABLES.yoklamalar)}?maxRecords=100`,
        ),
      ]);

    const teacherClassIds = classesResponse.records
      .filter((classRecord) => {
        const teacherLinks = classRecord.fields.Ogretmen || [];
        return teacherLinks.includes(teacher.id);
      })
      .map((classRecord) => classRecord.id);

    const classMap = new Map(
      classesResponse.records.map((classRecord) => [classRecord.id, classRecord]),
    );

    const sessions = sessionsResponse.records
      .filter((session) => {
        const sessionClassId = session.fields.Sinif?.[0] || "";
        const sessionTeacherLinks = session.fields.Ogretmen || [];

        return (
          teacherClassIds.includes(sessionClassId) ||
          sessionTeacherLinks.includes(teacher.id)
        );
      })
      .map((session) => {
        const classId = session.fields.Sinif?.[0] || "";
        const classRecord = classMap.get(classId);

        const presentCount = attendanceResponse.records.filter((attendance) => {
          const attendanceClassId = attendance.fields.Sinif?.[0] || "";

          return (
            attendanceClassId === classId &&
            attendance.fields.Tarih === session.fields.Tarih &&
            attendance.fields.Ders_Saati === session.fields.Ders_Saati &&
            attendance.fields.Durum === "Geldi"
          );
        }).length;

        return {
          id: session.id,
          code: session.fields.Oturum_Kodu || "",
          classId,
          className: classRecord?.fields.Sinif_Adi || "Sınıf",
          courseName: classRecord?.fields.Ders_Adi || "Ders",
          date: session.fields.Tarih || "",
          lessonHour: session.fields.Ders_Saati || 1,
          startsAt: session.fields.Baslangic_Zamani || "",
          endsAt: session.fields.Bitis_Zamani || "",
          active: session.fields.Aktif_Mi ?? false,
          status: session.fields.Durum || "Aktif",
          presentCount,
        };
      });

    return NextResponse.json({
      ok: true,
      sessions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Yoklama oturumları listelenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
