"use client";

import { FormEvent, useState } from "react";
import {
  BsBarChart,
  BsGraphUp,
  BsRobot,
  BsSend,
  BsShieldCheck,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import { askAcademicAssistant } from "@/lib/assistantApi";
import { supabase } from "@/lib/supabaseClient";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const exampleQuestions = [
  "Hangi öğrenciler risk altında?",
  "Bugün öğretmen olarak neye öncelik vermeliyim?",
  "Değerlendirme bekleyen ödev teslimleri var mı?",
  "Yoklama durumunu analiz et.",
];

export default function TeacherAiAssistantPage() {
  const [question, setQuestion] = useState(exampleQuestions[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Merhaba. Ben AkıllıSınıf AI akademik analiz asistanıyım. Sınıf, ödev, not, yoklama ve risk verilerine göre öğretmen paneliniz için analiz üretebilirim.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanQuestion = question.trim();

    if (!cleanQuestion) return;

    setLoading(true);
    setErrorMessage("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setErrorMessage("Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      setLoading(false);
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: "user",
        content: cleanQuestion,
      },
    ]);

    try {
      const answer = await askAcademicAssistant({
        authId: data.user.id,
        role: "Ogretmen",
        question: cleanQuestion,
      });

      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: answer,
        },
      ]);

      setQuestion("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Akademik asistan yanıtı alınamadı.",
      );
    }

    setLoading(false);
  }

  return (
    <DashboardShell
      title="AI Asistan"
      description="Gerçek Airtable verilerine dayalı öğretmen akademik analiz asistanı."
      activePage="teacher-ai"
    >
      <div className="space-y-8">
        <section className="rounded-3xl border border-blue-100 bg-blue-50 p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold text-blue-700">
                <BsRobot />
                Kural Tabanlı Akademik AI Hazırlık Modu
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-blue-950">
                Öğretmen karar destek asistanı
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-900">
                Bu asistan sınıf, ödev, not, yoklama ve risk sinyallerini analiz eder.
                Şu anda güvenli kural tabanlı modda çalışır. Bir sonraki adımda
                OpenRouter bağlantısı eklenebilir.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
              <div className="rounded-2xl bg-white p-4">
                <BsGraphUp className="text-blue-700" />
                <p className="mt-3 text-sm font-bold text-slate-950">Risk analizi</p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <BsBarChart className="text-blue-700" />
                <p className="mt-3 text-sm font-bold text-slate-950">Not özeti</p>
              </div>

              <div className="rounded-2xl bg-white p-4">
                <BsShieldCheck className="text-blue-700" />
                <p className="mt-3 text-sm font-bold text-slate-950">Öneriler</p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`rounded-3xl p-5 ${
                    message.role === "assistant"
                      ? "bg-slate-50 text-slate-800"
                      : "bg-blue-700 text-white"
                  }`}
                >
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider opacity-70">
                    {message.role === "assistant" ? "Akademik Asistan" : "Siz"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-7">
                    {message.content}
                  </p>
                </div>
              ))}
            </div>

            {errorMessage && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
              <textarea
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                rows={3}
                placeholder="Örnek: Hangi öğrenciler risk altında?"
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <button
                type="submit"
                disabled={loading || !question.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <BsSend />
                {loading ? "Analiz ediliyor..." : "Analiz Et"}
              </button>
            </form>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold text-slate-950">
              Hazır Sorular
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Hızlı analiz için bu sorulardan birini seçebilirsiniz.
            </p>

            <div className="mt-5 space-y-3">
              {exampleQuestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuestion(item)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {item}
                </button>
              ))}
            </div>
          </aside>
        </section>
      </div>
    </DashboardShell>
  );
}
