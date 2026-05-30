
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

function cleanFields(fields: Record<string, any>) {
  const cleaned: Record<string, any> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== "") {
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

async function createRecord(tableName: string, fields: Record<string, any>) {
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

async function updateRecord(tableName: string, recordId: string, fields: Record<string, any>) {
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

    const studentEmail = text(body.studentEmail).toLowerCase();
    const assignmentId = text(body.assignmentId);
    const submissionText = text(body.submissionText);
    const fileUrl = text(body.fileUrl);
    const fileName = text(body.fileName) || "?dev Dosyas?";

    if (!assignmentId) {
      return NextResponse.json(
        {
          ok: false,
          message: "assignmentId gerekli.",
        },
        { status: 400 },
      );
    }

    if (!submissionText && !fileUrl) {
      return NextResponse.json(
        {
          ok: false,
          message: "Teslim metni veya dosya ba?lant?s? gerekli.",
        },
        { status: 400 },
      );
    }

    const usersResult = await listAirtableRecords("Kullanicilar");
    const assignmentsResult = await listAirtableRecords("Odevler");
    const submissionsResult = await listAirtableRecords("Odev_Teslimleri");

    for (const result of [usersResult, assignmentsResult, submissionsResult]) {
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: "Airtable kay?tlar? okunamad?.",
            details: result.error,
          },
          { status: result.status },
        );
      }
    }

    const users = usersResult.records;
    const assignments = assignmentsResult.records;
    const submissions = submissionsResult.records;

    const student = users.find((user) => text(user.fields?.Eposta).toLowerCase() === studentEmail);

    if (!student) {
      return NextResponse.json(
        {
          ok: false,
          message: "??renci bulunamad?.",
        },
        { status: 404 },
      );
    }

    const assignment = assignments.find((item) => item.id === assignmentId);

    if (!assignment) {
      return NextResponse.json(
        {
          ok: false,
          message: "?dev bulunamad?.",
        },
        { status: 404 },
      );
    }

    const classId = getLinkedIds(assignment.fields?.Sinif)[0] || "";
    const dueDate = text(assignment.fields?.Teslim_Tarihi);
    const dueMs = Date.parse(dueDate || "");
    const isLate = Number.isFinite(dueMs) ? Date.now() > dueMs : false;

    const existingSubmission = submissions.find((submission) => {
      const sameAssignment = getLinkedIds(submission.fields?.Odev).includes(assignmentId);
      const sameStudent = getLinkedIds(submission.fields?.Ogrenci).includes(student.id);

      return sameAssignment && sameStudent;
    });

    const assignmentTitle = text(assignment.fields?.Odev_Basligi) || "?dev";
    const studentName =
      text(student.fields?.Ad_Soyad) ||
      text(student.fields?.Eposta) ||
      "??renci";

    const attachmentField = fileUrl
      ? [
          {
            url: fileUrl,
            filename: fileName,
          },
        ]
      : undefined;

    const fields = {
      Teslim_Adi: `${studentName} - ${assignmentTitle}`,
      Odev: [assignmentId],
      Ogrenci: [student.id],
      Sinif: classId ? [classId] : undefined,
      Teslim_Metni: submissionText,
      Dosya: attachmentField,
      Teslim_Tarihi: new Date().toISOString(),
      Durum: "Teslim Edildi",
      Gec_Mi: isLate,
    };

    const saved = existingSubmission
      ? await updateRecord("Odev_Teslimleri", existingSubmission.id, fields)
      : await createRecord("Odev_Teslimleri", fields);

    return NextResponse.json({
      ok: true,
      message: existingSubmission
        ? "?dev teslimin g?ncellendi."
        : "?dev teslimin kaydedildi.",
      submission: saved,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "?dev teslim edilemedi. Dosya ba?lant?s? kullan?yorsan ba?lant?n?n herkese a??k oldu?undan emin ol.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
