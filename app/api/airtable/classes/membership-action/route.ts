import { NextResponse } from "next/server";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

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

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const membershipId = getString(body.membershipId);
    const action = getString(body.action);

    if (!membershipId) {
      return NextResponse.json(
        { ok: false, message: "membershipId gerekli." },
        { status: 400 },
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    const fields =
      action === "reject"
        ? { Durum: "Reddedildi" }
        : { Durum: "Aktif", Onay_Tarihi: today };

    const response = await fetch(
      `${AIRTABLE_API_URL}/${getAirtableBaseId()}/${encodeURIComponent("Sinif_Uyelikleri")}/${membershipId}`,
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
      return NextResponse.json(
        {
          ok: false,
          message: "Katılım isteği güncellenemedi.",
          error: details,
        },
        { status: response.status },
      );
    }

    return NextResponse.json({
      ok: true,
      message: action === "reject" ? "İstek reddedildi." : "İstek onaylandı.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "İşlem tamamlanamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
