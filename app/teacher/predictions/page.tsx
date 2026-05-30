"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";

type Prediction = {
  id: string;
  title: string;
  studentName: string;
  studentEmail: string;
  className: string;
  summary: string;
  predictedGrade: number;
  passingProbability: number | null;
  riskLevel: string;
  explanation1: string;
  explanation2: string;
  explanation3: string;
  showToStudent: boolean;
  showToTeacher: boolean;
  predictionDate: string;
  isValid: boolean;
  sourceGradeCode: string;
};

function getRiskClass(level: string) {
  if (level === "Kritik") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (level === "Yüksek" || level === "Yuksek") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (level === "Orta") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function getProbabilityClass(value: number | null) {
  if (value === null) {
    return "text-slate-500";
  }

  if (value < 50) {
    return "text-red-700";
  }

  if (value < 70) {
    return "text-orange-700";
  }

  return "text-emerald-700";
}

function formatNumber(value: number) {
  if (!Number.isFinite(value)) return "0";
  return Math.round(value).toString();
}

export default function TeacherPredictionsPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadPredictions() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const email = user?.email || "";

        const response = await fetch(
          `/api/airtable/predictions/list?teacherEmail=${encodeURIComponent(email)}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "AI tahminleri alınamadı.");
        }

        setPredictions(result.predictions || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadPredictions();
  }, []);

  const stats = useMemo(() => {
    const valid = predictions.filter((prediction) => prediction.isValid);
    const urgent = valid.filter(
      (prediction) =>
        prediction.riskLevel === "Kritik" ||
        prediction.riskLevel === "Yüksek" ||
        prediction.riskLevel === "Yuksek",
    );

    const avgPredictedGrade =
      valid.length > 0
        ? Math.round(
            valid.reduce((sum, prediction) => sum + prediction.predictedGrade, 0) /
              valid.length,
          )
        : 0;

    const avgPassingProbability =
      valid.filter((prediction) => prediction.passingProbability !== null).length > 0
        ? Math.round(
            valid
              .filter((prediction) => prediction.passingProbability !== null)
              .reduce((sum, prediction) => sum + Number(prediction.passingProbability), 0) /
              valid.filter((prediction) => prediction.passingProbability !== null).length,
          )
        : 0;

    return {
      total: predictions.length,
      valid: valid.length,
      urgent: urgent.length,
      avgPredictedGrade,
      avgPassingProbability,
    };
  }, [predictions]);

  const filteredPredictions = useMemo(() => {
    if (filter === "all") return predictions;

    if (filter === "valid") {
      return predictions.filter((prediction) => prediction.isValid);
    }

    if (filter === "urgent") {
      return predictions.filter(
        (prediction) =>
          prediction.riskLevel === "Kritik" ||
          prediction.riskLevel === "Yüksek" ||
          prediction.riskLevel === "Yuksek",
      );
    }

    if (filter === "studentVisible") {
      return predictions.filter((prediction) => prediction.showToStudent);
    }

    return predictions;
  }, [filter, predictions]);

  return (
    <DashboardShell
      title="AI Performans Tahminleri"
      description="Öğrenciler için oluşturulan dönem sonu not, geçme olasılığı ve risk tahminleri."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <button
            onClick={() => setFilter("all")}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-slate-500">Toplam Tahmin</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stats.total}</p>
          </button>

          <button
            onClick={() => setFilter("valid")}
            className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-blue-600">Geçerli Tahmin</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.valid}</p>
          </button>

          <button
            onClick={() => setFilter("urgent")}
            className="rounded-3xl border border-orange-100 bg-orange-50 p-5 text-left shadow-sm transition hover:border-orange-300"
          >
            <p className="text-sm font-medium text-orange-600">Öncelikli Risk</p>
            <p className="mt-2 text-3xl font-bold text-orange-700">{stats.urgent}</p>
          </button>

          <button
            onClick={() => setFilter("studentVisible")}
            className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-left shadow-sm transition hover:border-emerald-300"
          >
            <p className="text-sm font-medium text-emerald-600">Öğrenciye Açık</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">
              {predictions.filter((prediction) => prediction.showToStudent).length}
            </p>
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Ortalama Tahmini Dönem Notu</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {stats.avgPredictedGrade}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Ortalama Geçme Olasılığı</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              %{stats.avgPassingProbability}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            AI tahminleri yükleniyor...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            {error}
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Bu filtrede gösterilecek AI tahmini bulunmuyor.
          </div>
        ) : (
          <div className="space-y-5">
            {filteredPredictions.map((prediction) => (
              <article
                key={prediction.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {prediction.className}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                      {prediction.studentName}
                    </h2>
                    {prediction.studentEmail ? (
                      <p className="mt-1 text-sm text-slate-500">
                        {prediction.studentEmail}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClass(
                        prediction.riskLevel,
                      )}`}
                    >
                      {prediction.riskLevel || "Risk yok"}
                    </span>

                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                        prediction.isValid
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {prediction.isValid ? "Geçerli" : "Pasif"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Tahmini Dönem Notu
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {formatNumber(prediction.predictedGrade)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Geçme Olasılığı
                    </p>
                    <p
                      className={`mt-2 text-2xl font-bold ${getProbabilityClass(
                        prediction.passingProbability,
                      )}`}
                    >
                      {prediction.passingProbability === null
                        ? "Yok"
                        : `%${prediction.passingProbability}`}
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
                  <h3 className="font-bold text-slate-950">Özet</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {prediction.summary || "Tahmin özeti yok."}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-950">Açıklama 1</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {prediction.explanation1 || "Açıklama yok."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-950">Açıklama 2</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {prediction.explanation2 || "Açıklama yok."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-950">Açıklama 3</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {prediction.explanation3 || "Açıklama yok."}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                    Öğretmene göster: {prediction.showToTeacher ? "Evet" : "Hayır"}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-slate-600">
                    Öğrenciye göster: {prediction.showToStudent ? "Evet" : "Hayır"}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
