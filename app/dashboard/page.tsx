"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsActivity,
  BsArrowRight,
  BsCollection,
  BsExclamationTriangle,
  BsPeople,
  BsPersonCheck,
  BsPlusSquare,
  BsShieldCheck,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  getTeacherDashboard,
  type TeacherDashboardData,
} from "@/lib/dashboardApi";
import { supabase } from "@/lib/supabaseClient";

type StatCardProps = {
  title: string;
  value: number;
  description: string;
  icon: React.ElementType;
  tone?: "blue" | "emerald" | "amber" | "red";
};

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "blue",
}: StatCardProps) {
  const toneClasses = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-4 text-4xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${toneClasses[tone]}`}
        >
          <Icon className="text-xl" />
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);
      setErrorMessage("");

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setLoading(false);
        return;
      }

      setUser(data.user);

      try {
        const dashboardData = await getTeacherDashboard(data.user.id);
        setDashboard(dashboardData);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Dashboard verisi alınamadı.",
        );
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  return (
    <DashboardShell
      title="Genel Bakış"
      description="Bu panel artık gerçek Airtable verilerini kullanır: sınıflar, aktif öğrenciler ve bekleyen katılım istekleri canlı kayıtlardan hesaplanır."
      activePage="dashboard"
    >
      {loading && (
        <div className="grid gap-5 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
              <div className="mt-5 h-10 w-20 animate-pulse rounded bg-slate-100" />
              <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && errorMessage && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700">
          {errorMessage}
        </div>
      )}

      {!loading && !errorMessage && dashboard && (
        <div className="space-y-8">
          <div className="grid gap-5 lg:grid-cols-4">
            <StatCard
              title="Aktif Sınıf"
              value={dashboard.activeClassCount}
              description="Airtable Siniflar tablosunda size bağlı aktif sınıflar."
              icon={BsCollection}
              tone="blue"
            />

            <StatCard
              title="Toplam Öğrenci"
              value={dashboard.totalStudentCount}
              description="Sinif_Uyelikleri tablosundaki aktif öğrenci kayıtlarından hesaplanır."
              icon={BsPeople}
              tone="emerald"
            />

            <StatCard
              title="Bekleyen Katılım"
              value={dashboard.pendingJoinRequestCount}
              description="Öğretmen onayı bekleyen gerçek sınıf katılım istekleri."
              icon={BsPersonCheck}
              tone="amber"
            />

            <StatCard
              title="Yüksek Risk"
              value={dashboard.highRiskStudentCount}
              description="Risk analizi modülü bağlandığında Risk_Sinyalleri verisiyle hesaplanacaktır."
              icon={BsActivity}
              tone="red"
            />
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                <BsShieldCheck className="text-xl" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-emerald-950">
                  Gerçek veri bağlantısı aktif
                </h2>
                <p className="mt-2 text-sm leading-7 text-emerald-900">
                  Bu ekrandaki sınıf, öğrenci ve katılım isteği sayıları mock
                  veri değildir. Supabase oturumundaki öğretmen Auth_ID bilgisi
                  Airtable Kullanicilar tablosuyla eşleştirilir ve ilişkili
                  Siniflar ile Sinif_Uyelikleri kayıtlarından hesaplanır.
                </p>
              </div>
            </div>
          </div>

          {dashboard.classSummaries.length === 0 ? (
            <EmptyState
              icon={BsCollection}
              title="Henüz gerçek sınıf kaydı yok"
              description="Yeni sınıf oluşturarak Airtable Siniflar tablosuna kayıt ekleyebilir, ardından öğrencilerin sınıf koduyla katılım isteği göndermesini sağlayabilirsiniz."
              primaryActionLabel="Yeni Sınıf Oluştur"
              primaryActionHref="/teacher/classes/new"
            />
          ) : (
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                    Sınıflarım
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Aşağıdaki liste Airtable üzerinden gerçek zamanlı olarak
                    getirilen sınıf özetleridir.
                  </p>
                </div>

                <Link
                  href="/teacher/classes/new"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                >
                  <BsPlusSquare />
                  Yeni Sınıf
                </Link>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                {dashboard.classSummaries.map((classItem) => (
                  <article
                    key={classItem.id}
                    className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                          {classItem.status}
                        </span>

                        <h3 className="mt-4 text-2xl font-bold text-slate-950">
                          {classItem.className}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {classItem.courseName}
                        </p>
                      </div>

                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700">
                        <BsCollection className="text-xl" />
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Öğrenci
                        </p>
                        <p className="mt-2 text-xl font-bold text-slate-950">
                          {classItem.studentCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Bekleyen
                        </p>
                        <p className="mt-2 text-xl font-bold text-slate-950">
                          {classItem.pendingJoinRequestCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Kod
                        </p>
                        <p className="mt-2 font-mono text-sm font-bold text-blue-700">
                          {classItem.classCode || "Yok"}
                        </p>
                      </div>
                    </div>

                    <Link
                      href={`/teacher/classes/${classItem.id}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                    >
                      Sınıf Detayına Git
                      <BsArrowRight />
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex gap-4">
              <BsExclamationTriangle className="mt-1 shrink-0 text-amber-700" />
              <p className="text-sm leading-7 text-amber-900">
                Risk göstergesi şu anda bilinçli olarak 0 gösterilir. Çünkü
                Notlar, Yoklamalar, Odev_Teslimleri ve Risk_Sinyalleri gerçek
                hesaplama modülü henüz bağlanmadı. Bir sonraki veri aşamasında
                bu alan da tamamen gerçek hesaplamaya bağlanacak.
              </p>
            </div>
          </div>
        </div>
      )}

      {!loading && !errorMessage && !dashboard && !user && (
        <EmptyState
          icon={BsCollection}
          title="Oturum bulunamadı"
          description="Dashboard verilerini görüntülemek için öğretmen hesabınızla giriş yapmanız gerekir."
          primaryActionLabel="Giriş Yap"
          primaryActionHref="/login"
        />
      )}
    </DashboardShell>
  );
}
