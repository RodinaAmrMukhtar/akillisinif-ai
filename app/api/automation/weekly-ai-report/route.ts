import { NextResponse } from "next/server";

type WeeklyReport = {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  summary: {
    activeClassCount: number;
    activeStudentCount: number;
    pendingJoinRequestCount: number;
    assignmentCount: number;
    submissionCount: number;
    ungradedSubmissionCount: number;
    attendanceSessionCount: number;
    attendanceRecordCount: number;
    riskyStudentCount: number;
  };
  riskyStudents: {
    studentId: string;
    studentName: string;
    gradeAverage: number | null;
    submissionRate: number | null;
    attendanceRate: number | null;
    riskScore: number;
    riskLevel: string;
  }[];
  reportText: string;
};

type WeeklyReportResponse = {
  ok: boolean;
  generatedAt: string;
  reportCount: number;
  reports: WeeklyReport[];
};

function getAutomationSecret() {
  return process.env.AUTOMATION_SECRET?.trim() || "";
}

function getOpenRouterKey() {
  return process.env.OPENROUTER_API_KEY?.trim() || "";
}

function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL?.trim() || "openrouter/free";
}

function isAuthorized(request: Request) {
  const expectedSecret = getAutomationSecret();

  if (!expectedSecret) {
    return false;
  }

  const headerSecret = request.headers.get("x-automation-secret")?.trim() || "";
  return headerSecret === expectedSecret;
}

async function getWeeklyReport(request: Request) {
  const origin = new URL(request.url).origin;
  const secret = getAutomationSecret();

  const response = await fetch(`${origin}/api/automation/weekly-report`, {
    method: "GET",
    headers: {
      "x-automation-secret": secret,
    },
    cache: "no-store",
  });

  const result = (await response.json()) as WeeklyReportResponse & {
    message?: string;
    error?: string;
  };

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Haftalık rapor verisi alınamadı.",
    );
  }

  return result;
}

async function createAiReport(report: WeeklyReport) {
  const apiKey = getOpenRouterKey();

  if (!apiKey || apiKey === "PASTE_YOUR_OPENROUTER_KEY_HERE") {
    throw new Error(
      "OpenRouter API anahtarı bulunamadı. Vercel Environment Variables içinde OPENROUTER_API_KEY değerini kontrol edin.",
    );
  }

  const systemPrompt = `
Sen AkıllıSınıf AI içinde çalışan Türkçe akademik raporlama asistanısın.

Kurallar:
- Sadece verilen haftalık rapor verilerine dayan.
- Sayıları değiştirme.
- Öğrenci, sınıf, ödev, yoklama veya risk bilgisi uydurma.
- Ciddi, akademik ve profesyonel yaz.
- Öğretmene yönelik uygulanabilir öneriler ver.
- Çıktıyı kısa ama sunuma hazır yaz.
- Bölümler kullan:
  1. Haftalık Genel Özet
  2. Öncelikli Bulgular
  3. Risk ve Müdahale Önerileri
  4. Öğretmen İçin Sonraki Adımlar
`.trim();

  const userPrompt = `
Öğretmen:
${report.teacherName}
E-posta:
${report.teacherEmail || "veri yok"}

Gerçek haftalık sistem raporu:
${report.reportText}

Yapılandırılmış özet:
${JSON.stringify(report.summary, null, 2)}

Riskli öğrenciler:
${JSON.stringify(report.riskyStudents, null, 2)}

Bu verilerden öğretmene gönderilecek profesyonel haftalık AI akademik raporu oluştur.
`.trim();

  let result: any = {};

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://akillisinif-ai.vercel.app",
      "X-OpenRouter-Title": "AkilliSinif AI n8n Weekly Report",
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
      max_tokens: 1000,
    }),
  });

  try {
    result = await response.json();
  } catch {
    result = {};
  }

  if (!response.ok) {
    throw new Error(
      `OpenRouter haftalık rapor hatası. Durum: ${response.status}. Detay: ${
        result?.error?.message || "Ayrıntı alınamadı."
      }`,
    );
  }

  const content = String(result?.choices?.[0]?.message?.content || "").trim();

  if (!content) {
    throw new Error("OpenRouter haftalık rapor için boş yanıt döndürdü.");
  }

  return {
    aiReportText: `${content}

Teknik durum: OpenRouter aktif. Kullanılan model: ${
      result?.model || getOpenRouterModel()
    }`,
    model: result?.model || getOpenRouterModel(),
  };
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Yetkisiz otomasyon isteği.",
        },
        { status: 401 },
      );
    }

    const weeklyReport = await getWeeklyReport(request);

    const enhancedReports = [];

    for (const report of weeklyReport.reports) {
      const aiResult = await createAiReport(report);

      enhancedReports.push({
        ...report,
        aiReportText: aiResult.aiReportText,
        model: aiResult.model,
      });
    }

    const combinedReportText = enhancedReports
      .map((report) => {
        return [
          `Öğretmen: ${report.teacherName}`,
          `E-posta: ${report.teacherEmail || "veri yok"}`,
          "",
          report.aiReportText,
        ].join("\n");
      })
      .join("\n\n----------------------------------------\n\n");

    return NextResponse.json({
      ok: true,
      generatedAt: new Date().toISOString(),
      reportCount: enhancedReports.length,
      mode: "n8n_openrouter_weekly_ai_report",
      reports: enhancedReports,
      combinedReportText,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "AI destekli haftalık otomasyon raporu oluşturulamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
