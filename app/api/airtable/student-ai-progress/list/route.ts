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

function numberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
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
    const studentEmail = text(searchParams.get("studentEmail")).toLowerCase();

    const usersResult = await listAirtableRecords("Kullanicilar");
    const classesResult = await listAirtableRecords("Siniflar");
    const summariesResult = await listAirtableRecords("Ogrenci_Ozetleri");
    const predictionsResult = await listAirtableRecords("Tahminler");

    for (const result of [usersResult, classesResult, summariesResult, predictionsResult]) {
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: "Airtable öğrenci AI kayıtları okunamadı.",
            details: result.error,
          },
          { status: result.status },
        );
      }
    }

    const users = usersResult.records;
    const classes = classesResult.records;
    const summaries = summariesResult.records;
    const predictions = predictionsResult.records;

    const currentStudent = users.find(
      (user) => text(user.fields?.Eposta).toLowerCase() === studentEmail,
    );

    const currentStudentId = currentStudent?.id || "";

    const studentSummaries = currentStudentId
      ? summaries.filter((summary) =>
          getLinkedIds(summary.fields?.Ogrenci).includes(currentStudentId),
        )
      : [];

    const studentPredictions = currentStudentId
      ? predictions.filter((prediction) => {
          const belongsToStudent = getLinkedIds(prediction.fields?.Ogrenci).includes(currentStudentId);
          const visibleToStudent = Boolean(prediction.fields?.Ogrenciye_Gosterilecek);
          return belongsToStudent && visibleToStudent;
        })
      : [];

    const normalizedSummaries = studentSummaries.map((summary) => {
      const classId = getLinkedIds(summary.fields?.Sinif)[0] || "";
      const classRecord = classes.find((item) => item.id === classId);

      return {
        id: summary.id,
        title: text(summary.fields?.Ozet_Adi) || "Öğrenci Gelişim Özeti",
        className:
          text(classRecord?.fields?.Sinif_Adi) ||
          text(classRecord?.fields?.Ders_Adi) ||
          "Sınıf",
        generalAverage: numberOrNull(summary.fields?.Genel_Ortalama),
        lastThreeAverage: numberOrNull(summary.fields?.Son_3_Not_Ortalamasi),
        gradeTrend: text(summary.fields?.Not_Trendi),
        gradeDropScore: numberOrNull(summary.fields?.Not_Dususu_Puani),
        attendanceRate: normalizePercent(summary.fields?.Devamsizlik_Orani),
        assignmentSubmissionRate: normalizePercent(summary.fields?.Odev_Teslim_Orani),
        lateSubmissionCount: numberOrNull(summary.fields?.Gec_Teslim_Sayisi),
        missingAssignmentCount: numberOrNull(summary.fields?.Eksik_Odev_Sayisi),
        classAverageDifference: numberOrNull(summary.fields?.Sinif_Ortalamasina_Gore_Fark),
        riskScore: numberOrNull(summary.fields?.Risk_Puani),
        riskLevel: text(summary.fields?.Risk_Seviyesi),
        aiSuggestion: text(summary.fields?.AI_Onerisi),
        calculatedAt: text(summary.fields?.Son_Hesaplama_Tarihi),
        updatedAt: text(summary.fields?.Guncelleme_Tarihi),
      };
    });

    const normalizedPredictions = studentPredictions.map((prediction) => {
      const classId = getLinkedIds(prediction.fields?.Sinif)[0] || "";
      const classRecord = classes.find((item) => item.id === classId);

      return {
        id: prediction.id,
        title: text(prediction.fields?.Tahmin_Adi) || "AI Performans Tahmini",
        className:
          text(classRecord?.fields?.Sinif_Adi) ||
          text(classRecord?.fields?.Ders_Adi) ||
          "Sınıf",
        summary: text(prediction.fields?.Ozet),
        predictedGrade: numberOrNull(prediction.fields?.Tahmini_Donem_Notu),
        passingProbability: normalizePercent(prediction.fields?.Gecme_Olasiligi),
        riskLevel: text(prediction.fields?.Risk_Seviyesi),
        explanation1: text(prediction.fields?.Aciklama_1),
        explanation2: text(prediction.fields?.Aciklama_2),
        explanation3: text(prediction.fields?.Aciklama_3),
        predictionDate: text(prediction.fields?.Tahmin_Tarihi),
        isValid: Boolean(prediction.fields?.Gecerli_Mi),
      };
    });

    return NextResponse.json({
      ok: true,
      studentFound: Boolean(currentStudentId),
      studentName:
        text(currentStudent?.fields?.Ad_Soyad) ||
        text(currentStudent?.fields?.Eposta) ||
        "Öğrenci",
      summaries: normalizedSummaries,
      predictions: normalizedPredictions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Öğrenci AI gelişim verileri alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
