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
    const plansResult = await listAirtableRecords("Mudahale_Planlari");
    const stepsResult = await listAirtableRecords("Mudahale_Adimlari");
    const signalsResult = await listAirtableRecords("Risk_Sinyalleri");

    for (const result of [usersResult, classesResult, plansResult, stepsResult, signalsResult]) {
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
    const plans = plansResult.records;
    const steps = stepsResult.records;
    const signals = signalsResult.records;

    const currentTeacher = users.find(
      (user) => text(user.fields?.Eposta).toLowerCase() === teacherEmail,
    );

    const currentTeacherId = currentTeacher?.id || "";

    const teacherClassIds = classes
      .filter((classRecord) => getLinkedIds(classRecord.fields?.Ogretmen).includes(currentTeacherId))
      .map((classRecord) => classRecord.id);

    const filteredPlans = currentTeacherId
      ? plans.filter((plan) => {
          const planTeacherIds = getLinkedIds(plan.fields?.Ogretmen);
          const planClassIds = getLinkedIds(plan.fields?.Sinif);

          return (
            planTeacherIds.includes(currentTeacherId) ||
            planClassIds.some((classId) => teacherClassIds.includes(classId))
          );
        })
      : plans;

    const normalized = filteredPlans.map((plan) => {
      const studentId = getLinkedIds(plan.fields?.Ogrenci)[0] || "";
      const classId = getLinkedIds(plan.fields?.Sinif)[0] || "";
      const signalId = getLinkedIds(plan.fields?.Ilgili_Risk_Sinyali)[0] || "";

      const student = users.find((user) => user.id === studentId);
      const classRecord = classes.find((item) => item.id === classId);
      const signal = signals.find((item) => item.id === signalId);

      const planSteps = steps
        .filter((step) => getLinkedIds(step.fields?.Plan).includes(plan.id))
        .map((step) => {
          const responsibleId = getLinkedIds(step.fields?.Sorumlu)[0] || "";
          const responsible = users.find((user) => user.id === responsibleId);

          return {
            id: step.id,
            title: text(step.fields?.Adim_Adi),
            type: text(step.fields?.Adim_Turu),
            description: text(step.fields?.Aciklama),
            dueDate: text(step.fields?.Son_Tarih),
            status: text(step.fields?.Durum),
            completedAt: text(step.fields?.Tamamlanma_Tarihi),
            responsibleName:
              text(responsible?.fields?.Ad_Soyad) ||
              text(responsible?.fields?.Eposta) ||
              "Sorumlu",
          };
        });

      return {
        id: plan.id,
        title: text(plan.fields?.Plan_Adi),
        studentName:
          text(student?.fields?.Ad_Soyad) ||
          text(student?.fields?.Eposta) ||
          "Öğrenci",
        studentEmail: text(student?.fields?.Eposta),
        className:
          text(classRecord?.fields?.Sinif_Adi) ||
          text(classRecord?.fields?.Ders_Adi) ||
          "Sınıf",
        relatedSignalTitle: text(signal?.fields?.Sinyal_Adi),
        relatedSignalImportance: text(signal?.fields?.Onem_Derecesi),
        goal: text(plan.fields?.Hedef),
        startDate: text(plan.fields?.Baslangic_Tarihi),
        endDate: text(plan.fields?.Bitis_Tarihi),
        status: text(plan.fields?.Durum),
        successStatus: text(plan.fields?.Basari_Durumu),
        teacherNote: text(plan.fields?.Ogretmen_Notu),
        resultEvaluation: text(plan.fields?.Sonuc_Degerlendirmesi),
        createdAt: text(plan.fields?.Olusturma_Tarihi),
        steps: planSteps,
      };
    });

    normalized.sort((a, b) => {
      const order: Record<string, number> = {
        Aktif: 4,
        Planlandi: 3,
        "Planlandı": 3,
        Tamamlandi: 1,
        "Tamamlandı": 1,
      };

      return (order[b.status] || 2) - (order[a.status] || 2);
    });

    return NextResponse.json({
      ok: true,
      teacherFound: Boolean(currentTeacherId),
      count: normalized.length,
      plans: normalized,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Müdahale planları alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
