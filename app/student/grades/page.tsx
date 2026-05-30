"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";

type StudentGrade = {
  id: string;
  title: string;
  className: string;
  lessonName: string;
  gradeType: string;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  weight: number | null;
  date: string;
  description: string;
  publishStatus: string;
  createdAt: string;
};

function getScoreClass(percentage: number | null) {
  if (percentage === null) return "text-slate-500";
  if (percentage < 50) return "text-red-700";
  if (percentage < 70) return "text-orange-700";
  return "text-emerald-700";
}

function getGradeTypeClass(type: string) {
  if (type === "Final") return "border-violet-200 bg-violet-50 text-violet-700";
  if (type === "Vize") return "border-blue-200 bg-blue-50 text-blue-700";
  if (type === "Laboratuvar") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (type === "Ortalama") return "border-orange-200 bg-orange-50 text-orange-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function formatScore(score: number | null, maxScore: number | null) {
  if (score === null) return "Yok";
  return `${Math.round(score)}/${maxScore || 100}`;
}

function formatPercent(value: number | null) {
  if (value === null) return "Yok";
  return `%${Math.round(value)}`;
}

function formatDate(value: string) {
  if (!value) return "Tarih yok";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function StudentGradesPage() {
  const [studentName, setStudentName] = useState("Öğrenci");
  const [grades, setGrades] = useState<StudentGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadGrades() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const email = user?.email || "";

        const response = await fetch(
          `/api/airtable/student-grades/list?studentEmail=${encodeURIComponent(email)}`,
          {
            cache: "no-store",
          },
        );

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Notlar alınamadı.");
        }

        setStudentName(result.studentName || "Öğrenci");
        setGrades(result.grades || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadGrades();
  }, []);

  const gradeTypes = useMemo(() => {
    return Array.from(new Set(grades.map((grade) => grade.gradeType).filter(Boolean)));
  }, [grades]);

  const stats = useMemo(() => {
    const withPercentage = grades.filter((grade) => grade.percentage !== null);

    const average =
      withPercentage.length > 0
        ? Math.round(
            withPercentage.reduce((sum, grade) => sum + Number(grade.percentage), 0) /
              withPercentage.length,
          )
        : null;

    const lowGrades = withPercentage.filter((grade) => Number(grade.percentage) < 50).length;
    const highGrades = withPercentage.filter((grade) => Number(grade.percentage) >= 85).length;

    return {
      total: grades.length,
      average,
      lowGrades,
      highGrades,
      classCount: new Set(grades.map((grade) => grade.className)).size,
    };
  }, [grades]);

  const filteredGrades = useMemo(() => {
    if (filter === "all") return grades;

    if (filter === "low") {
      return grades.filter((grade) => grade.percentage !== null && grade.percentage < 50);
    }

    if (filter === "high") {
      return grades.filter((grade) => grade.percentage !== null && grade.percentage >= 85);
    }

    return grades.filter((grade) => grade.gradeType === filter);
  }, [filter, grades]);

  return (
    <DashboardShell
      title="Notlarım"
      description="Öğretmenin tarafından yayınlanan notlarını ve performans durumunu takip et."
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            Öğrenci Not Paneli
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{studentName}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Bu sayfada yalnızca öğretmen tarafından yayınlanan notlar görünür. Taslak notlar
            öğrenci panelinde gösterilmez.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <button
            onClick={() => setFilter("all")}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-slate-500">Toplam Not</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stats.total}</p>
          </button>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-600">Ortalama</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">
              {stats.average === null ? "Yok" : `%${stats.average}`}
            </p>
          </div>

          <button
            onClick={() => setFilter("high")}
            className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-left shadow-sm transition hover:border-emerald-300"
          >
            <p className="text-sm font-medium text-emerald-600">Güçlü Not</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.highGrades}</p>
          </button>

          <button
            onClick={() => setFilter("low")}
            className="rounded-3xl border border-red-100 bg-red-50 p-5 text-left shadow-sm transition hover:border-red-300"
          >
            <p className="text-sm font-medium text-red-600">Destek Gereken</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{stats.lowGrades}</p>
          </button>
        </div>

        {gradeTypes.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                filter === "all"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-600"
              }`}
            >
              Tümü
            </button>

            {gradeTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                  filter === type
                    ? "border-blue-200 bg-blue-50 text-blue-700"
                    : "border-slate-200 bg-white text-slate-600"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Notlar yükleniyor...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            {error}
          </div>
        ) : filteredGrades.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Bu filtrede gösterilecek yayınlanmış not bulunmuyor.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredGrades.map((grade) => (
              <article
                key={grade.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {grade.className}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                      {grade.gradeType || "Not"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(grade.date)}</p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-sm font-semibold ${getGradeTypeClass(
                      grade.gradeType,
                    )}`}
                  >
                    {grade.gradeType || "Not"}
                  </span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Puan
                    </p>
                    <p
                      className={`mt-2 text-2xl font-bold ${getScoreClass(
                        grade.percentage,
                      )}`}
                    >
                      {formatScore(grade.score, grade.maxScore)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Yüzde
                    </p>
                    <p
                      className={`mt-2 text-2xl font-bold ${getScoreClass(
                        grade.percentage,
                      )}`}
                    >
                      {formatPercent(grade.percentage)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Ağırlık
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {grade.weight === null ? "Yok" : grade.weight}
                    </p>
                  </div>
                </div>

                {grade.description ? (
                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-950">Öğretmen Açıklaması</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {grade.description}
                    </p>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}