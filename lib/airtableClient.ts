const AIRTABLE_API_URL = "https://api.airtable.com/v0";

function getAirtableToken() {
  const token = process.env.AIRTABLE_TOKEN;

  if (!token) {
    throw new Error("Missing AIRTABLE_TOKEN environment variable.");
  }

  return token;
}

function getAirtableBaseId() {
  const baseId = process.env.AIRTABLE_BASE_ID;

  if (!baseId) {
    throw new Error("Missing AIRTABLE_BASE_ID environment variable.");
  }

  return baseId;
}

type AirtableRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function airtableRequest<T>(
  path: string,
  options: AirtableRequestOptions = {},
): Promise<T> {
  const token = getAirtableToken();
  const baseId = getAirtableBaseId();

  const response = await fetch(`${AIRTABLE_API_URL}/${baseId}${path}`, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Airtable request failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return response.json() as Promise<T>;
}

export async function airtableMetaRequest<T>(path: string): Promise<T> {
  const token = getAirtableToken();
  const baseId = getAirtableBaseId();

  const response = await fetch(
    `https://api.airtable.com/v0/meta/bases/${baseId}${path}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Airtable meta request failed: ${response.status} ${response.statusText} - ${errorText}`,
    );
  }

  return response.json() as Promise<T>;
}

export const AIRTABLE_TABLES = {
  kullanicilar: "Kullanicilar",
  siniflar: "Siniflar",
  davetKodlari: "Davet_Kodlari",
  sinifUyelikleri: "Sinif_Uyelikleri",
  bildirimler: "Bildirimler",
};