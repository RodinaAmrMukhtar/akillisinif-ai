import { NextResponse } from "next/server";

type AssistantRequestBody = {
  authId?: string;
  role?: "Ogretmen" | "Ogrenci";
  question?: string;
};

function getOpenRouterKey() {
  return process.env.OPENROUTER_API_KEY?.trim() || "";
}

function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";
}

async function getRuleBasedAnalysis(request: Request, body: AssistantRequestBody) {
  const origin = new URL(request.url).origin;

  const response = await fetch(`${origin}/api/airtable/assistant/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Airtable akademik analiz verisi alınamadı.",
    );
  }

  return String(result.answer || "");
}

function getRoleDescription(role: "Ogretmen" | "Ogrenci") {
  if (role === "Ogretmen") {
    return "Öğretmen için çalışan akademik karar destek asistanısın.";
  }

  return "Öğrenci için çalışan kişisel akademik destek asistanısın.";
}

async function callOpenRouter(input: {
  question: string;
  role: "Ogretmen" | "Ogrenci";
  ruleBasedAnswer: string;
}) {
  const apiKey = getOpenRouterKey();

  if (!apiKey || apiKey === "PASTE_YOUR_OPENROUTER_KEY_HERE") {
    throw new Error(
      "OpenRouter API anahtarı bulunamadı. Lütfen .env.local içine OPENROUTER_API_KEY değerini ekleyin ve npm run dev komutunu yeniden başlatın.",
    );
  }

  const roleInstruction =
    input.role === "Ogretmen"
      ? `
Kullanıcı öğretmendir.
- Sadece öğretmene uygun öneriler ver.
- Öğrenciye doğrudan hitap etme.
- Risk, not, yoklama, ödev teslimi ve sınıf yönetimi açısından pratik karar önerileri üret.
`
      : `
Kullanıcı öğrencidir.
- Sadece öğrenciye uygun öneriler ver.
- Öğretmen için eylem önerisi yazma.
- Öğrenciye destekleyici, açık ve dürüst şekilde konuş.
- Ödev yardımı isterse: ödevi onun yerine yapacağını söyleme; konuyu anlamasına, plan yapmasına, taslak oluşturmasına ve hatalarını kontrol etmesine yardım edebileceğini söyle.
`;

  const systemPrompt = `
Sen AkıllıSınıf AI sisteminin Türkçe akademik asistanısın.
${getRoleDescription(input.role)}

Kesin kurallar:
- Cevabı kullanıcının diline yakın ver. Kullanıcı İngilizce yazarsa İngilizce cevap verebilirsin; sistem içi akademik kavramları Türkçe koruyabilirsin.
- Verilen Airtable analizindeki sayıları değiştirme.
- Veri yoksa "bu konuda sistemde yeterli veri yok" de.
- Uydurma öğrenci, ödev, not, yoklama veya sınıf bilgisi üretme.
- Cevap kısa, doğal ve faydalı olsun.
- Gereksiz tekrar yapma.
- Öğretmen ve öğrenci rollerini karıştırma.
- Eğer kullanıcı "OpenRouter mı kullanıyorum?" gibi teknik bir şey sorarsa dürüstçe bağlantının OpenRouter üzerinden geldiğini söyle.
${roleInstruction}
`.trim();

  const userPrompt = `
Kullanıcının mesajı:
${input.question}

Sistemin Airtable verilerinden çıkardığı gerçek analiz:
${input.ruleBasedAnswer}

Görev:
Kullanıcının mesajına doğrudan cevap ver.
Analizi sadece gerektiği kadar kullan.
Eğer kullanıcı ödev yardımı soruyorsa, ona nasıl yardımcı olabileceğini açıkla ve eksik ödev bilgisini kısaca hatırlat.
`.trim();

  let result: any;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-OpenRouter-Title": "AkilliSinif AI",
    },
    body: JSON.stringify({
      model: getOpenRouterModel(),
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.15,
      max_tokens: 700,
    }),
  });

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      `OpenRouter bağlantısı başarısız. Durum: ${response.status}. Detay: ${
        result?.error?.message || "Ayrıntı alınamadı."
      }`,
    );
  }

  const content = String(result?.choices?.[0]?.message?.content || "").trim();

  if (!content) {
    throw new Error("OpenRouter boş yanıt döndürdü.");
  }

  const usedModel = result?.model || getOpenRouterModel();

  return {
    answer: `${content}

Teknik durum: OpenRouter aktif. Kullanılan model: ${usedModel}`,
    model: usedModel,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantRequestBody;

    const authId = body.authId?.trim();
    const role = body.role || "Ogrenci";
    const question = body.question?.trim() || "Akademik durumumu analiz et.";

    if (!authId) {
      return NextResponse.json(
        {
          ok: false,
          message: "authId gereklidir.",
        },
        { status: 400 },
      );
    }

    const ruleBasedAnswer = await getRuleBasedAnalysis(request, {
      authId,
      role,
      question,
    });

    const openRouterResult = await callOpenRouter({
      question,
      role,
      ruleBasedAnswer,
    });

    return NextResponse.json({
      ok: true,
      answer: openRouterResult.answer,
      mode: "openrouter",
      model: openRouterResult.model,
      ruleBasedAnswer,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "OpenRouter AI asistan yanıtı oluşturulamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
