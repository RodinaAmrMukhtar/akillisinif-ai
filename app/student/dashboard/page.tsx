"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  BsArrowRight,
  BsBarChart,
  BsCalendarCheck,
  BsCardChecklist,
  BsCheckCircle,
  BsClipboardData,
  BsGraphUp,
  BsPeople,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  getStudentProgress,
  type StudentProgressAssignment,
  type StudentProgressData,
} from "@/lib/studentProgressApi";
import { supabase } from "@/lib/supabaseClient";

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

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: ElementType;
  href?: string;
}) {
  const content = (
    <div className="h-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <Icon className="text-xl" />
        </div>
      </div>
    </div>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block h-full">
      {content}
    </Link>
  );
}

function AssignmentStatusCard({
  assignment,
}: {
  assignment: StudentProgressAssignment;
}) {
  const isSubmitted = Boolean(assignment.submission);
  const isGraded = assignment.submission?.status === "Degerlendirildi";

  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
              isGraded
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : isSubmitted
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
            }`}
          >
            {isGraded
              ? "Değerlendirildi"
              : isSubmitted
                ? "Teslim Edildi"
                : "Teslim Bekliyor"}
          </span>

          <h3 className="mt-4 text-lg font-bold text-slate-950">
            {assignment.title}
          </h3>

          <p className="mt-2 text-sm font-semibold text-slate-600">
            {assignment.className}  {assignment.courseName}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Teslim tarihi: {assignment.dueDate || "Belirtilmedi"}
          </p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
          <BsCardChecklist />
        </div>
      </div>

      {assignment.submission?.score !== null &&
        assignment.submission?.score !== undefined && (
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Puan
            </p>
            <p className="mt-2 text-xl font-bold text-slate-950">
              {assignment.submission.score} / {assignment.maxPoints}
            </p>
          </div>
        )}

      {assignment.submission?.feedback && (
        <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Öğretmen Geri Bildirimi
          </p>
          <p className="mt-2 text-sm leading-6 text-blue-900">
            {assignment.submission.feedback}
          </p>
        </div>
      )}
    </article>
  );
}

export default function StudentDashboardPage() {
  const [progress, setProgress] = useState<StudentProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboard() {
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
          : "Öğrenci panel verileri yüklenemedi.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  const waitingAssignments = useMemo(() => {
    if (!progress) return [];
    return progress.assignments.filter((assignment) => !assignment.submission);
  }, [progress]);

  const recentAssignments = useMemo(() => {
    if (!progress) return [];
    return progress.assignments.slice(0, 4);
  }, [progress]);

  const recentGrades = useMemo(() => {
    if (!progress) return [];
    return progress.grades.slice(0, 5);
  }, [progress]);

  return (
    <DashboardShell
      title="Öğrenci Paneli"
      description="Notlar, ödevler, yoklama ve sınıf ilerlemesi için kişisel akademik özet."
      activePage="student-dashboard"
    >
      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-8 w-56 animate-pulse rounded bg-slate-100" />
          <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="h-36 animate-pulse rounded-3xl bg-slate-100"
              />
            ))}
          </div>
        </div>
      )}

      {!loading && errorMessage && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700">
          {errorMessage}
        </div>
      )}

      {!loading && progress && progress.summary.activeClassCount === 0 && (
        <EmptyState
          icon={BsPeople}
          title="Henüz aktif sınıf bulunmuyor"
          description="Bir sınıfa katıldığınızda kişisel akademik paneliniz gerçek verilerle dolacaktır."
          primaryActionLabel="Sınıfa Katıl"
          primaryActionHref="/student/join-class"
        />
      )}

      {!loading && progress && progress.summary.activeClassCount > 0 && (
        <div className="space-y-8">
          <section className="rounded-3xl border border-blue-100 bg-blue-50 p-8 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Kişisel Akademik Özet
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-blue-950">
                  Hoş geldin, {progress.student.name}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-900">
                  Bu panel notlarınızı, ödev teslimlerinizi ve yoklama durumunuzu
                  gerçek Airtable kayıtlarından hesaplar.
                </p>
              </div>

              <button
                type="button"
                onClick={loadDashboard}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-100"
              >
                Verileri Yenile
              </button>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Aktif Sınıf"
              value={progress.summary.activeClassCount}
              description="Kayıtlı olduğunuz aktif sınıflar"
              icon={BsPeople}
              href="/student/classes"
            />

            <StatCard
              title="Not Ortalaması"
              value={metricValue(progress.summary.gradeAverage)}
              description={`${progress.summary.gradeRecordCount} not kaydına göre`}
              icon={BsBarChart}
              href="/student/grades"
            />

            <StatCard
              title="Ödev Teslim"
              value={metricValue(progress.summary.assignmentSubmissionRate)}
              description={`${progress.summary.submittedAssignmentCount} / ${progress.summary.assignmentCount} ödev teslim edildi`}
              icon={BsCardChecklist}
              href="/student/assignments"
            />

            <StatCard
              title="Yoklama"
              value={metricValue(progress.summary.attendanceRate)}
              description={`${progress.summary.presentAttendanceCount} / ${progress.summary.attendanceSessionCount} oturuma katılım`}
              icon={BsCalendarCheck}
              href="/student/attendance"
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
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
                <p className="text-sm font-semibold">Ödev İlerlemesi</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {metricValue(progress.summary.assignmentSubmissionRate)}
              </p>
              <ProgressBar value={progress.summary.assignmentSubmissionRate} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsCalendarCheck />
                <p className="text-sm font-semibold">Yoklama Katılımı</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {metricValue(progress.summary.attendanceRate)}
              </p>
              <ProgressBar value={progress.summary.attendanceRate} />
            </div>
          </section>

          {waitingAssignments.length > 0 && (
            <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-amber-950">
                    Bekleyen Ödevler
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-amber-800">
                    {waitingAssignments.length} ödev için henüz teslim kaydınız
                    bulunmuyor.
                  </p>
                </div>

                <Link
                  href="/student/assignments"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800"
                >
                  Ödevlere Git
                  <BsArrowRight />
                </Link>
              </div>
            </section>
          )}

          <section>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Sınıf Bazlı İlerleme
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Her sınıf için not, ödev ve yoklama göstergeleri.
                </p>
              </div>

              <Link
                href="/student/classes"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
              >
                Sınıflarım
                <BsArrowRight />
              </Link>
            </div>

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
                </article>
              ))}
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    Son Notlar
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    En son girilen değerlendirme kayıtları.
                  </p>
                </div>

                <Link
                  href="/student/grades"
                  className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                >
                  Tümü
                </Link>
              </div>

              {recentGrades.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                  Henüz not kaydı bulunmuyor.
                </div>
              ) : (
                <div className="space-y-3">
                  {recentGrades.map((grade) => (
                    <div
                      key={grade.id}
                      className="rounded-2xl border border-slate-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-950">
                            {grade.title}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">
                            {grade.className}  {grade.gradeType}
                          </p>
                        </div>

                        <p className="font-bold text-blue-700">
                          {grade.percentage === null
                            ? "Yok"
                            : `${grade.percentage}%`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    Ödev Durumu
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Son ödev teslimleri ve değerlendirme durumu.
                  </p>
                </div>

                <Link
                  href="/student/assignments"
                  className="text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                >
                  Tümü
                </Link>
              </div>

              {recentAssignments.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                  Henüz ödev bulunmuyor.
                </div>
              ) : (
                <div className="space-y-4">
                  {recentAssignments.map((assignment) => (
                    <AssignmentStatusCard
                      key={assignment.id}
                      assignment={assignment}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

