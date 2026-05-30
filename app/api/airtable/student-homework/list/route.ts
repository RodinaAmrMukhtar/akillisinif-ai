
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

function getAttachmentUrls(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item: any) => ({
      url: text(item?.url),
      filename: text(item?.filename) || "Dosya",
    }))
    .filter((item) => item.url);
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
    const membershipsResult = await listAirtableRecords("Sinif_Uyelikleri");
    const assignmentsResult = await listAirtableRecords("Odevler");
    const submissionsResult = await listAirtableRecords("Odev_Teslimleri");

    for (const result of [
      usersResult,
      classesResult,
      membershipsResult,
      assignmentsResult,
      submissionsResult,
    ]) {
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: "Airtable ?dev kay?tlar? okunamad?.",
            details: result.error,
          },
          { status: result.status },
        );
      }
    }

    const users = usersResult.records;
    const classes = classesResult.records;
    const memberships = membershipsResult.records;
    const assignments = assignmentsResult.records;
    const submissions = submissionsResult.records;

    const currentStudent = users.find(
      (user) => text(user.fields?.Eposta).toLowerCase() === studentEmail,
    );

    const currentStudentId = currentStudent?.id || "";

    const activeClassIds = currentStudentId
      ? memberships
          .filter((membership) => {
            const userIds = getLinkedIds(membership.fields?.Kullanici);
            const role = text(membership.fields?.Uyelik_Rolu);
            const status = text(membership.fields?.Durum);

            return (
              userIds.includes(currentStudentId) &&
              role === "Ogrenci" &&
              status === "Aktif"
            );
          })
          .flatMap((membership) => getLinkedIds(membership.fields?.Sinif))
      : [];

    const uniqueClassIds = Array.from(new Set(activeClassIds));

    const visibleAssignments = assignments.filter((assignment) => {
      const classIds = getLinkedIds(assignment.fields?.Sinif);
      const status = text(assignment.fields?.Durum);

      const belongsToStudentClass = classIds.some((classId) => uniqueClassIds.includes(classId));

      const visibleStatus =
        !status ||
        status === "Yayinda" ||
        status === "Yay?nda" ||
        status === "Aktif" ||
        status === "Acik" ||
        status === "A??k";

      return belongsToStudentClass && visibleStatus;
    });

    const normalized = visibleAssignments.map((assignment) => {
      const classId = getLinkedIds(assignment.fields?.Sinif)[0] || "";
      const classRecord = classes.find((item) => item.id === classId);

      const existingSubmission = submissions.find((submission) => {
        const sameAssignment = getLinkedIds(submission.fields?.Odev).includes(assignment.id);
        const sameStudent = getLinkedIds(submission.fields?.Ogrenci).includes(currentStudentId);

        return sameAssignment && sameStudent;
      });

      const dueDate = text(assignment.fields?.Teslim_Tarihi);
      const dueMs = Date.parse(dueDate || "");
      const isPastDue = Number.isFinite(dueMs) ? Date.now() > dueMs : false;

      return {
        id: assignment.id,
        title: text(assignment.fields?.Odev_Basligi) || "?dev",
        classId,
        className:
          text(classRecord?.fields?.Sinif_Adi) ||
          text(classRecord?.fields?.Ders_Adi) ||
          "S?n?f",
        description: text(assignment.fields?.Aciklama),
        dueDate,
        maxScore: Number(assignment.fields?.Maksimum_Puan || 100),
        assignmentType: text(assignment.fields?.Odev_Turu),
        difficulty: text(assignment.fields?.Zorluk_Seviyesi),
        resourceLink: text(assignment.fields?.Kaynak_Link),
        assignmentFiles: getAttachmentUrls(assignment.fields?.Dosya),
        isPastDue,
        submission: existingSubmission
          ? {
              id: existingSubmission.id,
              text: text(existingSubmission.fields?.Teslim_Metni),
              submittedAt: text(existingSubmission.fields?.Teslim_Tarihi),
              status: text(existingSubmission.fields?.Durum),
              score: existingSubmission.fields?.Puan ?? null,
              feedback: text(existingSubmission.fields?.Ogretmen_Geri_Bildirimi),
              isLate: Boolean(existingSubmission.fields?.Gec_Mi),
              files: getAttachmentUrls(existingSubmission.fields?.Dosya),
            }
          : null,
      };
    });

    normalized.sort((a, b) => {
      const dateA = Date.parse(a.dueDate || "");
      const dateB = Date.parse(b.dueDate || "");
      return (Number.isFinite(dateA) ? dateA : 9999999999999) - (Number.isFinite(dateB) ? dateB : 9999999999999);
    });

    return NextResponse.json({
      ok: true,
      studentFound: Boolean(currentStudentId),
      studentName:
        text(currentStudent?.fields?.Ad_Soyad) ||
        text(currentStudent?.fields?.Eposta) ||
        "??renci",
      assignments: normalized,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "??renci ?devleri al?namad?.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
