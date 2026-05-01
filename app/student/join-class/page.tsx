"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsArrowRight,
  BsCheckCircle,
  BsClipboardData,
  BsInfoCircle,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import { createStudentJoinRequest } from "@/lib/joinRequestsApi";
import { supabase } from "@/lib/supabaseClient";

export default function StudentJoinClassPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classCode, setClassCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [createdClassName, setCreatedClassName] = useState("");
  const [membershipStatus, setMembershipStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }

    loadUser();
  }, []);

  async function handleJoinClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setSuccessMessage("");
    setCreatedClassName("");
    setMembershipStatus("");
    setErrorMessage("");

    if (!user) {
      setErrorMessage("Sınıfa katılmak için giriş yapmanız gerekir.");
      setLoading(false);
      return;
    }

    if (!classCode.trim()) {
      setErrorMessage("Lütfen öğretmeninizin verdiği sınıf kodunu girin.");
      setLoading(false);
      return;
    }

    try {
      const result = await createStudentJoinRequest({
        studentAuthId: user.id,
        classCode,
      });

      setSuccessMessage(result.message);
      setCreatedClassName(result.class?.className || "");
      setMembershipStatus(result.membership.status);
      setClassCode("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Katılım isteği oluşturulamadı.",
      );
    }

    setLoading(false);
  }

  return (
    <DashboardShell
      title="Sınıfa Katıl"
      description="Öğretmeninizin verdiği sınıf kodunu girerek sınıfa katılım isteği gönderin."
      activePage="join"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <BsClipboardData className="text-xl" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Sınıf Kodu ile Katılım
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Kod örneği: AS-T9HJGM. Öğretmen onayı açıksa isteğiniz önce
                bekleme listesine düşer.
              </p>
            </div>
          </div>

          <form onSubmit={handleJoinClass} className="space-y-6">
            <div>
              <label
                htmlFor="classCode"
                className="text-sm font-medium text-slate-700"
              >
                Sınıf Katılım Kodu
              </label>

              <input
                id="classCode"
                type="text"
                value={classCode}
                onChange={(event) => setClassCode(event.target.value)}
                placeholder="AS-T9HJGM"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 font-mono text-lg font-bold tracking-wider outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                    <BsCheckCircle className="text-xl" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      İşlem başarılı
                    </p>

                    <h3 className="mt-1 text-2xl font-bold text-emerald-950">
                      {createdClassName || "Sınıf kaydı"}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-emerald-900">
                      {successMessage}
                    </p>

                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        Üyelik Durumu
                      </p>
                      <p className="mt-2 text-lg font-bold text-slate-950">
                        {membershipStatus}
                      </p>
                    </div>

                    <Link
                      href="/student/classes"
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                    >
                      Sınıflarıma Git
                      <BsArrowRight />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BsClipboardData />
              {loading ? "İstek gönderiliyor..." : "Katılım İsteği Gönder"}
            </button>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700">
              <BsInfoCircle className="text-xl" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-blue-950">
              Onay süreci nasıl çalışır?
            </h2>

            <p className="mt-3 text-sm leading-7 text-blue-900">
              Öğretmeniniz onay sistemini açtıysa, kodu girdikten sonra sınıfa
              hemen eklenmezsiniz. Katılım isteğiniz öğretmenin paneline düşer.
              Öğretmen onayladığında sınıf Sınıflarım ekranında aktif görünür.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Airtable kayıt akışı
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">
                  Davet_Kodlari
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Girilen kod burada kontrol edilir.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">
                  Sinif_Uyelikleri
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Katılım isteği Onay Bekliyor olarak kaydedilir.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}