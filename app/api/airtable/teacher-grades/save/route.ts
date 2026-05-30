import { NextResponse } from "next/server";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
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
  if (value === "" || value === null || value === undefined) return null;

  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function cleanFields(fields: Record<string, any>) {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  return cleaned;
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

async function createAirtableRecord(tableName: string, fields: Record<string, any>) {
  const baseId = getEnv("AIRTABLE_BASE_ID");
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: airtableHeaders(),
    body: JSON.stringify({
      fields: cleanFields(fields),
      typecast: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

async function updateAirtableRecord(tableName: string, recordId: string, fields: Record<string, any>) {
  const baseId = getEnv("AIRTABLE_BASE_ID");
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}/${recordId}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: airtableHeaders(),
    body: JSON.stringify({
      fields: cleanFields(fields),
      typecast: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const classId = text(body.classId);
    const teacherEmail = text(body.teacherEmail).toLowerCase();
    const gradeType = text(body.gradeType);
    const gradeDate = text(body.gradeDate);
    const publishStatus = text(body.publishStatus) || "Taslak";
    const maxScore = numberOrNull(body.maxScore) ?? 100;
    const entries = Array.isArray(body.entries) ? body.entries : [];

    if (!classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "classId gerekli.",
        },
        { status: 400 },
      );
    }

    if (!gradeType) {
      return NextResponse.json(
        {
          ok: false,
          message: "Not türü gerekli.",
        },
        { status: 400 },
      );
    }

    if (!gradeDate) {
      return NextResponse.json(
        {
          ok: false,
          message: "Tarih gerekli.",
        },
        { status: 400 },
      );
    }

    const usersResult = await listAirtableRecords("Kullanicilar");
    const classesResult = await listAirtableRecords("Siniflar");
    const gradesResult = await listAirtableRecords("Notlar");

    for (const result of [usersResult, classesResult, gradesResult]) {
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: "Airtable kayıtları okunamadı.",
            details: result.error,
          },
          { status: result.status },
        );
      }
    }

    const users = usersResult.records;
    const classes = classesResult.records;
    const grades = gradesResult.records;

    const classRecord = classes.find((item) => item.id === classId);

    if (!classRecord) {
      return NextResponse.json(
        {
          ok: false,
          message: "Sınıf bulunamadı.",
        },
        { status: 404 },
      );
    }

    const teacher =
      users.find((user) => text(user.fields?.Eposta).toLowerCase() === teacherEmail) ||
      users.find((user) => getLinkedIds(classRecord.fields?.Ogretmen).includes(user.id));

    const teacherId = teacher?.id || "";

    const className =
      text(classRecord.fields?.Sinif_Adi) ||
      text(classRecord.fields?.Ders_Adi) ||
      "Sınıf";

    const savedRecords = [];

    for (const entry of entries) {
      const studentId = text(entry.studentId);
      const score = numberOrNull(entry.score);
      const description = text(entry.description);

      if (!studentId || score === null) {
        continue;
      }

      const student = users.find((user) => user.id === studentId);

      const studentName =
        text(student?.fields?.Ad_Soyad) ||
        text(student?.fields?.Eposta) ||
        "Öğrenci";

      const existingGrade = grades.find((grade) => {
        const sameStudent = getLinkedIds(grade.fields?.Ogrenci).includes(studentId);
        const sameClass = getLinkedIds(grade.fields?.Sinif).includes(classId);
        const sameType = text(grade.fields?.Not_Turu) === gradeType;
        const sameDate = text(grade.fields?.Tarih) === gradeDate;

        return sameStudent && sameClass && sameType && sameDate;
      });

      const fields = {
        Not_Kaydi: `${className} - ${studentName} - ${gradeType} - ${gradeDate}`,
        Ogrenci: [studentId],
        Sinif: [classId],
        Ogretmen: teacherId ? [teacherId] : undefined,
        Not_Turu: gradeType,
        Puan: score,
        Maksimum_Puan: maxScore,
        Tarih: gradeDate,
        Aciklama: description,
        Yayin_Durumu: publishStatus,
      };

      const saved = existingGrade
        ? await updateAirtableRecord("Notlar", existingGrade.id, fields)
        : await createAirtableRecord("Notlar", fields);

      savedRecords.push(saved);
    }

    return NextResponse.json({
      ok: true,
      message:
        publishStatus === "Yayinda"
          ? "Notlar kaydedildi ve yayınlandı."
          : "Notlar taslak olarak kaydedildi.",
      savedCount: savedRecords.length,
      records: savedRecords,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Notlar kaydedilemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
