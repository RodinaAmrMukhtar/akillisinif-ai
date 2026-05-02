import { NextResponse } from "next/server";

type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, any>;
};

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

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
    .replace(/\s+/g, " ")
    .trim();
}

function asLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

async function listAll(tableName: string): Promise<AirtableRecord[]> {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();

  if (!token) throw new Error("AIRTABLE_TOKEN eksik.");
  if (!baseId) throw new Error("AIRTABLE_BASE_ID eksik.");

  let offset = "";
  const records: AirtableRecord[] = [];

  do {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`);
    url.searchParams.set("pageSize", "100");

    if (offset) url.searchParams.set("offset", offset);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Airtable okuma hatası. Tablo: ${tableName}. Durum: ${response.status}. Detay: ${details}`);
    }

    const data = (await response.json()) as {
      records?: AirtableRecord[];
      offset?: string;
    };

    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return records;
}

async function patchRecord(tableName: string, recordId: string, fields: Record<string, unknown>) {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();

  if (!token) throw new Error("AIRTABLE_TOKEN eksik.");
  if (!baseId) throw new Error("AIRTABLE_BASE_ID eksik.");

  const response = await fetch(
    `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}/${recordId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Airtable güncelleme hatası. Durum: ${response.status}. Detay: ${details}`);
  }

  return response.json();
}

function findUser(users: AirtableRecord[], authId: string, email: string, name: string) {
  return users.find((user) => {
    const airtableAuthId = getString(user.fields.Auth_ID);
    const airtableEmail = normalize(user.fields.Eposta);
    const airtableName = normalize(user.fields.Ad_Soyad);

    return (
      Boolean(authId && airtableAuthId === authId) ||
      Boolean(email && airtableEmail === normalize(email)) ||
      Boolean(name && airtableName === normalize(name))
    );
  });
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const authId = getString(body.authId);
    const email = getString(body.email);
    const name = getString(body.name);
    const notificationId = getString(body.notificationId);
    const markAll = Boolean(body.markAll);

    const [users, notifications] = await Promise.all([
      listAll("Kullanicilar"),
      listAll("Bildirimler"),
    ]);

    const user = findUser(users, authId, email, name);

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Kullanıcı Airtable içinde bulunamadı.",
        },
        { status: 404 },
      );
    }

    const userNotifications = notifications.filter((notification) =>
      asLinks(notification.fields.Alici).includes(user.id),
    );

    const targets = markAll
      ? userNotifications.filter((notification) => !Boolean(notification.fields.Okundu_Mu))
      : userNotifications.filter((notification) => notification.id === notificationId);

    if (!markAll && targets.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu bildirim bu kullanıcıya ait değil veya bulunamadı.",
        },
        { status: 404 },
      );
    }

    const today = new Date().toISOString().slice(0, 10);

    await Promise.all(
      targets.map((notification) =>
        patchRecord("Bildirimler", notification.id, {
          Okundu_Mu: true,
          Okunma_Tarihi: today,
        }),
      ),
    );

    return NextResponse.json({
      ok: true,
      updatedCount: targets.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Bildirim okundu olarak işaretlenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
