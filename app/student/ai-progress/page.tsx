"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";

type StudentSummary = {
  id: string;
  title: string;
  className: string;
  generalAverage: number | null;
  lastThreeAverage: number | null;
  gradeTrend: string;
  gradeDropScore: number | null;
  attendanceRate: number | null;
  assignmentSubmissionRate: number | null;
  lateSubmissionCount: number | null;
  missingAssignmentCount: number | null;
  classAverageDifference: number | null;
  riskScore: number | null;
  riskLevel: string;
  aiSuggestion: string;
  calculatedAt: string;
  updatedAt: string;
};

type StudentPrediction = {
  id: string;
  title: string;
  className: string;
  summary: string;
  predictedGrade: number | null;
  passingProbability: number | null;
  riskLevel: string;
  explanation1: string;
  explanation2: string;
  explanation3: string;
  predictionDate: string;
  isValid: boolean;
};

function getRiskClass(level: string) {
  if (level === "Kritik") return "border-red-200 bg-red-50 text-red-700";
  if (level === "Yüksek" || level === "Yuksek") return "border-orange-200 bg-orange-50 text-orange-700";
  if (level === "Orta") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getTrendClass(trend: string) {
  if (trend === "Artis" || trend === "Artış") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (trend === "Dusuyor" || trend === "Düşüyor" || trend === "Ani Dusus" || trend === "Ani Düşüş") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatValue(value: number | null, suffix = "") {
  if (value === null || !Number.isFinite(value)) return "Yok";
  return `${Math.round(value)}${suffix}`;
}

export default function StudentAiProgressPage() {
  const [studentName, setStudentName] = useState("Öğrenci");
  const [summaries, setSummaries] = useState<StudentSummary[]>([]);
  const [predictions, setPredictions] = useState<StudentPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProgress() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const email = user?.email || "";

        const response = await fetch(
          `/api/airtable/student-ai-progress/list?studentEmail=${encodeURIComponent(email)}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "AI gelişim verileri alınamadı.");
        }

        setStudentName(result.studentName || "Öğrenci");
        setSummaries(result.summaries || []);
        setPredictions(result.predictions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  const stats = useMemo(() => {
    const latestSummary = summaries[0];

    const validPredictions = predictions.filter((prediction) => prediction.isValid);
    const avgPredictedGrade =
      validPredictions.length > 0
        ? Math.round(
            validPredictions.reduce(
              (sum, prediction) => sum + Number(prediction.predictedGrade || 0),
              0,
            ) / validPredictions.length,
          )
        : null;

    const avgPassingProbability =
      validPredictions.filter((prediction) => prediction.passingProbability !== null).length > 0
        ? Math.round(
            validPredictions
              .filter((prediction) => prediction.passingProbability !== null)
              .reduce((sum, prediction) => sum + Number(prediction.passingProbability), 0) /
              validPredictions.filter((prediction) => prediction.passingProbability !== null).length,
          )
        : null;

    return {
      latestSummary,
      avgPredictedGrade,
      avgPassingProbability,
      predictionCount: predictions.length,
      summaryCount: summaries.length,
    };
  }, [summaries, predictions]);

  return (
    <DashboardShell
      title="AI Gelişim Paneli"
      description="Kişisel performans özetlerin, tahminlerin ve gelişim önerilerin."
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Öğrenci Paneli
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{studentName}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Bu sayfa, öğretmenin tarafından öğrencilerle paylaşılması uygun görülen AI tahminlerini
            ve otomatik gelişim özetlerini gösterir.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            AI gelişim verileri yükleniyor...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            {error}
          </div>
        ) : summaries.length === 0 && predictions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Henüz görüntülenecek AI gelişim verisi bulunmuyor.
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-500">Genel Ortalama</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {formatValue(stats.latestSummary?.generalAverage ?? null)}
                </p>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-blue-600">Tahmini Dönem Notu</p>
                <p className="mt-2 text-3xl font-bold text-blue-700">
                  {formatValue(stats.avgPredictedGrade)}
                </p>
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-emerald-600">Geçme Olasılığı</p>
                <p className="mt-2 text-3xl font-bold text-emerald-700">
                  {formatValue(stats.avgPassingProbability, "%")}
                </p>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-5 shadow-sm">
                <p className="text-sm font-medium text-amber-600">Risk Seviyesi</p>
                <p className="mt-2 text-3xl font-bold text-amber-700">
                  {stats.latestSummary?.riskLevel || "Yok"}
                </p>
              </div>
            </div>

            {summaries.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-950">Gelişim Özetleri</h2>

                {summaries.map((summary) => (
                  <article
                    key={summary.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {summary.className}
                        </p>
                        <h3 className="mt-2 text-xl font-bold text-slate-950">
                          {summary.title}
                        </h3>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClass(
                            summary.riskLevel,
                          )}`}
                        >
                          {summary.riskLevel || "Risk yok"}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-sm font-semibold ${getTrendClass(
                            summary.gradeTrend,
                          )}`}
                        >
                          {summary.gradeTrend || "Trend yok"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Son 3 Not
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {formatValue(summary.lastThreeAverage)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Ödev Teslim
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {formatValue(summary.assignmentSubmissionRate, "%")}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Devamsızlık
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {formatValue(summary.attendanceRate, "%")}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Eksik Ödev
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {formatValue(summary.missingAssignmentCount)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <h4 className="font-bold text-slate-950">AI Önerisi</h4>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {summary.aiSuggestion || "Henüz öneri yok."}
                      </p>
                    </div>
                  </article>
                ))}
              </section>
            ) : null}

            {predictions.length > 0 ? (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-slate-950">AI Performans Tahminleri</h2>

                {predictions.map((prediction) => (
                  <article
                    key={prediction.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                          {prediction.className}
                        </p>
                        <h3 className="mt-2 text-xl font-bold text-slate-950">
                          {prediction.title}
                        </h3>
                      </div>

                      <span
                        className={`w-fit rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClass(
                          prediction.riskLevel,
                        )}`}
                      >
                        {prediction.riskLevel || "Risk yok"}
                      </span>
                    </div>

                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Tahmini Not
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-950">
                          {formatValue(prediction.predictedGrade)}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Geçme Olasılığı
                        </p>
                        <p className="mt-2 text-2xl font-bold text-emerald-700">
                          {formatValue(prediction.passingProbability, "%")}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Tahmin Tarihi
                        </p>
                        <p className="mt-2 font-semibold text-slate-900">
                          {prediction.predictionDate || "Yok"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <h4 className="font-bold text-slate-950">Özet</h4>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {prediction.summary || "Tahmin özeti yok."}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                      {[prediction.explanation1, prediction.explanation2, prediction.explanation3]
                        .filter(Boolean)
                        .map((explanation, index) => (
                          <div
                            key={`${prediction.id}-${index}`}
                            className="rounded-2xl border border-slate-100 bg-slate-50 p-5"
                          >
                            <h4 className="font-bold text-slate-950">
                              Açıklama {index + 1}
                            </h4>
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                              {explanation}
                            </p>
                          </div>
                        ))}
                    </div>
                  </article>
                ))}
              </section>
            ) : null}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
