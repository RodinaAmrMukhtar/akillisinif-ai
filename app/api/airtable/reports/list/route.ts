import { NextResponse } from "next/server";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

function getEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing`);
  }
  return value;
}

function airtableHeaders() {
  return {
    Authorization: `Bearer ${getEnv("AIRTABLE_TOKEN")}`,
    "Content-Type": "application/json",
  };
}

function text(value: unknown) {
  return String(value || "").trim();
}

function getLinkedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

async function listAirtableRecords(tableName: string) {
  const baseId = getEnv("AIRTABLE_BASE_ID");
  const records: any[] = [];
  let offset = "";

  do {
    const params = new URLSearchParams();

    if (offset) {
      params.set("offset", offset);
    }

    const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`;

    const response = await fetch(url, {
      headers: airtableHeaders(),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data,
        records: [],
      };
    }

    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return {
    ok: true,
    status: 200,
    records,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherEmail = text(searchParams.get("teacherEmail")).toLowerCase();

    const usersResult = await listAirtableRecords("Kullanicilar");
    const classesResult = await listAirtableRecords("Siniflar");
    const reportsResult = await listAirtableRecords("Haftalik_Raporlar");

    for (const result of [usersResult, classesResult, reportsResult]) {
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: "Airtable rapor kayıtları okunamadı.",
            details: result.error,
          },
          { status: result.status },
        );
      }
    }

    const users = usersResult.records;
    const classes = classesResult.records;
    const reports = reportsResult.records;

    const currentTeacher = users.find(
      (user) => text(user.fields?.Eposta).toLowerCase() === teacherEmail,
    );

    const currentTeacherId = currentTeacher?.id || "";

    const teacherClassIds = classes
      .filter((classRecord) => getLinkedIds(classRecord.fields?.Ogretmen).includes(currentTeacherId))
      .map((classRecord) => classRecord.id);

    const filteredReports = currentTeacherId
      ? reports.filter((report) => {
          const reportTeacherIds = getLinkedIds(report.fields?.Ogretmen);
          const reportClassIds = getLinkedIds(report.fields?.Sinif);

          return (
            reportTeacherIds.includes(currentTeacherId) ||
            reportClassIds.some((classId) => teacherClassIds.includes(classId))
          );
        })
      : [];

    const normalized = filteredReports.map((report) => {
      const classId = getLinkedIds(report.fields?.Sinif)[0] || "";
      const classRecord = classes.find((item) => item.id === classId);

      const reportText = text(report.fields?.Rapor_Metni);

      return {
        id: report.id,
        title: text(report.fields?.Rapor_Adi) || "Haftalık Rapor",
        className:
          text(classRecord?.fields?.Sinif_Adi) ||
          text(classRecord?.fields?.Ders_Adi) ||
          "Sınıf",
        weekStart: text(report.fields?.Hafta_Baslangic),
        weekEnd: text(report.fields?.Hafta_Bitis),
        totalStudents: Number(report.fields?.Toplam_Ogrenci || 0),
        lowRiskCount: Number(report.fields?.Dusuk_Risk_Sayisi || 0),
        mediumRiskCount: Number(report.fields?.Orta_Risk_Sayisi || 0),
        highRiskCount: Number(report.fields?.Yuksek_Risk_Sayisi || 0),
        criticalRiskCount: Number(report.fields?.Kritik_Risk_Sayisi || 0),
        mostCommonRiskReason: text(report.fields?.En_Yaygin_Risk_Nedeni),
        reportText,
        status: text(report.fields?.Durum),
        createdAt: text(report.fields?.Olusturma_Tarihi),
        reportType: reportText.includes("AI_ASISTAN_HAFTALIK_ONERI:")
          ? "AI Asistan Önerisi"
          : "Haftalık Risk Raporu",
      };
    });

    normalized.sort((a, b) => {
      const dateA = Date.parse(a.weekStart || a.createdAt || "");
      const dateB = Date.parse(b.weekStart || b.createdAt || "");
      return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
    });

    return NextResponse.json({
      ok: true,
      teacherFound: Boolean(currentTeacherId),
      count: normalized.length,
      reports: normalized,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Raporlar alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
