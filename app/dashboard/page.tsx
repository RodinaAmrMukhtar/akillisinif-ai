"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ElementType } from "react";
import {
  BsArrowRight,
  BsBarChart,
  BsCalendarCheck,
  BsCardChecklist,
  BsClipboardData,
  BsGraphUp,
  BsPeople,
  BsPlusCircle,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  getTeacherDashboard,
  type TeacherDashboardData,
} from "@/lib/dashboardApi";
import { supabase } from "@/lib/supabaseClient";

function metricValue(value: number | null, suffix = "%") {
  if (value === null) return "Veri yok";
  return `${value}${suffix}`;
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
  const card = (
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

  if (!href) return card;

  return (
    <Link href={href} className="block h-full">
      {card}
    </Link>
  );
}

export default function TeacherDashboardPage() {
  const [dashboard, setDashboard] = useState<TeacherDashboardData | null>(null);
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
      const result = await getTeacherDashboard(data.user.id);
      setDashboard(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Öğretmen panel verileri yüklenemedi.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <DashboardShell
      title="Öğretmen Paneli"
      description="AkıllıSınıf AI için gerçek Airtable verilerine bağlı akademik yönetim özeti."
      activePage="dashboard"
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

      {!loading && dashboard && (
        <div className="space-y-8">
          <section className="rounded-3xl border border-blue-100 bg-blue-50 p-8 shadow-sm">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  Canlı Akademik Yönetim Paneli
                </p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-blue-950">
                  Hoş geldiniz, {dashboard.teacher.name}
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-blue-900">
                  Bu panel sınıf, ödev, yoklama, not ve risk analizini tek ekranda
                  birleştirir. Tüm sayılar Airtable kayıtlarından hesaplanır.
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
              value={dashboard.summary.activeClassCount}
              description="Öğretmen hesabınıza bağlı sınıflar"
              icon={BsPeople}
              href="/teacher/classes"
            />

            <StatCard
              title="Toplam Öğrenci"
              value={dashboard.summary.totalStudentCount}
              description="Aktif üyeliklerdeki benzersiz öğrenciler"
              icon={BsPeople}
              href="/teacher/classes"
            />

            <StatCard
              title="Onay Bekleyen"
              value={dashboard.summary.pendingJoinRequestCount}
              description="Sınıfa katılım için bekleyen istekler"
              icon={BsClipboardData}
              href="/teacher/join-requests"
            />

            <StatCard
              title="Riskli Öğrenci"
              value={dashboard.summary.riskyStudentCount}
              description="Yüksek veya kritik risk sinyali taşıyan öğrenciler"
              icon={BsGraphUp}
              href="/teacher/risk-analysis"
            />
          </section>

          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Yayınlanan Ödev"
              value={dashboard.summary.assignmentCount}
              description="Airtable Odevler tablosundaki öğretmen ödevleri"
              icon={BsCardChecklist}
              href="/teacher/assignments"
            />

            <StatCard
              title="Teslimler"
              value={dashboard.summary.submissionCount}
              description={`${dashboard.summary.gradedSubmissionCount} teslim değerlendirildi`}
              icon={BsClipboardData}
              href="/teacher/assignments"
            />

            <StatCard
              title="Yoklama Oturumu"
              value={dashboard.summary.attendanceSessionCount}
              description={`${dashboard.summary.attendanceRecordCount} yoklama kaydı alındı`}
              icon={BsCalendarCheck}
              href="/teacher/attendance"
            />

            <StatCard
              title="Not Kaydı"
              value={dashboard.summary.gradeRecordCount}
              description="Ödev, vize, final ve laboratuvar kayıtları"
              icon={BsBarChart}
              href="/teacher/grades"
            />
          </section>

          <section className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsBarChart />
                <p className="text-sm font-semibold">Ortalama Not</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {metricValue(dashboard.summary.averageGrade)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ağırlıklı formül varsa ona göre hesaplanır.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsCardChecklist />
                <p className="text-sm font-semibold">Ödev Teslim Oranı</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {metricValue(dashboard.summary.averageSubmissionRate)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Öğrenci bazlı teslim oranlarının ortalaması.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsCalendarCheck />
                <p className="text-sm font-semibold">Yoklama Katılımı</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {metricValue(dashboard.summary.averageAttendanceRate)}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Yoklama oturumlarına katılım ortalaması.
              </p>
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Sınıf Özeti
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Her sınıf için öğrenci, ödev, teslim ve risk görünümü.
                </p>
              </div>

              <Link
                href="/teacher/classes/new"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                <BsPlusCircle />
                Yeni Sınıf
              </Link>
            </div>

            {dashboard.classes.length === 0 ? (
              <EmptyState
                icon={BsPeople}
                title="Henüz sınıf bulunmuyor"
                description="İlk sınıfınızı oluşturduğunuzda öğretmen paneli gerçek verilerle dolmaya başlayacaktır."
                primaryActionLabel="Yeni Sınıf Oluştur"
                primaryActionHref="/teacher/classes/new"
              />
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {dashboard.classes.map((classItem) => (
                  <article
                    key={classItem.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {classItem.status}
                        </span>

                        <h3 className="mt-4 text-2xl font-bold text-slate-950">
                          {classItem.className}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {classItem.courseName}
                        </p>
                      </div>

                      <Link
                        href={`/teacher/classes/${classItem.id}`}
                        className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Aç
                        <BsArrowRight />
                      </Link>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-5">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Öğrenci
                        </p>
                        <p className="mt-2 text-xl font-bold text-slate-950">
                          {classItem.studentCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Bekleyen
                        </p>
                        <p className="mt-2 text-xl font-bold text-slate-950">
                          {classItem.pendingCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Ödev
                        </p>
                        <p className="mt-2 text-xl font-bold text-slate-950">
                          {classItem.assignmentCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Teslim
                        </p>
                        <p className="mt-2 text-xl font-bold text-slate-950">
                          {classItem.submissionCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Risk
                        </p>
                        <p className="mt-2 text-xl font-bold text-red-700">
                          {classItem.riskyStudentCount}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Son Akademik Hareketler
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Ödev, teslim, katılım isteği ve yoklama hareketleri.
                </p>
              </div>
            </div>

            {dashboard.recentActivities.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                Henüz akademik hareket bulunmuyor.
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard.recentActivities.map((activity) => (
                  <Link
                    key={activity.id}
                    href={activity.href}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {activity.type}
                      </span>

                      <h3 className="mt-3 text-sm font-bold text-slate-950">
                        {activity.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600">
                        {activity.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-sm font-semibold text-blue-700">
                      {activity.date}
                      <BsArrowRight />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}

