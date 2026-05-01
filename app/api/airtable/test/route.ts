import { NextResponse } from "next/server";
import { airtableMetaRequest } from "@/lib/airtableClient";

type AirtableTable = {
  id: string;
  name: string;
  primaryFieldId: string;
};

type AirtableMetaResponse = {
  tables: AirtableTable[];
};

export async function GET() {
  try {
    const data = await airtableMetaRequest<AirtableMetaResponse>("/tables");

    return NextResponse.json({
      ok: true,
      message: "Airtable bağlantısı başarılı.",
      baseId: process.env.AIRTABLE_BASE_ID,
      tableCount: data.tables.length,
      tables: data.tables.map((table) => ({
        id: table.id,
        name: table.name,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Airtable bağlantısı başarısız.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}