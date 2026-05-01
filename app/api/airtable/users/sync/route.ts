import { NextResponse } from "next/server";
import { AIRTABLE_TABLES, airtableRequest } from "@/lib/airtableClient";

type AirtableRecord<T> = {
  id: string;
  fields: T;
};

type AirtableListResponse<T> = {
  records: AirtableRecord<T>[];
};

type AirtableCreateResponse<T> = {
  records: AirtableRecord<T>[];
};

type AirtableUserFields = {
  Ad_Soyad?: string;
  Eposta?: string;
  Rol?: string;
  Auth_ID?: string;
  Okul_No?: string;
  Durum?: string;
  Son_Giris?: string;
};

type SyncUserBody = {
  authId?: string;
  email?: string;
  fullName?: string;
  role?: string;
  schoolNumber?: string;
};

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
}

function normalizeRole(role: string) {
  if (role === "Ogretmen") return "Ogretmen";
  if (role === "Ogrenci") return "Ogrenci";

  return "Ogrenci";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SyncUserBody;

    const authId = body.authId?.trim();
    const email = body.email?.trim().toLowerCase();
    const fullName = body.fullName?.trim();
    const role = normalizeRole(body.role || "Ogrenci");
    const schoolNumber = body.schoolNumber?.trim() || "";

    if (!authId || !email || !fullName) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Kullanıcı eşitlemesi için authId, email ve fullName gereklidir.",
        },
        { status: 400 },
      );
    }

    const safeAuthId = escapeAirtableFormulaValue(authId);
    const safeEmail = escapeAirtableFormulaValue(email);

    const filterFormula = `OR({Auth_ID}='${safeAuthId}', {Eposta}='${safeEmail}')`;

    const existingUsers = await airtableRequest<
      AirtableListResponse<AirtableUserFields>
    >(
      `/${encodeURIComponent(
        AIRTABLE_TABLES.kullanicilar,
      )}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`,
    );

    const fields: AirtableUserFields = {
      Ad_Soyad: fullName,
      Eposta: email,
      Rol: role,
      Auth_ID: authId,
      Okul_No: schoolNumber,
      Durum: "Aktif",
      Son_Giris: new Date().toISOString(),
    };

    const existingRecord = existingUsers.records[0];

    if (existingRecord) {
      const updatedUser = await airtableRequest<AirtableRecord<AirtableUserFields>>(
        `/${encodeURIComponent(AIRTABLE_TABLES.kullanicilar)}/${
          existingRecord.id
        }`,
        {
          method: "PATCH",
          body: {
            fields,
          },
        },
      );

      return NextResponse.json({
        ok: true,
        action: "updated",
        message: "Kullanıcı Airtable üzerinde güncellendi.",
        recordId: updatedUser.id,
      });
    }

    const createdUsers = await airtableRequest<
      AirtableCreateResponse<AirtableUserFields>
    >(`/${encodeURIComponent(AIRTABLE_TABLES.kullanicilar)}`, {
      method: "POST",
      body: {
        records: [
          {
            fields,
          },
        ],
      },
    });

    return NextResponse.json({
      ok: true,
      action: "created",
      message: "Kullanıcı Airtable üzerinde oluşturuldu.",
      recordId: createdUsers.records[0]?.id,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Airtable kullanıcı eşitlemesi başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}