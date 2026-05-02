"use client";

import DashboardShell from "@/components/DashboardShell";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getTeacherWeeklyReports, type WeeklyReport } from "@/lib/weeklyReportsApi";

export default function TeacherWeeklyReportsPage() {
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Lütfen öğretmen hesabınızla giriş yapın.");
        }

        const data = await getTeacherWeeklyReports({
          authId: user.id,
          email: user.email || "",
          name:
            user.user_metadata?.ad_soyad ||
            user.user_metadata?.full_name ||
            "",
        });

        setReports(data.reports || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Raporlar yüklenemedi.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  function handlePrint() {
    window.print();
  }

  return (
    <DashboardShell
      activePage="weekly-reports"
      pageTitle="Haftalık Raporlar"
      pageDescription="n8n tarafından oluşturulan AI risk raporları"
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                n8n otomasyon merkezi
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Haftalık AI Risk Raporları
              </h1>
              <p className="mt-3 max-w-3xl text-slate-600">
                Bu sayfa Airtable Haftalik_Raporlar tablosuna n8n tarafından
                kaydedilen raporları gösterir.
              </p>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white"
            >
              PDF olarak indir
            </button>
          </div>
        </section>

        {loading ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            Raporlar yükleniyor...
          </section>
        ) : error ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            <p className="font-semibold">Raporlar yüklenemedi.</p>
            <p className="mt-2">{error}</p>
          </section>
        ) : reports.length === 0 ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            Henüz rapor yok.
          </section>
        ) : (
          <section className="space-y-5">
            {reports.map((report) => (
              <article
                key={report.id}
                className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm"
              >
                <div className="border-b border-slate-200 pb-5">
                  <p className="text-sm font-semibold text-blue-700">
                    {report.className}
                  </p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-950">
                    {report.title}
                  </h2>
                  <p className="mt-2 text-slate-500">
                    {report.weekStart} - {report.weekEnd}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-5">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Öğrenci</p>
                    <p className="text-2xl font-bold">{report.totalStudents}</p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <p className="text-sm text-emerald-700">Düşük</p>
                    <p className="text-2xl font-bold">{report.lowRiskCount}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-sm text-amber-700">Orta</p>
                    <p className="text-2xl font-bold">{report.mediumRiskCount}</p>
                  </div>
                  <div className="rounded-2xl bg-orange-50 p-4">
                    <p className="text-sm text-orange-700">Yüksek</p>
                    <p className="text-2xl font-bold">{report.highRiskCount}</p>
                  </div>
                  <div className="rounded-2xl bg-red-50 p-4">
                    <p className="text-sm text-red-700">Kritik</p>
                    <p className="text-2xl font-bold">{report.criticalRiskCount}</p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-sm font-semibold text-blue-700">
                    En yaygın risk nedeni
                  </p>
                  <p className="mt-1 font-semibold text-blue-950">
                    {report.mostCommonRiskReason || "Belirgin risk nedeni yok"}
                  </p>
                </div>

                <div className="mt-6 whitespace-pre-wrap leading-8 text-slate-700">
                  {report.reportText}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
