import { NextResponse } from "next/server";
import { airtableMetaRequest } from "@/lib/airtableClient";

type AirtableField = {
  id: string;
  name: string;
  type: string;
  options?: {
    choices?: {
      id: string;
      name: string;
      color?: string;
    }[];
    linkedTableId?: string;
  };
};

type AirtableTable = {
  id: string;
  name: string;
  fields: AirtableField[];
  primaryFieldId: string;
};

type AirtableMetaResponse = {
  tables: AirtableTable[];
};

const targetTables = [
  "Konular",
  "Odevler",
  "Odev_Teslimleri",
  "Notlar",
  "Yoklamalar",
  "Siniflar",
  "Kullanicilar",
];

export async function GET() {
  try {
    const data = await airtableMetaRequest<AirtableMetaResponse>("/tables");

    const tables = data.tables
      .filter((table) => targetTables.includes(table.name))
      .map((table) => ({
        id: table.id,
        name: table.name,
        fields: table.fields.map((field) => ({
          id: field.id,
          name: field.name,
          type: field.type,
          choices: field.options?.choices?.map((choice) => choice.name) || [],
          linkedTableId: field.options?.linkedTableId || null,
        })),
      }));

    return NextResponse.json({
      ok: true,
      message: "Akademik tablo şemaları başarıyla okundu.",
      tables,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Akademik tablo şemaları okunamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
