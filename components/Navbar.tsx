"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BsBell, BsBoxArrowRight, BsGrid1X2 } from "react-icons/bs";
import { supabase } from "@/lib/supabaseClient";

function getInitials(name?: string, email?: string) {
  const source = name?.trim() || email?.trim() || "Kullanıcı";

  return source
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function normalizeRole(role?: string) {
  if (role === "Öğrenci") return "Ogrenci";
  if (role === "Öğretmen") return "Ogretmen";
  return role || "";
}

function roleLabel(role?: string) {
  const normalized = normalizeRole(role);

  if (normalized === "Ogrenci") return "Öğrenci";
  if (normalized === "Ogretmen") return "Öğretmen";
  if (normalized === "Yonetici") return "Yönetici";

  return "Kullanıcı";
}

function panelHref(role?: string) {
  const normalized = normalizeRole(role);

  if (normalized === "Ogrenci") return "/student/classes";
  if (normalized === "Ogretmen") return "/dashboard";

  return "/dashboard";
}

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loadingUser, setLoadingUser] = useState(true);

  const displayName = useMemo(() => {
    return (
      user?.user_metadata?.ad_soyad ||
      user?.user_metadata?.full_name ||
      user?.email ||
      ""
    );
  }, [user]);

  const role = useMemo(() => {
    return normalizeRole(user?.user_metadata?.rol);
  }, [user]);

  async function loadNotifications(currentUser: User | null) {
    if (!currentUser) {
      setNotificationCount(0);
      return;
    }

    try {
      const response = await fetch(
        `/api/airtable/notifications/list?authId=${encodeURIComponent(
          currentUser.id,
        )}`,
      );

      const result = await response.json();

      if (response.ok && result.ok) {
        setNotificationCount(Number(result.summary?.total || 0));
      } else {
        setNotificationCount(0);
      }
    } catch {
      setNotificationCount(0);
    }
  }

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();

      setUser(data.user || null);
      await loadNotifications(data.user || null);
      setLoadingUser(false);
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user || null);
      await loadNotifications(session?.user || null);
      setLoadingUser(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-sm font-bold text-white shadow-sm">
            AS
          </div>

          <div>
            <p className="text-base font-bold tracking-tight text-slate-950">
              AkıllıSınıf AI
            </p>
            <p className="text-xs font-medium text-slate-500">
              Yapay Zekâ Destekli Sınıf Performans Sistemi
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/demo"
            className="rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Demo
          </Link>

          <Link
            href="/notifications"
            className="relative rounded-2xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            Bildirimler
            {user && notificationCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-700 px-2 text-xs font-bold text-white">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {loadingUser ? (
            <div className="h-10 w-32 animate-pulse rounded-2xl bg-slate-100" />
          ) : user ? (
            <>
              <Link
                href="/notifications"
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="Bildirimler"
              >
                <BsBell />
                {notificationCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1.5 text-[10px] font-bold text-white">
                    {notificationCount > 99 ? "99+" : notificationCount}
                  </span>
                )}
              </Link>

              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 lg:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-xs font-bold text-white">
                  {getInitials(displayName, user.email)}
                </div>

                <div className="min-w-0">
                  <p className="max-w-[170px] truncate text-sm font-bold text-slate-950">
                    {displayName}
                  </p>
                  <p className="text-xs font-medium text-slate-500">
                    {roleLabel(role)}
                  </p>
                </div>
              </div>

              <Link
                href={panelHref(role)}
                className="hidden items-center gap-2 rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 sm:inline-flex"
              >
                <BsGrid1X2 />
                Panel
              </Link>

              <Link
                href="/logout"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <BsBoxArrowRight />
                Çıkış
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-2xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Giriş
              </Link>

              <Link
                href="/register"
                className="rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
