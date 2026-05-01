"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsArrowRight,
  BsClipboard,
  BsCollection,
  BsPeople,
  BsPlusSquare,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import { listTeacherClasses, type TeacherClass } from "@/lib/classesApi";
import { supabase } from "@/lib/supabaseClient";

export default function TeacherClassesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
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

      setUser(data.user);

      try {
        const teacherClasses = await listTeacherClasses(data.user.id);
        setClasses(teacherClasses);
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

  return (
    <DashboardShell
      title="Sınıflar"
      description="Airtable Siniflar tablosuna bağlı gerçek sınıf kayıtlarınızı görüntüleyin."
      activePage="classes"
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            Sınıf Yönetimi
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Oluşturduğunuz sınıflar, davet kodları ve temel sınıf durumu bu
            ekranda listelenir.
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

      {loading && (
        <div className="grid gap-5 lg:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-5 w-36 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-8 w-48 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && errorMessage && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700">
          {errorMessage}
        </div>
      )}

      {!loading && !errorMessage && classes.length === 0 && (
        <EmptyState
          icon={BsCollection}
          title="Henüz sınıf oluşturmadınız"
          description="İlk sınıfınızı oluşturarak öğrenci davet kodu üretebilir, katılım isteklerini toplayabilir ve akademik performans takibine başlayabilirsiniz."
          primaryActionLabel="Yeni Sınıf Oluştur"
          primaryActionHref="/teacher/classes/new"
        />
      )}

      {!loading && !errorMessage && classes.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {classes.map((classItem) => (
            <article
              key={classItem.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
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

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Seviye
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {classItem.level}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Onay Sistemi
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {classItem.joinApprovalRequired ? "Onay gerekli" : "Açık katılım"}
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <div className="flex items-center gap-3">
                  <BsClipboard className="text-blue-700" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                      Sınıf Katılım Kodu
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-blue-950">
                      {classItem.classCode || "Kod yok"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-3">
                    <BsPeople className="text-slate-600" />
                    <div>
                      <p className="text-xs text-slate-500">Öğrenci</p>
                      <p className="text-lg font-bold text-slate-950">
                        {classItem.studentCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-500">Riskli Öğrenci</p>
                  <p className="text-lg font-bold text-slate-950">
                    {classItem.riskyStudentCount}
                  </p>
                </div>
              </div>

              <Link
                href={`/teacher/classes/${classItem.id}`}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
              >
                Sınıf Detayına Git
                <BsArrowRight />
              </Link>
            </article>
          ))}
        </div>
      )}

      {!loading && user && classes.length > 0 && (
        <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-6">
          <p className="text-sm font-semibold text-blue-950">
            Airtable bağlantısı aktif
          </p>
          <p className="mt-2 text-sm leading-7 text-blue-900">
            Bu sayfadaki sınıflar öğretmen hesabınızın Auth_ID bilgisi
            üzerinden Airtable kayıtlarıyla eşleştirilerek getirilmektedir.
          </p>
        </div>
      )}
    </DashboardShell>
  );
}