"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsArrowRight,
  BsBoxArrowRight,
  BsEnvelope,
  BsPersonBadge,
  BsShieldCheck,
} from "react-icons/bs";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

function getDisplayName(user: User | null) {
  if (!user) return "Kullanıcı";

  return (
    user.user_metadata?.ad_soyad ||
    user.user_metadata?.full_name ||
    user.email ||
    "Kullanıcı"
  );
}

function getRole(user: User | null) {
  const role = user?.user_metadata?.rol;

  if (role === "Ogretmen") return "Öğretmen";
  if (role === "Ogrenci") return "Öğrenci";

  return "Kullanıcı";
}

function getDashboardPath(user: User | null) {
  const role = user?.user_metadata?.rol;

  if (role === "Ogrenci") return "/student/classes";

  return "/dashboard";
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "AS";

  const first = parts[0]?.charAt(0) || "";
  const second =
    parts.length > 1 ? parts[parts.length - 1]?.charAt(0) || "" : "";

  return `${first}${second}`.toLocaleUpperCase("tr-TR");
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = getRole(user);
  const dashboardPath = getDashboardPath(user);
  const schoolNumber = user?.user_metadata?.okul_no || "Tanımlanmadı";

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        router.push("/login");
        return;
      }

      setUser(data.user);
      setLoadingUser(false);
    }

    loadUser();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/logout");
    router.refresh();
  }

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-950">
        <Navbar />

        <section className="mx-auto max-w-5xl px-6 py-16">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="h-8 w-52 animate-pulse rounded bg-slate-100" />
            <div className="mt-6 h-32 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
            Kullanıcı Profili
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
            Hesap ve rol bilgileri
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
            Bu sayfa Supabase kimlik doğrulama oturumundan gelen kullanıcı
            bilgilerini gösterir. Airtable bağlantısı eklendiğinde bu bilgiler
            Kullanicilar tablosuyla eşleştirilecektir.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-blue-700 text-3xl font-bold text-white shadow-sm">
              {initials}
            </div>

            <h2 className="mt-6 text-2xl font-bold text-slate-950">
              {displayName}
            </h2>

            <p className="mt-2 text-sm font-semibold text-blue-700">
              {roleLabel}
            </p>

            <p className="mt-3 break-all text-sm text-slate-500">
              {user?.email}
            </p>

            <div className="mt-8 grid gap-3">
              <Link
                href={dashboardPath}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Panelime Git
                <BsArrowRight />
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <BsBoxArrowRight />
                Çıkış Yap
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <BsPersonBadge className="text-xl" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    Profil Bilgileri
                  </h2>
                  <p className="text-sm text-slate-500">
                    Supabase kullanıcı metadata bilgileri
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Ad Soyad
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {displayName}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Rol
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {roleLabel}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Okul No
                  </p>
                  <p className="mt-2 text-sm font-semibold text-slate-950">
                    {schoolNumber}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Hesap Durumu
                  </p>
                  <p className="mt-2 text-sm font-semibold text-emerald-700">
                    Aktif
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-white p-3 text-blue-700">
                  <BsShieldCheck className="text-xl" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-blue-950">
                    Güvenlik ve oturum durumu
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-blue-900">
                    Supabase oturumu aktif. Rol doğrulaması yapılmıştır. Panel
                    erişimleri kullanıcı rolüne göre sınırlandırılır.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-slate-50 p-3 text-slate-700">
                  <BsEnvelope className="text-xl" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-950">
                    E-posta Bilgisi
                  </h2>
                  <p className="mt-2 break-all text-sm leading-7 text-slate-600">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}