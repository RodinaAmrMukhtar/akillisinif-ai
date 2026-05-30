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
      throw new Error(`${tableName} okunamad?: ${details}`);
    }

    const data = (await response.json()) as { records?: AirtableRecord[]; offset?: string };
    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return records;
}

async function patchRecord(tableName: string, recordId: string, fields: Record<string, any>) {
  const response = await fetch(
    `${AIRTABLE_API_URL}/${getAirtableBaseId()}/${encodeURIComponent(tableName)}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${getAirtableToken()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${tableName} g?ncellenemedi: ${details}`);
  }

  return response.json();
}

function mapAttachments(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .map((item: any) => ({
      id: getString(item?.id),
      filename: getString(item?.filename) || "Dosya",
      url: getString(item?.url),
      type: getString(item?.type),
      size: getNumber(item?.size),
    }))
    .filter((item) => item.url);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const classId = getString(searchParams.get("classId"));
    const assignmentId = getString(searchParams.get("assignmentId"));

    if (!classId || !assignmentId) {
      return NextResponse.json(
        {
          ok: false,
          message: "classId ve assignmentId gerekli.",
        },
        { status: 400 },
      );
    }

    const [users, assignments, submissions] = await Promise.all([
      listAll("Kullanicilar"),
      listAll("Odevler"),
      listAll("Odev_Teslimleri"),
    ]);

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

    const assignmentSubmissions = submissions
      .filter((submission) => asLinks(submission.fields.Odev).includes(assignmentId))
      .map((submission) => {
        const studentId = asLinks(submission.fields.Ogrenci)[0] || "";
        const student = users.find((user) => user.id === studentId);

        return {
          id: submission.id,
          studentId,
          studentName: getString(student?.fields.Ad_Soyad) || "??renci",
          studentEmail: getString(student?.fields.Eposta),
          submissionText: getString(submission.fields.Teslim_Metni),
          submittedAt: getString(submission.fields.Teslim_Tarihi || submission.createdTime),
          status: getString(submission.fields.Durum) || "Teslim Edildi",
          score: getNumber(submission.fields.Puan),
          feedback: getString(submission.fields.Ogretmen_Geri_Bildirimi),
          isLate: Boolean(submission.fields.Gec_Mi),
          attachments: mapAttachments(submission.fields.Dosya),
        };
      });

    return NextResponse.json({
      ok: true,
      assignment: {
        id: assignment.id,
        title: getString(assignment.fields.Odev_Basligi) || "?dev",
        description: getString(assignment.fields.Aciklama),
        dueDate: getString(assignment.fields.Teslim_Tarihi),
        maxPoint: getNumber(assignment.fields.Maksimum_Puan),
        type: getString(assignment.fields.Odev_Turu),
        status: getString(assignment.fields.Durum),
      },
      submissions: assignmentSubmissions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Teslimatlar y?klenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const submissionId = getString(body.submissionId);
    const score = getNumber(body.score);
    const feedback = getString(body.feedback);
    const status = getString(body.status) || "Teslim Edildi";

    if (!submissionId) {
      return NextResponse.json(
        {
          ok: false,
          message: "submissionId gerekli.",
        },
        { status: 400 },
      );
    }

    const fields: Record<string, any> = {
      Durum: "Teslim Edildi",
      Ogretmen_Geri_Bildirimi: feedback,
    };

    if (score !== null) {
      fields.Puan = score;
    }

    await patchRecord("Odev_Teslimleri", submissionId, fields);

    return NextResponse.json({
      ok: true,
      message: "Teslimat de?erlendirildi.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Teslimat de?erlendirilemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
