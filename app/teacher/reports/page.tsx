"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";

type WeeklyReport = {
  id: string;
  title: string;
  className: string;
  weekStart: string;
  weekEnd: string;
  totalStudents: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  mostCommonRiskReason: string;
  reportText: string;
  status: string;
  createdAt: string;
  reportType: string;
};

function getReportTypeClass(type: string) {
  if (type === "AI Asistan Önerisi") {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getRiskLevel(report: WeeklyReport) {
  if (report.criticalRiskCount > 0) return "Kritik";
  if (report.highRiskCount > 0) return "Yüksek";
  if (report.mediumRiskCount > 0) return "Orta";
  return "Düşük";
}

function getRiskClass(level: string) {
  if (level === "Kritik") return "border-red-200 bg-red-50 text-red-700";
  if (level === "Yüksek") return "border-orange-200 bg-orange-50 text-orange-700";
  if (level === "Orta") return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function cleanReportText(value: string) {
  return value
    .replace(/Sistem takip kodu: AI_ASISTAN_HAFTALIK_ONERI:[^\n]+/g, "")
    .replace(/Takip kodu: AI_ASISTAN_HAFTALIK_ONERI:[^\n]+/g, "")
    .trim();
}

export default function TeacherReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const email = user?.email || "";

        const response = await fetch(
          `/api/airtable/reports/list?teacherEmail=${encodeURIComponent(email)}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Raporlar alınamadı.");
        }

        setReports(result.reports || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  const stats = useMemo(() => {
    return {
      total: reports.length,
      riskReports: reports.filter((report) => report.reportType === "Haftalık Risk Raporu").length,
      assistantReports: reports.filter((report) => report.reportType === "AI Asistan Önerisi").length,
      urgentReports: reports.filter(
        (report) => report.highRiskCount > 0 || report.criticalRiskCount > 0,
      ).length,
    };
  }, [reports]);

  const filteredReports = useMemo(() => {
    if (filter === "all") return reports;

    if (filter === "risk") {
      return reports.filter((report) => report.reportType === "Haftalık Risk Raporu");
    }

    if (filter === "assistant") {
      return reports.filter((report) => report.reportType === "AI Asistan Önerisi");
    }

    if (filter === "urgent") {
      return reports.filter((report) => report.highRiskCount > 0 || report.criticalRiskCount > 0);
    }

    return reports;
  }, [filter, reports]);

  return (
    <DashboardShell
      title="AI Raporları"
      description="Haftalık risk raporları ve AI asistan sınıf önerileri."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <button
            onClick={() => setFilter("all")}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-slate-500">Toplam Rapor</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stats.total}</p>
          </button>

          <button
            onClick={() => setFilter("risk")}
            className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-blue-600">Risk Raporu</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.riskReports}</p>
          </button>

          <button
            onClick={() => setFilter("assistant")}
            className="rounded-3xl border border-violet-100 bg-violet-50 p-5 text-left shadow-sm transition hover:border-violet-300"
          >
            <p className="text-sm font-medium text-violet-600">AI Önerisi</p>
            <p className="mt-2 text-3xl font-bold text-violet-700">{stats.assistantReports}</p>
          </button>

          <button
            onClick={() => setFilter("urgent")}
            className="rounded-3xl border border-orange-100 bg-orange-50 p-5 text-left shadow-sm transition hover:border-orange-300"
          >
            <p className="text-sm font-medium text-orange-600">Öncelikli</p>
            <p className="mt-2 text-3xl font-bold text-orange-700">{stats.urgentReports}</p>
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Raporlar yükleniyor...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            {error}
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Bu filtrede gösterilecek rapor bulunmuyor.
          </div>
        ) : (
          <div className="space-y-5">
            {filteredReports.map((report) => {
              const riskLevel = getRiskLevel(report);

              return (
                <article
                  key={report.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {report.className}  {report.weekStart || "Tarih yok"} /{" "}
                        {report.weekEnd || "Tarih yok"}
                      </p>
                      <h2 className="mt-2 text-xl font-bold text-slate-950">
                        {report.title}
                      </h2>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-semibold ${getReportTypeClass(
                          report.reportType,
                        )}`}
                      >
                        {report.reportType}
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1 text-sm font-semibold ${getRiskClass(
                          riskLevel,
                        )}`}
                      >
                        {riskLevel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-5">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Öğrenci
                      </p>
                      <p className="mt-2 font-semibold text-slate-900">
                        {report.totalStudents}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-600">
                        Düşük
                      </p>
                      <p className="mt-2 font-semibold text-emerald-700">
                        {report.lowRiskCount}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600">
                        Orta
                      </p>
                      <p className="mt-2 font-semibold text-amber-700">
                        {report.mediumRiskCount}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-orange-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-600">
                        Yüksek
                      </p>
                      <p className="mt-2 font-semibold text-orange-700">
                        {report.highRiskCount}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-red-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-600">
                        Kritik
                      </p>
                      <p className="mt-2 font-semibold text-red-700">
                        {report.criticalRiskCount}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-950">En Yaygın Risk Nedeni</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-700">
                      {report.mostCommonRiskReason || "Belirgin risk nedeni yok."}
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-950">Rapor Metni</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {cleanReportText(report.reportText) || "Rapor metni yok."}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
