"use client";

import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsBarChart,
  BsCalendarCheck,
  BsCardChecklist,
  BsExclamationTriangle,
  BsGraphUp,
  BsPeople,
  BsShieldCheck,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  getTeacherRiskAnalysis,
  type RiskStudent,
  type TeacherRiskAnalysis,
} from "@/lib/riskApi";
import { supabase } from "@/lib/supabaseClient";

function riskBadgeClass(level: string) {
  if (level === "Kritik") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (level === "Yüksek") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (level === "Orta") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function metricValue(value: number | null, suffix = "%") {
  if (value === null) return "Veri yok";
  return `${value}${suffix}`;
}

function ProgressBar({ value }: { value: number | null }) {
  const safeValue = value === null ? 0 : Math.max(0, Math.min(100, value));

  return (
    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
      <div
        className="h-full rounded-full bg-blue-700"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}

function StudentRiskCard({ student }: { student: RiskStudent }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-2xl font-bold tracking-tight text-slate-950">
              {student.studentName}
            </h3>

            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${riskBadgeClass(
                student.riskLevel,
              )}`}
            >
              {student.riskLevel} Risk
            </span>
          </div>

          <p className="mt-2 text-sm text-slate-600">
            {student.studentEmail || "E-posta yok"}  Okul No:{" "}
            {student.schoolNumber}
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-700">
            {student.classNames.join(", ")}
          </p>
        </div>

        <div className="rounded-3xl bg-slate-50 p-5 text-center lg:min-w-[150px]">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Risk Skoru
          </p>
          <p className="mt-2 text-4xl font-bold text-slate-950">
            {student.riskScore}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">/ 100</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <BsBarChart />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Not
            </p>
          </div>
          <p className="mt-3 text-lg font-bold text-slate-950">
            {metricValue(student.metrics.gradeAverage)}
          </p>
          <ProgressBar value={student.metrics.gradeAverage} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <BsCardChecklist />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Ödev
            </p>
          </div>
          <p className="mt-3 text-lg font-bold text-slate-950">
            {metricValue(student.metrics.submissionRate)}
          </p>
          <ProgressBar value={student.metrics.submissionRate} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <BsCalendarCheck />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Yoklama
            </p>
          </div>
          <p className="mt-3 text-lg font-bold text-slate-950">
            {metricValue(student.metrics.attendanceRate)}
          </p>
          <ProgressBar value={student.metrics.attendanceRate} />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <BsShieldCheck />
            <p className="text-xs font-semibold uppercase tracking-wider">
              Veri
            </p>
          </div>
          <p className="mt-3 text-lg font-bold text-slate-950">
            {metricValue(student.metrics.dataCompleteness)}
          </p>
          <ProgressBar value={student.metrics.dataCompleteness} />
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-950">
            <BsExclamationTriangle />
            Risk Sinyalleri
          </h4>

          <ul className="mt-4 space-y-2">
            {student.signals.map((signal) => (
              <li
                key={signal}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
              >
                {signal}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h4 className="text-sm font-bold text-blue-950">
            Sistem Önerisi
          </h4>
          <p className="mt-4 text-sm leading-7 text-blue-900">
            {student.recommendation}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Eksik Ödev
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {student.metrics.missingAssignmentCount}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Geç Teslim
              </p>
              <p className="mt-2 text-lg font-bold text-slate-950">
                {student.metrics.lateSubmissionCount}
              </p>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function TeacherRiskAnalysisPage() {
  const [user, setUser] = useState<User | null>(null);
  const [analysis, setAnalysis] = useState<TeacherRiskAnalysis | null>(null);
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedRiskLevel, setSelectedRiskLevel] = useState("all");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadRiskAnalysis() {
    setLoading(true);
    setErrorMessage("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setLoading(false);
      return;
    }

    setUser(data.user);

    try {
      const result = await getTeacherRiskAnalysis(data.user.id);
      setAnalysis(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Risk analizi yüklenemedi.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRiskAnalysis();
  }, []);

  const filteredStudents = useMemo(() => {
    if (!analysis) return [];

    return analysis.students.filter((student) => {
      const classMatch =
        selectedClassId === "all" || student.classIds.includes(selectedClassId);

      const riskMatch =
        selectedRiskLevel === "all" || student.riskLevel === selectedRiskLevel;

      return classMatch && riskMatch;
    });
  }, [analysis, selectedClassId, selectedRiskLevel]);

  return (
    <DashboardShell
      title="Risk Analizi"
      description="Not, ödev teslimi ve yoklama verilerine göre gerçek zamanlı kural tabanlı erken uyarı analizi."
      activePage="risk-analysis"
    >
      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-8 w-56 animate-pulse rounded bg-slate-100" />
          <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100" />
        </div>
      )}

      {!loading && errorMessage && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700">
          {errorMessage}
        </div>
      )}

      {!loading && analysis && analysis.students.length === 0 && (
        <EmptyState
          icon={BsGraphUp}
          title="Risk analizi için öğrenci verisi yok"
          description="Sınıfa öğrenci eklendiğinde ve ödev, not veya yoklama verileri oluştuğunda risk analizi burada görünecektir."
          primaryActionLabel="Sınıflara Git"
          primaryActionHref="/teacher/classes"
        />
      )}

      {!loading && analysis && analysis.students.length > 0 && (
        <div className="space-y-8">
          <div className="grid gap-5 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsPeople />
                <p className="text-sm font-semibold">Toplam Öğrenci</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {analysis.summary.totalStudents}
              </p>
            </div>

            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-red-600">
                <BsExclamationTriangle />
                <p className="text-sm font-semibold">Kritik + Yüksek</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-red-700">
                {analysis.summary.criticalRiskCount + analysis.summary.highRiskCount}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsBarChart />
                <p className="text-sm font-semibold">Ortalama Not</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {metricValue(analysis.summary.averageGrade)}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsCalendarCheck />
                <p className="text-sm font-semibold">Yoklama Ort.</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {metricValue(analysis.summary.averageAttendance)}
              </p>
            </div>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px] lg:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Erken Uyarı Motoru
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Bu ekran Airtable verilerinden canlı hesaplama yapar. Risk skoru
                  not, ödev teslim oranı, yoklama katılımı ve geç teslim sinyallerine
                  göre oluşturulur.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Sınıf Filtresi
                </label>
                <select
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">Tüm Sınıflar</option>
                  {analysis.classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.className} - {classItem.courseName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Risk Filtresi
                </label>
                <select
                  value={selectedRiskLevel}
                  onChange={(event) => setSelectedRiskLevel(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">Tüm Riskler</option>
                  <option value="Kritik">Kritik</option>
                  <option value="Yüksek">Yüksek</option>
                  <option value="Orta">Orta</option>
                  <option value="Düşük">Düşük</option>
                </select>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            {analysis.classes.map((classItem) => (
              <div
                key={classItem.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">
                      {classItem.className}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {classItem.courseName}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <BsGraphUp />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Öğrenci
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {classItem.studentCount}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Yüksek Risk
                    </p>
                    <p className="mt-2 text-2xl font-bold text-red-700">
                      {classItem.riskyStudentCount}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Öğrenci Bazlı Risk Listesi
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  {filteredStudents.length} öğrenci gösteriliyor.
                </p>
              </div>

              <button
                type="button"
                onClick={loadRiskAnalysis}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Yenile
              </button>
            </div>

            {filteredStudents.length === 0 ? (
              <EmptyState
                icon={BsShieldCheck}
                title="Filtreye uygun öğrenci yok"
                description="Farklı bir sınıf veya risk seviyesi seçerek tekrar deneyin."
              />
            ) : (
              <div className="space-y-5">
                {filteredStudents.map((student) => (
                  <StudentRiskCard key={student.studentId} student={student} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
