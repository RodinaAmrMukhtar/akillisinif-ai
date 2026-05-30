import { NextResponse } from "next/server";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
  createdTime?: string;
};

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

function numberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function isPublished(value: unknown) {
  const status = text(value);
  return status === "Yayinda" || status === "Yayında";
}

async function listAirtableRecords(tableName: string) {
  const baseId = getEnv("AIRTABLE_BASE_ID");
  const records: AirtableRecord[] = [];
  let offset = "";

  do {
    const params = new URLSearchParams();
    params.set("pageSize", "100");

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
        records: [] as AirtableRecord[],
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
    const studentEmail = text(searchParams.get("studentEmail")).toLowerCase();

    const usersResult = await listAirtableRecords("Kullanicilar");
    const classesResult = await listAirtableRecords("Siniflar");
    const gradesResult = await listAirtableRecords("Notlar");

    for (const result of [usersResult, classesResult, gradesResult]) {
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: "Airtable not kayıtları okunamadı.",
            details: result.error,
          },
          { status: result.status },
        );
      }
    }

    const users = usersResult.records;
    const classes = classesResult.records;
    const grades = gradesResult.records;

    const currentStudent = users.find(
      (user) => text(user.fields?.Eposta).toLowerCase() === studentEmail,
    );

    const currentStudentId = currentStudent?.id || "";

    const studentGrades = currentStudentId
      ? grades.filter((grade) => {
          const belongsToStudent = getLinkedIds(grade.fields?.Ogrenci).includes(currentStudentId);
          const published = isPublished(grade.fields?.Yayin_Durumu);
          return belongsToStudent && published;
        })
      : [];

    const normalized = studentGrades.map((grade) => {
      const classId = getLinkedIds(grade.fields?.Sinif)[0] || "";
      const classRecord = classes.find((item) => item.id === classId);

      const score = numberOrNull(grade.fields?.Puan);
      const maxScore = numberOrNull(grade.fields?.Maksimum_Puan) ?? 100;

      const percentage =
        score === null || !maxScore
          ? null
          : Math.round((score / maxScore) * 100);

      return {
        id: grade.id,
        title: text(grade.fields?.Not_Kaydi) || "Not Kaydı",
        className:
          text(classRecord?.fields?.Sinif_Adi) ||
          text(classRecord?.fields?.Ders_Adi) ||
          "Sınıf",
        lessonName: text(classRecord?.fields?.Ders_Adi),
        gradeType: text(grade.fields?.Not_Turu),
        score,
        maxScore,
        percentage,
        weight: numberOrNull(grade.fields?.Agirlik),
        date: text(grade.fields?.Tarih),
        description: text(grade.fields?.Aciklama),
        publishStatus: text(grade.fields?.Yayin_Durumu),
        createdAt: text(grade.fields?.Olusturma_Tarihi),
      };
    });

    normalized.sort((a, b) => {
      const dateA = Date.parse(a.date || a.createdAt || "");
      const dateB = Date.parse(b.date || b.createdAt || "");
      return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
    });

    return NextResponse.json({
      ok: true,
      studentFound: Boolean(currentStudentId),
      studentName:
        text(currentStudent?.fields?.Ad_Soyad) ||
        text(currentStudent?.fields?.Eposta) ||
        "Öğrenci",
      count: normalized.length,
      grades: normalized,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Öğrenci notları alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}