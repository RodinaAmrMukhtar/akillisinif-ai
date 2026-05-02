"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BsBarChart,
  BsCalendarCheck,
  BsCardChecklist,
  BsCheckCircle,
  BsClipboardData,
  BsGraphUp,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  getStudentProgress,
  type StudentProgressData,
} from "@/lib/studentProgressApi";
import { supabase } from "@/lib/supabaseClient";

function metricValue(value: number | null, suffix = "%") {
  if (value === null) return "Veri yok";
  return `${value}${suffix}`;
}

function scoreValue(score: number | null, maxPoints: number | null) {
  if (score === null || maxPoints === null) return "Puan yok";
  return `${score} / ${maxPoints}`;
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

export default function StudentGradesPage() {
  const [progress, setProgress] = useState<StudentProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadProgress() {
    setLoading(true);
    setErrorMessage("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setLoading(false);
      return;
    }

    try {
      const result = await getStudentProgress(data.user.id);
      setProgress(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Performans verileri yüklenemedi.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadProgress();
  }, []);

  const gradedAssignments = useMemo(() => {
    if (!progress) return [];

    return progress.assignments.filter(
      (assignment) => assignment.submission?.status === "Degerlendirildi",
    );
  }, [progress]);

  return (
    <DashboardShell
      title="Notlarım ve Performansım"
      description="Notlar, ödev teslimleri, öğretmen geri bildirimleri ve yoklama performansınızı görüntüleyin."
      activePage="student-grades"
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

      {!loading && progress && progress.summary.activeClassCount === 0 && (
        <EmptyState
          icon={BsGraphUp}
          title="Performans verisi için aktif sınıf gerekli"
          description="Bir sınıfa katıldığınızda not, ödev ve yoklama performansınız burada görünecektir."
          primaryActionLabel="Sınıfa Katıl"
          primaryActionHref="/student/join-class"
        />
      )}

      {!loading && progress && progress.summary.activeClassCount > 0 && (
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Öğrenci Performans Özeti
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
                  {progress.student.name}
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {progress.student.email || "E-posta yok"}  Okul No:{" "}
                  {progress.student.schoolNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={loadProgress}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Verileri Yenile
              </button>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsBarChart />
                <p className="text-sm font-semibold">Not Ortalaması</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {metricValue(progress.summary.gradeAverage)}
              </p>
              <ProgressBar value={progress.summary.gradeAverage} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsCardChecklist />
                <p className="text-sm font-semibold">Ödev Teslim</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {metricValue(progress.summary.assignmentSubmissionRate)}
              </p>
              <ProgressBar value={progress.summary.assignmentSubmissionRate} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsCalendarCheck />
                <p className="text-sm font-semibold">Yoklama</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {metricValue(progress.summary.attendanceRate)}
              </p>
              <ProgressBar value={progress.summary.attendanceRate} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsCheckCircle />
                <p className="text-sm font-semibold">Değerlendirilen</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {gradedAssignments.length}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Öğretmen puanı verilen ödev
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-950">
              Sınıf Bazlı Performans
            </h2>

            <div className="grid gap-5 lg:grid-cols-2">
              {progress.classes.map((classItem) => (
                <article
                  key={classItem.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-950">
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

                  <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Not
                      </p>
                      <p className="mt-2 text-lg font-bold text-slate-950">
                        {metricValue(classItem.gradeAverage)}
                      </p>
                      <ProgressBar value={classItem.gradeAverage} />
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Ödev
                      </p>
                      <p className="mt-2 text-lg font-bold text-slate-950">
                        {metricValue(classItem.submissionRate)}
                      </p>
                      <ProgressBar value={classItem.submissionRate} />
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Yoklama
                      </p>
                      <p className="mt-2 text-lg font-bold text-slate-950">
                        {metricValue(classItem.attendanceRate)}
                      </p>
                      <ProgressBar value={classItem.attendanceRate} />
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-900">
                    {classItem.submittedAssignmentCount} / {classItem.assignmentCount} ödev teslim edildi.{" "}
                    {classItem.presentAttendanceCount} / {classItem.attendanceSessionCount} yoklama kaydı mevcut.
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-950">
              Not Kayıtları
            </h2>

            {progress.grades.length === 0 ? (
              <EmptyState
                icon={BsClipboardData}
                title="Henüz not kaydı yok"
                description="Öğretmen ödev veya sınav notu girdiğinde burada listelenecektir."
              />
            ) : (
              <div className="space-y-4">
                {progress.grades.map((grade) => (
                  <article
                    key={grade.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {grade.gradeType}
                        </span>

                        <h3 className="mt-4 text-xl font-bold text-slate-950">
                          {grade.title}
                        </h3>

                        <p className="mt-2 text-sm font-semibold text-slate-600">
                          {grade.className}  {grade.courseName}  {grade.date || "Tarih yok"}
                        </p>

                        {grade.description && (
                          <p className="mt-3 text-sm leading-7 text-slate-600">
                            {grade.description}
                          </p>
                        )}
                      </div>

                      <div className="rounded-3xl bg-slate-50 p-5 text-center lg:min-w-[160px]">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Puan
                        </p>
                        <p className="mt-2 text-3xl font-bold text-slate-950">
                          {scoreValue(grade.score, grade.maxPoints)}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-blue-700">
                          {metricValue(grade.percentage)}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-950">
              Ödev Durumu ve Geri Bildirimler
            </h2>

            {progress.assignments.length === 0 ? (
              <EmptyState
                icon={BsCardChecklist}
                title="Henüz ödev bulunmuyor"
                description="Öğretmeniniz ödev yayınladığında burada teslim ve puan durumunuz görünecektir."
              />
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {progress.assignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            assignment.submission
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {assignment.submission
                            ? assignment.submission.status
                            : "Teslim Bekliyor"}
                        </span>

                        <h3 className="mt-4 text-xl font-bold text-slate-950">
                          {assignment.title}
                        </h3>

                        <p className="mt-2 text-sm font-semibold text-slate-600">
                          {assignment.className}  {assignment.courseName}
                        </p>

                        <p className="mt-2 text-sm text-slate-500">
                          Teslim tarihi: {assignment.dueDate || "Yok"}
                        </p>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <BsCardChecklist />
                      </div>
                    </div>

                    {assignment.submission ? (
                      <div className="mt-5 space-y-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Teslim Metni
                          </p>
                          <p className="mt-2 text-sm leading-7 text-slate-700">
                            {assignment.submission.text || "Teslim metni yok."}
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Puan
                            </p>
                            <p className="mt-2 text-lg font-bold text-slate-950">
                              {assignment.submission.score === null
                                ? "Henüz değerlendirilmedi"
                                : `${assignment.submission.score} / ${assignment.maxPoints}`}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                              Teslim
                            </p>
                            <p className="mt-2 text-lg font-bold text-slate-950">
                              {assignment.submission.late ? "Geç Teslim" : "Zamanında"}
                            </p>
                          </div>
                        </div>

                        {assignment.submission.feedback && (
                          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                              Öğretmen Geri Bildirimi
                            </p>
                            <p className="mt-2 text-sm leading-7 text-blue-900">
                              {assignment.submission.feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">
                        Bu ödev için henüz teslim kaydınız yok. Ödevlerim
                        sayfasından teslim gönderebilirsiniz.
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
