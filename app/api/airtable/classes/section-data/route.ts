import { NextResponse } from "next/server";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, any>;
};

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
    .trim();
}

function asLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function getNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getAirtableToken() {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  if (!token) throw new Error("AIRTABLE_TOKEN eksik.");
  return token;
}

function getAirtableBaseId() {
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();
  if (!baseId) throw new Error("AIRTABLE_BASE_ID eksik.");
  return baseId;
}

async function listAll(tableName: string): Promise<AirtableRecord[]> {
  const records: AirtableRecord[] = [];
  let offset = "";

  do {
    const url = new URL(`${AIRTABLE_API_URL}/${getAirtableBaseId()}/${encodeURIComponent(tableName)}`);
    url.searchParams.set("pageSize", "100");
    if (offset) url.searchParams.set("offset", offset);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getAirtableToken()}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`${tableName} okunamadı: ${details}`);
    }

    const data = (await response.json()) as { records?: AirtableRecord[]; offset?: string };
    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return records;
}

function isStudentMembership(record: AirtableRecord, classId: string, statusWanted: string) {
  const role = normalize(record.fields.Uyelik_Rolu);
  const status = normalize(record.fields.Durum);
  const classIds = asLinks(record.fields.Sinif);

  return (
    classIds.includes(classId) &&
    (role === "ogrenci" || role === "ogretmen" || role === "") === false &&
    status === statusWanted
  );
}

function isActiveStudentMembership(record: AirtableRecord, classId: string) {
  const role = normalize(record.fields.Uyelik_Rolu);
  const status = normalize(record.fields.Durum);
  const classIds = asLinks(record.fields.Sinif);

  return classIds.includes(classId) && role === "ogrenci" && status === "aktif";
}

function isPendingStudentMembership(record: AirtableRecord, classId: string) {
  const role = normalize(record.fields.Uyelik_Rolu);
  const status = normalize(record.fields.Durum);
  const classIds = asLinks(record.fields.Sinif);

  return classIds.includes(classId) && role === "ogrenci" && status === "onay bekliyor";
}

