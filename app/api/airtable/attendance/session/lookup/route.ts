import { NextResponse } from "next/server";
import { AIRTABLE_TABLES, airtableRequest } from "@/lib/airtableClient";

type AirtableRecord<T> = {
  id: string;
  fields: T;
};

type AirtableListResponse<T> = {
  records: AirtableRecord<T>[];
};

type AirtableClassFields = {
  Sinif_Adi?: string;
  Ders_Adi?: string;
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

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code")?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        {
          ok: false,
          message: "Yoklama kodu gereklidir.",
        },
        { status: 400 },
      );
    }

    const safeCode = escapeAirtableFormulaValue(code);
    const filterFormula = `{Oturum_Kodu}='${safeCode}'`;

    const sessionsResponse = await airtableRequest<
      AirtableListResponse<AirtableAttendanceSessionFields>
    >(
      `/${encodeURIComponent(
        AIRTABLE_TABLES.yoklamaOturumlari,
      )}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`,
    );

    const session = sessionsResponse.records[0];

    if (!session) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu yoklama kodu bulunamadı.",
        },
        { status: 404 },
      );
    }

    const classId = session.fields.Sinif?.[0] || "";

    if (!classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Yoklama oturumu herhangi bir sınıfa bağlı değil.",
        },
        { status: 400 },
      );
    }

    const classRecord = await airtableRequest<AirtableRecord<AirtableClassFields>>(
      `/${encodeURIComponent(AIRTABLE_TABLES.siniflar)}/${classId}`,
    );

    return NextResponse.json({
      ok: true,
      session: {
        id: session.id,
        code: session.fields.Oturum_Kodu || "",
        classId,
        className: classRecord.fields.Sinif_Adi || "Sınıf",
        courseName: classRecord.fields.Ders_Adi || "Ders",
        date: session.fields.Tarih || "",
        lessonHour: session.fields.Ders_Saati || 1,
        startsAt: session.fields.Baslangic_Zamani || "",
        endsAt: session.fields.Bitis_Zamani || "",
        active: session.fields.Aktif_Mi ?? false,
        status: session.fields.Durum || "Aktif",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Yoklama oturumu bulunamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
