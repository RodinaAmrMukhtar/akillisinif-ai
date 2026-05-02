"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsArrowLeft,
  BsBook,
  BsCalendarCheck,
  BsCardChecklist,
  BsClipboard,
  BsGraphUp,
  BsJournalText,
  BsShieldCheck,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import {
  getStudentClassDetail,
  type StudentClassDetailResult,
} from "@/lib/classDetailApi";
import { supabase } from "@/lib/supabaseClient";

function ModuleCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
        <Icon className="text-xl" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-600">{description}</p>
    </div>
  );
}

export default function StudentClassDetailPage() {
  const params = useParams<{ id: string }>();
  const classId = params.id;

  const [detail, setDetail] = useState<StudentClassDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      setErrorMessage("");

      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        setLoading(false);
        return;
      }

      try {
        const result = await getStudentClassDetail({
          studentAuthId: data.user.id,
          classId,
        });

        setDetail(result);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Sınıf detayları yüklenemedi.",
        );
      }

      setLoading(false);
    }

    loadDetail();
  }, [classId]);

  return (
    <DashboardShell
      title="Sınıf Detayı"
      description="Sınıf bilgileri, üyelik durumu ve akademik takip modülleri."
      activePage="student-classes"
    >
      <Link
        href="/student/classes"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
      >
        <BsArrowLeft />
        Sınıflarıma Dön
      </Link>

      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-8 w-48 animate-pulse rounded bg-slate-100" />
          <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100" />
        </div>
      )}

      {!loading && errorMessage && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700">
          {errorMessage}
        </div>
      )}

      {!loading && detail && (
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  {detail.membership.status}
                </span>

                <h2 className="mt-5 text-4xl font-bold tracking-tight text-slate-950">
                  {detail.class.className}
                </h2>

                <p className="mt-2 text-lg font-semibold text-slate-600">
                  {detail.class.courseName}
                </p>

                {detail.class.description && (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                    {detail.class.description}
                  </p>
                )}
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                  Sınıf Katılım Kodu
                </p>
                <p className="mt-2 font-mono text-3xl font-bold tracking-wider text-blue-950">
                  {detail.class.classCode}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Akademik Yıl
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {detail.class.academicYear}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Dönem
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {detail.class.term}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Seviye
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  {detail.class.level}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                <BsShieldCheck className="text-xl" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-emerald-950">
                  Öğrenci üyeliği doğrulandı
                </h2>
                <p className="mt-2 text-sm leading-7 text-emerald-900">
                  Bu sayfa yalnızca ilgili sınıfa kayıtlı öğrenci tarafından
                  görüntülenebilir. Üyelik durumu Airtable Sinif_Uyelikleri
                  tablosundan okunur.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-950">
              Akademik Modüller
            </h2>

            <div className="grid gap-5 lg:grid-cols-4">
              <ModuleCard
                title="Ödevler"
                description="Bu sınıfa ait ödevler sonraki adımda Airtable Odevler tablosundan getirilecek."
                icon={BsCardChecklist}
              />

              <ModuleCard
                title="Notlar"
                description="Not kayıtları Notlar tablosundan hesaplanarak öğrenciye güvenli şekilde gösterilecek."
                icon={BsJournalText}
              />

              <ModuleCard
                title="Yoklama"
                description="Devam durumu Yoklamalar tablosundan sınıf bazlı takip edilecek."
                icon={BsCalendarCheck}
              />

              <ModuleCard
                title="AI Önerileri"
                description="Risk ve gelişim önerileri gerçek performans verisiyle üretilecek."
                icon={BsGraphUp}
              />
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
