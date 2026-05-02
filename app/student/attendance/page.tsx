"use client";

import { Suspense } from "react";

import { FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  BsCalendarCheck,
  BsCheckCircle,
  BsClipboardData,
  BsQrCode,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import {
  lookupAttendanceSession,
  markAttendance,
  type AttendanceSession,
} from "@/lib/attendanceApi";
import { supabase } from "@/lib/supabaseClient";

function StudentAttendancePageContent() {
  const searchParams = useSearchParams();

  const [user, setUser] = useState<User | null>(null);
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [loadingSession, setLoadingSession] = useState(false);
  const [marking, setMarking] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }

    loadUser();
  }, []);

  useEffect(() => {
    const codeFromUrl = searchParams.get("code");

    if (codeFromUrl) {
      setCode(codeFromUrl);
      handleLookup(codeFromUrl);
    }
  }, [searchParams]);

  async function handleLookup(rawCode = code) {
    setLoadingSession(true);
    setErrorMessage("");
    setSuccessMessage("");
    setSession(null);

    if (!rawCode.trim()) {
      setErrorMessage("Lütfen yoklama kodunu girin.");
      setLoadingSession(false);
      return;
    }

    try {
      const foundSession = await lookupAttendanceSession(rawCode.trim());
      setSession(foundSession);
      setCode(foundSession.code);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Yoklama oturumu bulunamadı.",
      );
    }

    setLoadingSession(false);
  }

  async function handleMarkAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) {
      setErrorMessage("Yoklamaya katılmak için giriş yapmanız gerekir.");
      return;
    }

    setMarking(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const result = await markAttendance({
        studentAuthId: user.id,
        code,
      });

      setSuccessMessage(result.message || "Yoklama kaydınız alındı.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Yoklama kaydı oluşturulamadı.",
      );
    }

    setMarking(false);
  }

  return (
    <DashboardShell
      title="Yoklama"
      description="Öğretmen tarafından gösterilen QR kodu veya yoklama kodunu kullanarak katılımınızı onaylayın."
      activePage="student-attendance"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <BsQrCode className="text-xl" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Yoklama Kodunu Gir
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Kod örneği: YK-123456. QR kodla geldiyseniz kod otomatik olarak
                doldurulur.
              </p>
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleLookup();
            }}
            className="space-y-5"
          >
            <div>
              <label className="text-sm font-medium text-slate-700">
                Yoklama Kodu
              </label>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                placeholder="YK-123456"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-lg font-bold tracking-wider outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="submit"
              disabled={loadingSession}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BsClipboardData />
              {loadingSession ? "Kod kontrol ediliyor..." : "Kodu Kontrol Et"}
            </button>
          </form>

          {errorMessage && (
            <div className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-5 text-sm leading-7 text-red-700">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">
              {successMessage}
            </div>
          )}

          {session && (
            <form
              onSubmit={handleMarkAttendance}
              className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-6"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-700">
                  <BsCalendarCheck className="text-xl" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-blue-700">
                    Yoklama oturumu bulundu
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-blue-950">
                    {session.className}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-blue-800">
                    {session.courseName}
                  </p>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Tarih
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {session.date}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Ders
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {session.lessonHour}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Durum
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">
                        {session.status}
                      </p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={marking}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <BsCheckCircle />
                    {marking ? "Yoklama kaydediliyor..." : "Yoklamaya Katıl"}
                  </button>
                </div>
              </div>
            </form>
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700">
              <BsQrCode className="text-xl" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-blue-950">
              QR kod nasıl çalışır?
            </h2>

            <p className="mt-3 text-sm leading-7 text-blue-900">
              Öğretmen yoklama başlattığında sistem bir kod ve QR bağlantısı
              oluşturur. Bu bağlantı açıldığında kod otomatik gelir. Öğrenci
              giriş yaptıktan sonra katılımını onaylar.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Kaydedilen tablo
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Katılım onaylandığında Airtable Yoklamalar tablosuna gerçek
              kayıt oluşturulur.
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}

export default function StudentAttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-8">
          <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-8 w-64 animate-pulse rounded bg-slate-100" />
            <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      }
    >
      <StudentAttendancePageContent />
    </Suspense>
  );
}
