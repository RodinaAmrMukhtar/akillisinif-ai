import { NextResponse } from "next/server";

type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, any>;
};

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

function getString(value: unknown) {
  return String(value || "").trim();
}

function normalize(value: unknown) {
  return getString(value)
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/\s+/g, " ")
    .trim();
}

function asLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

async function listAll(tableName: string): Promise<AirtableRecord[]> {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();

  if (!token) throw new Error("AIRTABLE_TOKEN eksik.");
  if (!baseId) throw new Error("AIRTABLE_BASE_ID eksik.");

  let offset = "";
  const records: AirtableRecord[] = [];

  do {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`);
    url.searchParams.set("pageSize", "100");

    if (offset) url.searchParams.set("offset", offset);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(
        `Airtable tablo okuma hatası. Tablo: ${tableName}. Durum: ${response.status}. Detay: ${details}`,
      );
    }

    const data = (await response.json()) as {
      records?: AirtableRecord[];
      offset?: string;
    };

    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return records;
}

function isTeacher(user: AirtableRecord) {
  const role = normalize(user.fields.Rol);
  return role === "ogretmen" || role === "yonetici";
}

function reportDate(report: AirtableRecord) {
  return (
    report.fields.Olusturma_Tarihi ||
    report.createdTime ||
    report.fields.Hafta_Bitis ||
    ""
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const authId = getString(searchParams.get("authId"));
    const email = getString(searchParams.get("email"));
    const name = getString(searchParams.get("name"));

    const [users, reports, classes] = await Promise.all([
      listAll("Kullanicilar"),
      listAll("Haftalik_Raporlar"),
      listAll("Siniflar"),
    ]);

    const teachers = users.filter(isTeacher);

    const teacher = teachers.find((user) => {
      const airtableAuthId = getString(user.fields.Auth_ID);
      const airtableEmail = normalize(user.fields.Eposta);
      const airtableName = normalize(user.fields.Ad_Soyad);

      return (
        Boolean(authId && airtableAuthId === authId) ||
        Boolean(email && airtableEmail === normalize(email)) ||
        Boolean(name && airtableName === normalize(name))
      );
    });

    const classMap = new Map(
      classes.map((classRecord) => [
        classRecord.id,
        getString(classRecord.fields.Sinif_Adi) ||
          getString(classRecord.fields.Ders_Adi) ||
          "Sınıf",
      ]),
    );

    const teacherReports = teacher
      ? reports
          .filter((report) => asLinks(report.fields.Ogretmen).includes(teacher.id))
          .sort((a, b) => getString(reportDate(b)).localeCompare(getString(reportDate(a))))
      : [];

    return NextResponse.json({
      ok: true,
      teacher: teacher
        ? {
            id: teacher.id,
            name: getString(teacher.fields.Ad_Soyad),
            email: getString(teacher.fields.Eposta),
          }
        : null,
      reports: teacherReports.map((report) => {
        const classId = asLinks(report.fields.Sinif)[0] || "";

        return {
          id: report.id,
          title: getString(report.fields.Rapor_Adi),
          classId,
          className: classMap.get(classId) || "Genel rapor",
          weekStart: getString(report.fields.Hafta_Baslangic),
          weekEnd: getString(report.fields.Hafta_Bitis),
          totalStudents: Number(report.fields.Toplam_Ogrenci || 0),
          lowRiskCount: Number(report.fields.Dusuk_Risk_Sayisi || 0),
          mediumRiskCount: Number(report.fields.Orta_Risk_Sayisi || 0),
          highRiskCount: Number(report.fields.Yuksek_Risk_Sayisi || 0),
          criticalRiskCount: Number(report.fields.Kritik_Risk_Sayisi || 0),
          mostCommonRiskReason: getString(report.fields.En_Yaygin_Risk_Nedeni),
          reportText: getString(report.fields.Rapor_Metni),
          status: getString(report.fields.Durum),
          createdAt: getString(reportDate(report)),
        };
      }),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Haftalık raporlar yüklenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
