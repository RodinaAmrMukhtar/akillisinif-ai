"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";

type RiskSignal = {
  id: string;
  title: string;
  studentName: string;
  studentEmail: string;
  className: string;
  signalType: string;
  riskScore: number | null;
  importance: string;
  status: string;
  description: string;
  recommendedAction: string;
  detectedAt: string;
};

function getImportanceClass(importance: string) {
  if (importance === "Kritik") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (importance === "Yuksek" || importance === "Yüksek") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (importance === "Orta") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getStatusClass(status: string) {
  if (status === "Yeni") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  if (status === "Inceleniyor") {
    return "bg-violet-50 text-violet-700 border-violet-200";
  }

  if (status === "Cozuldu") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
}

export default function TeacherRiskSignalsPage() {
  const [signals, setSignals] = useState<RiskSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadSignals() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const email = user?.email || "";
        const response = await fetch(
          `/api/airtable/risk-signals/list?teacherEmail=${encodeURIComponent(email)}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Risk sinyalleri alınamadı.");
        }

        setSignals(result.signals || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadSignals();
  }, []);

  const stats = useMemo(() => {
    return {
      total: signals.length,
      critical: signals.filter((signal) => signal.importance === "Kritik").length,
      high: signals.filter(
        (signal) => signal.importance === "Yuksek" || signal.importance === "Yüksek",
      ).length,
      newSignals: signals.filter((signal) => signal.status === "Yeni").length,
    };
  }, [signals]);

  const filteredSignals = useMemo(() => {
    if (filter === "all") return signals;

    if (filter === "critical") {
      return signals.filter((signal) => signal.importance === "Kritik");
    }

    if (filter === "high") {
      return signals.filter(
        (signal) => signal.importance === "Yuksek" || signal.importance === "Yüksek",
      );
    }

    if (filter === "new") {
      return signals.filter((signal) => signal.status === "Yeni");
    }

    return signals;
  }, [filter, signals]);

  return (
    <DashboardShell
      title="Risk Sinyalleri"
      description="AI ve otomasyon iş akışları tarafından oluşturulan erken uyarı sinyalleri."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <button
            onClick={() => setFilter("all")}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-slate-500">Toplam Sinyal</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stats.total}</p>
          </button>

          <button
            onClick={() => setFilter("critical")}
            className="rounded-3xl border border-red-100 bg-red-50 p-5 text-left shadow-sm transition hover:border-red-300"
          >
            <p className="text-sm font-medium text-red-600">Kritik</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{stats.critical}</p>
          </button>

          <button
            onClick={() => setFilter("high")}
            className="rounded-3xl border border-orange-100 bg-orange-50 p-5 text-left shadow-sm transition hover:border-orange-300"
          >
            <p className="text-sm font-medium text-orange-600">Yüksek</p>
            <p className="mt-2 text-3xl font-bold text-orange-700">{stats.high}</p>
          </button>

          <button
            onClick={() => setFilter("new")}
            className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-blue-600">Yeni</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.newSignals}</p>
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Risk sinyalleri yükleniyor...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            {error}
          </div>
        ) : filteredSignals.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Bu filtrede gösterilecek risk sinyali bulunmuyor.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSignals.map((signal) => (
              <article
                key={signal.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {signal.className}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                      {signal.studentName}
                    </h2>
                    {signal.studentEmail ? (
                      <p className="mt-1 text-sm text-slate-500">{signal.studentEmail}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-semibold ${getImportanceClass(
                        signal.importance,
                      )}`}
                    >
                      {signal.importance || "Belirsiz"}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClass(
                        signal.status,
                      )}`}
                    >
                      {signal.status || "Durum yok"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Sinyal Türü
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {signal.signalType || "Belirtilmemiş"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Risk Puanı
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {signal.riskScore ?? "Yok"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Tespit Tarihi
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {signal.detectedAt || "Yok"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-950">Açıklama</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {signal.description || "Açıklama yok."}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-950">Önerilen Aksiyon</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {signal.recommendedAction || "Önerilen aksiyon yok."}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
