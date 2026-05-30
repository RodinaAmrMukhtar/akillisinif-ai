import { NextResponse } from "next/server";

type AssistantRequestBody = {
  prompt?: string;
  question?: string;
  message?: string;
  role?: string;
  userEmail?: string;
  userName?: string;
  classId?: string;
  pageContext?: string;
};

function getWebhookUrl() {
  return process.env.N8N_AI_ASSISTANT_WEBHOOK_URL?.trim() || "";
}

function getWebhookSecret() {
  return process.env.N8N_AI_ASSISTANT_SECRET?.trim() || "";
}

function getString(value: unknown) {
  return String(value || "").trim();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantRequestBody;

    const message =
      getString(body.message) ||
      getString(body.prompt) ||
      getString(body.question);

    if (!message) {
      return NextResponse.json(
        {
          ok: false,
          message: "Asistan sorusu bo? olamaz.",
        },
        { status: 400 },
      );
    }

    const webhookUrl = getWebhookUrl();
    const webhookSecret = getWebhookSecret();

    if (!webhookUrl || !webhookSecret) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "n8n AI asistan webhook ayarlar? eksik. N8N_AI_ASSISTANT_WEBHOOK_URL ve N8N_AI_ASSISTANT_SECRET kontrol edilmeli.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-akillisinif-secret": webhookSecret,
      },
      body: JSON.stringify({
        message,
        role: getString(body.role),
        userEmail: getString(body.userEmail),
        userName: getString(body.userName),
        classId: getString(body.classId),
        pageContext: getString(body.pageContext),
      }),
      cache: "no-store",
    });

    const result = await response.json().catch(() => null);

    if (!response.ok || !result?.ok) {
      return NextResponse.json(
        {
          ok: false,
          message:
            result?.message ||
            result?.error ||
            "n8n AI asistan yan?t? olu?turulamad?.",
          details: result,
        },
        { status: response.status || 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      answer: result.answer,
      mode: result.mode || "n8n_openrouter",
      model: result.model || "openrouter/free",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "AI asistan iste?i tamamlanamad?.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
