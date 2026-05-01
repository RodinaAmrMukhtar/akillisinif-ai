"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsCheckCircle,
  BsClock,
  BsEnvelope,
  BsPersonCheck,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  approveJoinRequest,
  listTeacherJoinRequests,
  type TeacherJoinRequest,
} from "@/lib/joinRequestsApi";
import { supabase } from "@/lib/supabaseClient";

export default function TeacherJoinRequestsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [requests, setRequests] = useState<TeacherJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadRequests() {
    setLoading(true);
    setErrorMessage("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setLoading(false);
      return;
    }

    setUser(data.user);

    try {
      const teacherRequests = await listTeacherJoinRequests(data.user.id);
      setRequests(teacherRequests);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Katılım istekleri yüklenemedi.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

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

      setSuccessMessage("Katılım isteği başarıyla onaylandı.");
      setRequests((currentRequests) =>
        currentRequests.filter((request) => request.id !== membershipId),
      );
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
      title="Katılım İstekleri"
      description="Öğrencilerin sınıf koduyla gönderdiği istekleri görüntüleyin ve uygun olanları onaylayın."
      activePage="requests"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">
          Bekleyen Öğrenci Katılımları
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Bu liste Airtable Sinif_Uyelikleri tablosundaki Onay Bekliyor
          kayıtlarından oluşturulur.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-700">
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="grid gap-5">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
              <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && requests.length === 0 && !errorMessage && (
        <EmptyState
          icon={BsPersonCheck}
          title="Bekleyen katılım isteği yok"
          description="Öğrenciler sınıf kodunu girerek katılım isteği gönderdiğinde bu ekranda görüneceklerdir."
          primaryActionLabel="Sınıfları Gör"
          primaryActionHref="/teacher/classes"
        />
      )}

      {!loading && requests.length > 0 && (
        <div className="grid gap-5">
          {requests.map((request) => (
            <article
              key={request.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <BsPersonCheck className="text-xl" />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-bold text-slate-950">
                        {request.studentName}
                      </h3>

                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        {request.status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-slate-600">
                      <p className="flex items-center gap-2">
                        <BsEnvelope />
                        {request.studentEmail || "E-posta yok"}
                      </p>

                      <p>
                        Okul No:{" "}
                        <span className="font-semibold text-slate-950">
                          {request.schoolNumber}
                        </span>
                      </p>

                      <p>
                        Sınıf:{" "}
                        <span className="font-semibold text-slate-950">
                          {request.className} · {request.courseName}
                        </span>
                      </p>

                      <p>
                        Kod:{" "}
                        <span className="font-mono font-bold text-blue-700">
                          {request.classCode}
                        </span>
                      </p>

                      <p className="flex items-center gap-2">
                        <BsClock />
                        {request.requestedAt || "Tarih belirtilmedi"}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApprove(request.id)}
                  disabled={approvingId === request.id}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <BsCheckCircle />
                  {approvingId === request.id
                    ? "Onaylanıyor..."
                    : "Katılımı Onayla"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}