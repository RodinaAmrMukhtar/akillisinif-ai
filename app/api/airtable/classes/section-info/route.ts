import { NextResponse } from "next/server";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
};

function getString(value: unknown) {
  return String(value || "").trim();
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = getString(searchParams.get("classId"));

    if (!classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "classId gerekli.",
        },
        { status: 400 },
      );
    }

    const response = await fetch(
      `${AIRTABLE_API_URL}/${getAirtableBaseId()}/${encodeURIComponent("Siniflar")}/${classId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getAirtableToken()}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const details = await response.text();

      return NextResponse.json(
        {
          ok: false,
          message: "S?n?f bilgisi okunamad?.",
          error: details,
        },
        { status: response.status },
      );
    }

    const record = (await response.json()) as AirtableRecord;
    const fields = record.fields || {};

    return NextResponse.json({
      ok: true,
      class: {
        id: record.id,
        name:
          getString(fields.Sinif_Adi) ||
          getString(fields.Ders_Adi) ||
          "S?n?f",
        courseName: getString(fields.Ders_Adi),
        description: getString(fields.Aciklama),
        inviteCode: getString(fields.Aktif_Kod),
        status: getString(fields.Durum) || "Aktif",
        requiresApproval: Boolean(fields.Katilim_Onayi_Gerekli_Mi),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "S?n?f bilgisi y?klenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
