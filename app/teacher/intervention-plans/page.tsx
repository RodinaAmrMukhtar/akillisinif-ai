"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";

type PlanStep = {
  id: string;
  title: string;
  type: string;
  description: string;
  dueDate: string;
  status: string;
  completedAt: string;
  responsibleName: string;
};

type InterventionPlan = {
  id: string;
  title: string;
  studentName: string;
  studentEmail: string;
  className: string;
  relatedSignalTitle: string;
  relatedSignalImportance: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: string;
  successStatus: string;
  teacherNote: string;
  resultEvaluation: string;
  createdAt: string;
  steps: PlanStep[];
};

function getStatusClass(status: string) {
  if (status === "Aktif") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "Tamamlandi" || status === "Tamamlandı") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Iptal" || status === "İptal") {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getStepStatusClass(status: string) {
  if (status === "Tamamlandi" || status === "Tamamlandı") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "Devam Ediyor") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-slate-50 text-slate-700 border-slate-200";
}

function isCompleted(status: string) {
  return status === "Tamamlandi" || status === "Tamamlandı" || status === "Cozuldu";
}

export default function TeacherInterventionPlansPage() {
  const [plans, setPlans] = useState<InterventionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const email = user?.email || "";

        const response = await fetch(
          `/api/airtable/intervention-plans/list?teacherEmail=${encodeURIComponent(email)}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Müdahale planları alınamadı.");
        }

        setPlans(result.plans || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  const stats = useMemo(() => {
    const active = plans.filter((plan) => !isCompleted(plan.status)).length;
    const completed = plans.filter((plan) => isCompleted(plan.status)).length;
    const totalSteps = plans.reduce((sum, plan) => sum + plan.steps.length, 0);
    const completedSteps = plans.reduce(
      (sum, plan) => sum + plan.steps.filter((step) => isCompleted(step.status)).length,
      0,
    );

    return {
      total: plans.length,
      active,
      completed,
      totalSteps,
      completedSteps,
    };
  }, [plans]);

  const filteredPlans = useMemo(() => {
    if (filter === "all") return plans;

    if (filter === "active") {
      return plans.filter((plan) => !isCompleted(plan.status));
    }

    if (filter === "completed") {
      return plans.filter((plan) => isCompleted(plan.status));
    }

    return plans;
  }, [filter, plans]);

  return (
    <DashboardShell
      title="Müdahale Planları"
      description="Yüksek riskli öğrenciler için oluşturulan takip ve destek planları."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <button
            onClick={() => setFilter("all")}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-slate-500">Toplam Plan</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stats.total}</p>
          </button>

          <button
            onClick={() => setFilter("active")}
            className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-blue-600">Aktif Plan</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.active}</p>
          </button>

          <button
            onClick={() => setFilter("completed")}
            className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-left shadow-sm transition hover:border-emerald-300"
          >
            <p className="text-sm font-medium text-emerald-600">Tamamlanan</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.completed}</p>
          </button>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Adım İlerlemesi</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">
              {stats.completedSteps}/{stats.totalSteps}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Müdahale planları yükleniyor...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            {error}
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Bu filtrede gösterilecek müdahale planı bulunmuyor.
          </div>
        ) : (
          <div className="space-y-5">
            {filteredPlans.map((plan) => (
              <article
                key={plan.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {plan.className}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                      {plan.title || `${plan.studentName} Müdahale Planı`}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {plan.studentName}
                      {plan.studentEmail ? `  ${plan.studentEmail}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-sm font-semibold ${getStatusClass(
                        plan.status,
                      )}`}
                    >
                      {plan.status || "Durum yok"}
                    </span>

                    {plan.successStatus ? (
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
                        {plan.successStatus}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Başlangıç
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {plan.startDate || "Yok"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Bitiş
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {plan.endDate || "Yok"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      İlgili Risk
                    </p>
                    <p className="mt-2 font-semibold text-slate-900">
                      {plan.relatedSignalImportance || plan.relatedSignalTitle || "Yok"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <h3 className="font-bold text-slate-950">Hedef</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {plan.goal || "Plan hedefi belirtilmemiş."}
                  </p>
                </div>

                {plan.teacherNote || plan.resultEvaluation ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <h3 className="font-bold text-slate-950">Öğretmen Notu</h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {plan.teacherNote || "Not yok."}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <h3 className="font-bold text-slate-950">Sonuç Değerlendirmesi</h3>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {plan.resultEvaluation || "Değerlendirme yok."}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6">
                  <h3 className="font-bold text-slate-950">Plan Adımları</h3>

                  {plan.steps.length === 0 ? (
                    <p className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
                      Bu plana bağlı adım bulunmuyor.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-3">
                      {plan.steps.map((step) => (
                        <div
                          key={step.id}
                          className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="font-semibold text-slate-950">
                                {step.title || "Plan adımı"}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {step.type || "Adım türü yok"}  Sorumlu:{" "}
                                {step.responsibleName}
                              </p>
                            </div>

                            <span
                              className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold ${getStepStatusClass(
                                step.status,
                              )}`}
                            >
                              {step.status || "Durum yok"}
                            </span>
                          </div>

                          {step.description ? (
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                              {step.description}
                            </p>
                          ) : null}

                          <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                            <span>Son tarih: {step.dueDate || "Yok"}</span>
                            {step.completedAt ? <span>Tamamlanma: {step.completedAt}</span> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
