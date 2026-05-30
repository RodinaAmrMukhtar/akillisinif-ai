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

function getLinkedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
}

async function listAirtableRecords(tableName: string, filterByFormula?: string) {
  const baseId = getEnv("AIRTABLE_BASE_ID");
  const records: any[] = [];
  let offset = "";

  do {
    const params = new URLSearchParams();

    if (filterByFormula) {
      params.set("filterByFormula", filterByFormula);
    }

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

function text(value: unknown) {
  return String(value || "").trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherEmail = text(searchParams.get("teacherEmail"));

    const usersResult = await listAirtableRecords("Kullanicilar");
    const classesResult = await listAirtableRecords("Siniflar");
    const signalsResult = await listAirtableRecords("Risk_Sinyalleri");

    if (!usersResult.ok) {
      return NextResponse.json(
        { ok: false, message: "Kullanıcılar okunamadı.", details: usersResult.error },
        { status: usersResult.status },
      );
    }

    if (!classesResult.ok) {
      return NextResponse.json(
        { ok: false, message: "Sınıflar okunamadı.", details: classesResult.error },
        { status: classesResult.status },
      );
    }

    if (!signalsResult.ok) {
      return NextResponse.json(
        { ok: false, message: "Risk sinyalleri okunamadı.", details: signalsResult.error },
        { status: signalsResult.status },
      );
    }

    const users = usersResult.records;
    const classes = classesResult.records;
    const signals = signalsResult.records;

    const currentTeacher = users.find(
      (user) => text(user.fields?.Eposta).toLowerCase() === teacherEmail.toLowerCase(),
    );

    const currentTeacherId = currentTeacher?.id || "";

    const teacherClassIds = classes
      .filter((classRecord) => getLinkedIds(classRecord.fields?.Ogretmen).includes(currentTeacherId))
      .map((classRecord) => classRecord.id);

    const filteredSignals = currentTeacherId
      ? signals.filter((signal) => {
          const classIds = getLinkedIds(signal.fields?.Sinif);
          return classIds.some((classId) => teacherClassIds.includes(classId));
        })
      : signals;

    const normalized = filteredSignals.map((signal) => {
      const studentId = getLinkedIds(signal.fields?.Ogrenci)[0] || "";
      const classId = getLinkedIds(signal.fields?.Sinif)[0] || "";

      const student = users.find((user) => user.id === studentId);
      const classRecord = classes.find((item) => item.id === classId);

      return {
        id: signal.id,
        title: text(signal.fields?.Sinyal_Adi),
        studentName: text(student?.fields?.Ad_Soyad) || text(student?.fields?.Eposta) || "Öğrenci",
        studentEmail: text(student?.fields?.Eposta),
        className:
          text(classRecord?.fields?.Sinif_Adi) ||
          text(classRecord?.fields?.Ders_Adi) ||
          "Sınıf",
        signalType: text(signal.fields?.Sinyal_Turu),
        riskScore: signal.fields?.Risk_Puani ?? null,
        importance: text(signal.fields?.Onem_Derecesi),
        status: text(signal.fields?.Durum),
        description: text(signal.fields?.Aciklama),
        recommendedAction: text(signal.fields?.Onerilen_Aksiyon),
        detectedAt: text(signal.fields?.Tespit_Tarihi),
      };
    });

    normalized.sort((a, b) => {
      const order: Record<string, number> = {
        Kritik: 4,
        Yuksek: 3,
        "Yüksek": 3,
        Orta: 2,
        Dusuk: 1,
        Düşük: 1,
      };

      return (order[b.importance] || 0) - (order[a.importance] || 0);
    });

    return NextResponse.json({
      ok: true,
      teacherFound: Boolean(currentTeacherId),
      count: normalized.length,
      signals: normalized,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Risk sinyalleri alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