function isPresentStatus(value: unknown) {
  const status = normalize(value);
  return status === "geldi" || status === "gec geldi" || status === "gec";
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = getString(searchParams.get("classId"));

    if (!classId) {
      return NextResponse.json({ ok: false, message: "classId gerekli." }, { status: 400 });
    }

    const [
      users,
      classes,
      memberships,
      assignments,
      submissions,
      sessions,
      attendanceRecords,
      predictions,
    ] = await Promise.all([
      listAll("Kullanicilar"),
      listAll("Siniflar"),
      listAll("Sinif_Uyelikleri"),
      listAll("Odevler"),
      listAll("Odev_Teslimleri"),
      listAll("Yoklama_Oturumlari"),
      listAll("Yoklamalar"),
      listAll("Tahminler"),
    ]);

    const classRecord = classes.find((item) => item.id === classId);
    const classFields = classRecord?.fields || {};

    const activeMemberships = memberships.filter((item) =>
      isActiveStudentMembership(item, classId),
    );

    const pendingMemberships = memberships.filter((item) =>
      isPendingStudentMembership(item, classId),
    );

    const students = activeMemberships.map((membership) => {
      const studentId = asLinks(membership.fields.Kullanici)[0] || "";
      const user = users.find((item) => item.id === studentId);

      return {
        membershipId: membership.id,
        studentId,
        name: getString(user?.fields.Ad_Soyad) || "Öğrenci",
        email: getString(user?.fields.Eposta),
        schoolNo: getString(user?.fields.Okul_No),
        status: getString(membership.fields.Durum),
        joinedAt: getString(membership.fields.Katilma_Tarihi || membership.createdTime),
      };
    });

    const pendingRequests = pendingMemberships.map((membership) => {
      const studentId = asLinks(membership.fields.Kullanici)[0] || "";
      const user = users.find((item) => item.id === studentId);

      return {
        membershipId: membership.id,
        studentId,
        name: getString(user?.fields.Ad_Soyad) || "Öğrenci",
        email: getString(user?.fields.Eposta),
        schoolNo: getString(user?.fields.Okul_No),
        status: getString(membership.fields.Durum),
        joinedAt: getString(membership.fields.Katilma_Tarihi || membership.createdTime),
      };
    });

    const classAssignments = assignments
      .filter((assignment) => asLinks(assignment.fields.Sinif).includes(classId))
      .map((assignment) => {
        const assignmentSubmissions = submissions.filter((submission) =>
          asLinks(submission.fields.Odev).includes(assignment.id) ||
          asLinks(submission.fields.Sinif).includes(classId),
        );

        return {
          id: assignment.id,
          title: getString(assignment.fields.Odev_Basligi) || "Ödev",
          type: getString(assignment.fields.Odev_Turu),
          status: getString(assignment.fields.Durum),
          dueDate: getString(assignment.fields.Teslim_Tarihi),
          maxPoint: getNumber(assignment.fields.Maksimum_Puan),
          submissionsCount: assignmentSubmissions.length,
        };
      });

    const classSessions = sessions
      .filter((session) => asLinks(session.fields.Sinif).includes(classId))
      .map((session) => {
        const relatedAttendance = attendanceRecords.filter((record) => {
          const recordClassIds = asLinks(record.fields.Sinif);
          const sameDate =
            getString(record.fields.Tarih) === getString(session.fields.Tarih);
          const sameHour =
            getString(record.fields.Ders_Saati) === getString(session.fields.Ders_Saati);

          return recordClassIds.includes(classId) && sameDate && sameHour;
        });

        const presentCount = relatedAttendance.filter((record) =>
          isPresentStatus(record.fields.Durum),
        ).length;

        return {
          id: session.id,
          name: getString(session.fields.Oturum_Adi) || "Yoklama Oturumu",
          date: getString(session.fields.Tarih),
          lessonHour: getString(session.fields.Ders_Saati),
          status: getString(session.fields.Durum),
          totalRecords: relatedAttendance.length,
          presentCount,
          absentCount: Math.max(relatedAttendance.length - presentCount, 0),
        };
      });

    const classPredictions = predictions
      .filter((prediction) => asLinks(prediction.fields.Sinif).includes(classId))
      .map((prediction) => {
        const studentId = asLinks(prediction.fields.Ogrenci)[0] || "";
        const user = users.find((item) => item.id === studentId);

        return {
          id: prediction.id,
          title:
            getString(prediction.fields.Tahmin_Adi) ||
            getString(prediction.fields.Tahmin_Kaydi) ||
            "AI Performans Tahmini",
          studentName: getString(user?.fields.Ad_Soyad) || "Öğrenci",
          riskLevel:
            getString(prediction.fields.Risk_Seviyesi) ||
            getString(prediction.fields.Risk_Duzeyi) ||
            getString(prediction.fields.Durum),
          score:
            getNumber(prediction.fields.Risk_Skoru) ??
            getNumber(prediction.fields.Tahmin_Skoru),
          summary:
            getString(prediction.fields.Tahmin_Metni) ||
            getString(prediction.fields.Aciklama) ||
            getString(prediction.fields.Oneri),
          createdAt: getString(prediction.fields.Olusturma_Tarihi || prediction.createdTime),
        };
      });

    return NextResponse.json({
      ok: true,
      class: {
        id: classRecord?.id || classId,
        name:
          getString(classFields.Sinif_Adi) ||
          getString(classFields.Ders_Adi) ||
          "Sınıf",
        requiresApproval: Boolean(classFields.Katilim_Onayi_Gerekli_Mi),
      },
      students,
      assignments: classAssignments,
      attendanceSessions: classSessions,
      predictions: classPredictions,
      pendingRequests,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sınıf sekme verileri yüklenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
