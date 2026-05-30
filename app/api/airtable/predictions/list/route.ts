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

function normalizePercent(value: unknown) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return null;
  }

  if (numberValue <= 1) {
    return Math.round(numberValue * 100);
  }

  return Math.round(numberValue);
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
    const predictionsResult = await listAirtableRecords("Tahminler");

    for (const result of [usersResult, classesResult, predictionsResult]) {
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: "Airtable tahmin kayıtları okunamadı.",
            details: result.error,
          },
          { status: result.status },
        );
      }
    }

    const users = usersResult.records;
    const classes = classesResult.records;
    const predictions = predictionsResult.records;

    const currentTeacher = users.find(
      (user) => text(user.fields?.Eposta).toLowerCase() === teacherEmail,
    );

    const currentTeacherId = currentTeacher?.id || "";

    const teacherClassIds = classes
      .filter((classRecord) => getLinkedIds(classRecord.fields?.Ogretmen).includes(currentTeacherId))
      .map((classRecord) => classRecord.id);

    const filteredPredictions = currentTeacherId
      ? predictions.filter((prediction) => {
          const classIds = getLinkedIds(prediction.fields?.Sinif);
          return classIds.some((classId) => teacherClassIds.includes(classId));
        })
      : [];

    const normalized = filteredPredictions.map((prediction) => {
      const studentId = getLinkedIds(prediction.fields?.Ogrenci)[0] || "";
      const classId = getLinkedIds(prediction.fields?.Sinif)[0] || "";

      const student = users.find((user) => user.id === studentId);
      const classRecord = classes.find((item) => item.id === classId);

      return {
        id: prediction.id,
        title: text(prediction.fields?.Tahmin_Adi) || "AI Performans Tahmini",
        studentName:
          text(student?.fields?.Ad_Soyad) ||
          text(student?.fields?.Eposta) ||
          "Öğrenci",
        studentEmail: text(student?.fields?.Eposta),
        className:
          text(classRecord?.fields?.Sinif_Adi) ||
          text(classRecord?.fields?.Ders_Adi) ||
          "Sınıf",
        summary: text(prediction.fields?.Ozet),
        predictedGrade: Number(prediction.fields?.Tahmini_Donem_Notu ?? 0),
        passingProbability: normalizePercent(prediction.fields?.Gecme_Olasiligi),
        riskLevel: text(prediction.fields?.Risk_Seviyesi),
        explanation1: text(prediction.fields?.Aciklama_1),
        explanation2: text(prediction.fields?.Aciklama_2),
        explanation3: text(prediction.fields?.Aciklama_3),
        showToStudent: Boolean(prediction.fields?.Ogrenciye_Gosterilecek),
        showToTeacher: Boolean(prediction.fields?.Ogretmene_Gosterilecek),
        predictionDate: text(prediction.fields?.Tahmin_Tarihi),
        isValid: Boolean(prediction.fields?.Gecerli_Mi),
        sourceGradeCode: text(prediction.fields?.Kaynak_Not_Kodu),
      };
    });

    normalized.sort((a, b) => {
      const riskOrder: Record<string, number> = {
        Kritik: 4,
        "Yüksek": 3,
        Yuksek: 3,
        Orta: 2,
        "Düşük": 1,
        Dusuk: 1,
      };

      if (Number(b.isValid) !== Number(a.isValid)) {
        return Number(b.isValid) - Number(a.isValid);
      }

      return (riskOrder[b.riskLevel] || 0) - (riskOrder[a.riskLevel] || 0);
    });

    return NextResponse.json({
      ok: true,
      teacherFound: Boolean(currentTeacherId),
      count: normalized.length,
      predictions: normalized,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "AI tahminleri alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
