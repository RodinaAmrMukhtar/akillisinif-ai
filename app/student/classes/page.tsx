"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsArrowRight,
  BsBook,
  BsClock,
  BsClipboardData,
  BsCollection,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  listStudentClasses,
  type StudentClassMembership,
} from "@/lib/joinRequestsApi";
import { supabase } from "@/lib/supabaseClient";

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<StudentClassMembership[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadClasses() {
      setLoading(true);
      setErrorMessage("");

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setLoading(false);
        return;
      }

      try {
        const studentClasses = await listStudentClasses(data.user.id);
        setClasses(studentClasses);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Sınıflar yüklenirken hata oluştu.",
        );
      }

      setLoading(false);
    }

    loadClasses();
  }, []);

  const activeClasses = classes.filter((item) => item.status === "Aktif");
  const pendingClasses = classes.filter(
    (item) => item.status === "Onay Bekliyor",
  );

  return (
    <DashboardShell
      title="Sınıflarım"
      description="Katıldığınız aktif sınıfları ve bekleyen katılım isteklerinizi görüntüleyin."
      activePage="student-classes"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Öğrenci Sınıf Paneli
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Bu sayfa Airtable Sinif_Uyelikleri tablosundaki öğrenci
            kayıtlarınıza göre oluşturulur.
          </p>
        </div>

        <Link
          href="/student/join-class"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <BsClipboardData />
          Sınıfa Katıl
        </Link>
      </div>

      {loading && (
        <div className="grid gap-5 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-8 w-48 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && errorMessage && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700">
          {errorMessage}
        </div>
      )}

      {!loading &&
        !errorMessage &&
        activeClasses.length === 0 &&
        pendingClasses.length === 0 && (
          <EmptyState
            icon={BsBook}
            title="Henüz bir sınıfa katılmadınız"
            description="Öğretmeninizden aldığınız sınıf kodunu girerek katılım isteği gönderebilirsiniz. Öğretmen onayladıktan sonra sınıfınız burada görünecektir."
            primaryActionLabel="Sınıfa Katıl"
            primaryActionHref="/student/join-class"
          />
        )}

      {!loading && !errorMessage && pendingClasses.length > 0 && (
        <section className="mb-10">
          <h3 className="mb-4 text-lg font-bold text-slate-950">
            Bekleyen Katılım İstekleri
          </h3>

          <div className="grid gap-5 lg:grid-cols-2">
            {pendingClasses.map((classItem) => (
              <article
                key={classItem.membershipId}
                className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-700">
                    <BsClock className="text-xl" />
                  </div>

                  <div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                      {classItem.status}
                    </span>

                    <h3 className="mt-4 text-2xl font-bold text-slate-950">
                      {classItem.className}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {classItem.courseName}
                    </p>

                    <p className="mt-4 text-sm leading-7 text-amber-900">
                      Bu sınıf için katılım isteğiniz öğretmen onayı
                      beklemektedir.
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!loading && !errorMessage && activeClasses.length > 0 && (
        <section>
          <h3 className="mb-4 text-lg font-bold text-slate-950">
            Aktif Sınıflar
          </h3>

          <div className="grid gap-5 lg:grid-cols-2">
            {activeClasses.map((classItem) => (
              <article
                key={classItem.membershipId}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {classItem.status}
                    </span>

                    <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                      {classItem.className}
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {classItem.courseName}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <BsCollection className="text-xl" />
                  </div>
                </div>

                {classItem.description && (
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {classItem.description}
                  </p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Akademik Yıl
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {classItem.academicYear}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Dönem
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {classItem.term}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/student/classes/${classItem.classId}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                >
                  Sınıf Detayına Git
                  <BsArrowRight />
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </DashboardShell>
  );
}