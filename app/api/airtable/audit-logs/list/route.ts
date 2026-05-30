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

export async function GET() {
  try {
    const logsResult = await listAirtableRecords("Denetim_Kayitlari");
    const usersResult = await listAirtableRecords("Kullanicilar");

    for (const result of [logsResult, usersResult]) {
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: "Denetim kayıtları okunamadı.",
            details: result.error,
          },
          { status: result.status },
        );
      }
    }

    const logs = logsResult.records;
    const users = usersResult.records;

    const normalized = logs.map((log) => {
      const userId = getLinkedIds(log.fields?.Kullanici)[0] || "";
      const user = users.find((item) => item.id === userId);

      return {
        id: log.id,
        title: text(log.fields?.Islem_Adi) || "Denetim Kaydı",
        userName:
          text(user?.fields?.Ad_Soyad) ||
          text(user?.fields?.Eposta) ||
          "Sistem",
        operationType: text(log.fields?.Islem_Turu),
        tableName: text(log.fields?.Tablo_Adi),
        recordId: text(log.fields?.Kayit_ID),
        oldValue: text(log.fields?.Eski_Deger),
        newValue: text(log.fields?.Yeni_Deger),
        ipAddress: text(log.fields?.IP_Adresi),
        description: text(log.fields?.Aciklama),
        actionDate: text(log.fields?.Islem_Tarihi),
      };
    });

    normalized.sort((a, b) => {
      const dateA = Date.parse(a.actionDate || "");
      const dateB = Date.parse(b.actionDate || "");
      return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
    });

    return NextResponse.json({
      ok: true,
      count: normalized.length,
      logs: normalized,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Denetim kayıtları alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
