"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { BsBoxArrowRight, BsGrid1X2, BsPersonCircle } from "react-icons/bs";
import { supabase } from "@/lib/supabaseClient";

function getDisplayName(user: User | null) {
  if (!user) return "";

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

  if (role === "Ogrenci") {
    return "/student/classes";
  }

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

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const displayName = getDisplayName(user);
  const roleLabel = getRole(user);
  const initials = getInitials(displayName);
  const dashboardPath = getDashboardPath(user);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      setLoadingUser(false);
    }

    loadUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoadingUser(false);
      },
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/logout");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-6 px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-lg font-bold text-white shadow-sm">
            AS
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight text-slate-950">
              AkıllıSınıf AI
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              Yapay zekâ destekli eğitim platformu
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <Link
            href="/"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
          >
            Ana Sayfa
          </Link>

          <Link
            href="/demo"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
          >
            Demo Akışı
          </Link>

          <Link
            href="/teacher/risk-analysis"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
          >
            AI Risk Analizi
          </Link>

          <Link
            href="/notifications"
            className="text-sm font-medium text-slate-600 transition hover:text-blue-700"
          >
            Bildirimler
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {loadingUser ? (
            <div className="h-11 w-44 animate-pulse rounded-2xl bg-slate-100" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <Link
                href={dashboardPath}
                className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 transition hover:bg-slate-100 md:flex"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white">
                  {initials}
                </div>

                <div className="min-w-0">
                  <p className="max-w-[150px] truncate text-sm font-semibold text-slate-950">
                    {displayName}
                  </p>
                  <p className="text-xs text-blue-700">{roleLabel}</p>
                </div>
              </Link>

              <Link
                href={dashboardPath}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                <BsGrid1X2 />
                Panel
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <BsBoxArrowRight />
                Çıkış
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="hidden rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:inline-flex"
              >
                Giriş Yap
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                <BsPersonCircle />
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}