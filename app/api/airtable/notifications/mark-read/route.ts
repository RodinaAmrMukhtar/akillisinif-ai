
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

async function patchRecord(recordId: string, fields: Record<string, any>) {
  const baseId = getEnv("AIRTABLE_BASE_ID");
  const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent("Bildirimler")}/${recordId}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: airtableHeaders(),
    body: JSON.stringify({
      fields,
      typecast: true,
    }),
  });

  const data = await response.json();

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function markOneRead(recordId: string) {
  const attempts = [
    { Okundu_Mu: true },
    { Okundu: true },
    { Durum: "Okundu" },
    { Okunma_Durumu: "Okundu" },
  ];

  let lastError: any = null;

  for (const fields of attempts) {
    const result = await patchRecord(recordId, fields);

    if (result.ok) {
      return result.data;
    }

    lastError = result.data;
  }

  throw new Error(JSON.stringify(lastError));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const notificationIds = Array.isArray(body.notificationIds)
      ? body.notificationIds
      : body.notificationId
        ? [body.notificationId]
        : [];

    if (notificationIds.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "notificationId gerekli.",
        },
        { status: 400 },
      );
    }

    const updated = [];

    for (const id of notificationIds) {
      updated.push(await markOneRead(String(id)));
    }

    return NextResponse.json({
      ok: true,
      updatedCount: updated.length,
      records: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Bildirim okundu olarak i?aretlenemedi. Airtable Bildirimler tablosunda Okundu_Mu checkbox veya Durum single select alan? olmal?.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
