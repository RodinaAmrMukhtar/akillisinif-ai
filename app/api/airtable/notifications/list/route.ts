
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

function lower(value: unknown) {
  return text(value).toLowerCase();
}

function getLinkedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function pick(fields: Record<string, any>, names: string[]) {
  for (const name of names) {
    if (fields[name] !== undefined && fields[name] !== null && text(fields[name]) !== "") {
      return fields[name];
    }
  }

  return "";
}

function isRead(fields: Record<string, any>) {
  const checkboxValue = fields.Okundu_Mu ?? fields.Okundu ?? fields.Read;

  if (typeof checkboxValue === "boolean") {
    return checkboxValue;
  }

  const status = lower(fields.Durum ?? fields.Okunma_Durumu ?? fields.Status);

  return (
    status === "okundu" ||
    status === "read" ||
    status === "tamamlandi" ||
    status === "tamamland?"
  );
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

    const email =
      lower(searchParams.get("email")) ||
      lower(searchParams.get("userEmail")) ||
      lower(searchParams.get("teacherEmail")) ||
      lower(searchParams.get("studentEmail"));

    const usersResult = await listAirtableRecords("Kullanicilar");
    const notificationsResult = await listAirtableRecords("Bildirimler");

    for (const result of [usersResult, notificationsResult]) {
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: "Bildirim kay?tlar? okunamad?.",
            details: result.error,
          },
          { status: result.status },
        );
      }
    }

    const users = usersResult.records;
    const notifications = notificationsResult.records;

    const currentUser = users.find((user) => lower(user.fields?.Eposta) === email);
    const currentUserId = currentUser?.id || "";

    const filtered = notifications.filter((notification) => {
      if (!email && !currentUserId) {
        return true;
      }

      const fields = notification.fields || {};

      const linkedRecipientIds = [
        ...getLinkedIds(fields.Kullanici),
        ...getLinkedIds(fields.Alici),
        ...getLinkedIds(fields.Ogrenci),
        ...getLinkedIds(fields.Ogretmen),
        ...getLinkedIds(fields.Veli),
      ];

      const directEmail =
        lower(fields.Eposta) ||
        lower(fields.Alici_Eposta) ||
        lower(fields.Kullanici_Eposta) ||
        lower(fields.Email);

      return (
        linkedRecipientIds.includes(currentUserId) ||
        Boolean(directEmail && directEmail === email)
      );
    });

    const normalized = filtered.map((notification) => {
      const fields = notification.fields || {};

      const title = text(
        pick(fields, [
          "Bildirim_Basligi",
          "Bildirim_Ba?l???",
          "Baslik",
          "Ba?l?k",
          "Bildirim_Adi",
          "Bildirim_Ad?",
          "Islem_Adi",
          "??lem_Ad?",
        ]),
      );

      const message = text(
        pick(fields, [
          "Mesaj",
          "Bildirim_Mesaji",
          "Bildirim_Mesaj?",
          "Bildirim_Metni",
          "Icerik",
          "??erik",
          "Aciklama",
          "A??klama",
        ]),
      );

      const type = text(
        pick(fields, [
          "Bildirim_Turu",
          "Bildirim_T?r?",
          "Tur",
          "T?r",
          "Kategori",
          "Islem_Turu",
          "??lem_T?r?",
        ]),
      );

      const createdAt =
        text(
          pick(fields, [
            "Olusturma_Tarihi",
            "Olu?turma_Tarihi",
            "Bildirim_Tarihi",
            "Tarih",
            "Gonderim_Tarihi",
            "G?nderim_Tarihi",
          ]),
        ) || notification.createdTime || "";

      return {
        id: notification.id,
        title: title || "Bildirim",
        message: message || "Bildirim detay? bulunmuyor.",
        type: type || "Genel",
        read: isRead(fields),
        link: text(pick(fields, ["Link", "URL", "Hedef_Link", "Yonlendirme_Link", "Y?nlendirme_Link"])),
        relatedTable: text(pick(fields, ["Ilgili_Tablo", "?lgili_Tablo", "Tablo_Adi", "Tablo_Ad?"])),
        relatedRecordId: text(pick(fields, ["Ilgili_Kayit_ID", "?lgili_Kay?t_ID", "Kayit_ID", "Kay?t_ID"])),
        createdAt,
      };
    });

    normalized.sort((a, b) => {
      if (Number(a.read) !== Number(b.read)) {
        return Number(a.read) - Number(b.read);
      }

      const dateA = Date.parse(a.createdAt || "");
      const dateB = Date.parse(b.createdAt || "");

      return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
    });

    return NextResponse.json({
      ok: true,
      userFound: Boolean(currentUserId),
      count: normalized.length,
      unreadCount: normalized.filter((item) => !item.read).length,
      notifications: normalized,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Bildirimler al?namad?.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
