"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsArrowLeft,
  BsBook,
  BsCalendarCheck,
  BsCheckCircle,
  BsClipboard,
  BsEnvelope,
  BsGraphUp,
  BsPeople,
  BsPersonCheck,
  BsShieldCheck,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  getTeacherClassDetail,
  type TeacherClassDetailResult,
} from "@/lib/classDetailApi";
import { approveJoinRequest } from "@/lib/joinRequestsApi";
import { supabase } from "@/lib/supabaseClient";

export default function TeacherClassDetailPage() {
  const params = useParams<{ id: string }>();
  const classId = params.id;

  const [user, setUser] = useState<User | null>(null);
  const [detail, setDetail] = useState<TeacherClassDetailResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDetail() {
    setLoading(true);
    setErrorMessage("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setLoading(false);
      return;
    }

    setUser(data.user);

    try {
      const result = await getTeacherClassDetail({
        teacherAuthId: data.user.id,
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

  useEffect(() => {
    loadDetail();
  }, [classId]);

  async function handleApprove(membershipId: string) {
    if (!user) return;

    setApprovingId(membershipId);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      await approveJoinRequest({
        teacherAuthId: user.id,
        membershipId,
      });

      setSuccessMessage("Katılım isteği onaylandı.");
      await loadDetail();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Katılım isteği onaylanamadı.",
      );
    }

    setApprovingId("");
  }

  return (
    <DashboardShell
      title="Sınıf Detayı"
      description="Sınıfa ait öğrenciler, bekleyen katılım istekleri ve akademik takip modülleri."
      activePage="classes"
    >
      <Link
        href="/teacher/classes"
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
      >
        <BsArrowLeft />
        Sınıflara Dön
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

      {!loading && successMessage && (
        <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      {!loading && detail && (
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  {detail.class.status}
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
                <div className="flex items-center gap-3">
                  <BsClipboard className="text-blue-700" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                      Sınıf Katılım Kodu
                    </p>
                    <p className="mt-2 font-mono text-3xl font-bold tracking-wider text-blue-950">
                      {detail.class.classCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Aktif Öğrenci
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {detail.class.activeStudentCount}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Bekleyen İstek
                </p>
                <p className="mt-2 text-2xl font-bold text-slate-950">
                  {detail.class.pendingRequestCount}
                </p>
              </div>

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
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                <BsShieldCheck className="text-xl" />
              </div>

              <div>
                <h2 className="text-lg font-bold text-emerald-950">
                  Gerçek sınıf verisi aktif
                </h2>
                <p className="mt-2 text-sm leading-7 text-emerald-900">
                  Bu sayfa Airtable Siniflar, Kullanicilar ve Sinif_Uyelikleri
                  tablolarından gerçek kayıtları okuyarak oluşturulur.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Bekleyen Katılım İstekleri
              </h2>
              <Link
                href="/teacher/join-requests"
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                Tümünü Gör
              </Link>
            </div>

            {detail.pendingRequests.length === 0 ? (
              <EmptyState
                icon={BsPersonCheck}
                title="Bu sınıf için bekleyen istek yok"
                description="Öğrenciler sınıf kodunu girerek katılım isteği gönderdiğinde burada görünecektir."
              />
            ) : (
              <div className="grid gap-5">
                {detail.pendingRequests.map((request) => (
                  <article
                    key={request.membershipId}
                    className="rounded-3xl border border-amber-200 bg-amber-50 p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-950">
                          {request.studentName}
                        </h3>
                        <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                          <BsEnvelope />
                          {request.studentEmail || "E-posta yok"}
                        </p>
                        <p className="mt-2 text-sm text-slate-700">
                          Okul No:{" "}
                          <span className="font-semibold">
                            {request.schoolNumber}
                          </span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApprove(request.membershipId)}
                        disabled={approvingId === request.membershipId}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <BsCheckCircle />
                        {approvingId === request.membershipId
                          ? "Onaylanıyor..."
                          : "Katılımı Onayla"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-950">
              Aktif Öğrenciler
            </h2>

            {detail.activeStudents.length === 0 ? (
              <EmptyState
                icon={BsPeople}
                title="Bu sınıfta aktif öğrenci yok"
                description="Katılım isteklerini onayladığınızda öğrenciler burada aktif olarak listelenir."
              />
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {detail.activeStudents.map((student) => (
                  <article
                    key={student.membershipId}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <BsPeople className="text-xl" />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-slate-950">
                          {student.studentName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-600">
                          {student.studentEmail || "E-posta yok"}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          Okul No:{" "}
                          <span className="font-semibold text-slate-950">
                            {student.schoolNumber}
                          </span>
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
              Akademik Takip Modülleri
            </h2>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <BsCalendarCheck className="text-2xl text-blue-700" />
                <h3 className="mt-4 text-lg font-bold text-slate-950">
                  Yoklama Takibi
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Sonraki aşamada bu sınıf için gerçek yoklama kayıtları
                  Yoklamalar tablosuna bağlanacak.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <BsBook className="text-2xl text-blue-700" />
                <h3 className="mt-4 text-lg font-bold text-slate-950">
                  Ödev ve Not Takibi
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Ödevler, teslimler ve notlar bu sınıf kaydıyla
                  ilişkilendirilecek.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <BsGraphUp className="text-2xl text-blue-700" />
                <h3 className="mt-4 text-lg font-bold text-slate-950">
                  Risk Analizi
                </h3>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Gerçek akademik kayıtlar bağlandığında sınıf bazlı erken uyarı
                  üretilecek.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
