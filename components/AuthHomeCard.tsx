"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BsArrowRight, BsShieldCheck } from "react-icons/bs";
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

function getPanelLabel(user: User | null) {
  const role = user?.user_metadata?.rol;

  if (role === "Ogrenci") return "Öğrenci Panelime Git";

  return "Öğretmen Panelime Git";
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "AS";

  const first = parts[0]?.charAt(0) || "";
  const second =
    parts.length > 1 ? parts[parts.length - 1]?.charAt(0) || "" : "";

  return `${first}${second}`.toLocaleUpperCase("tr-TR");
}

export default function AuthHomeCard() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const roleLabel = getRole(user);
  const dashboardPath = getDashboardPath(user);
  const panelLabel = getPanelLabel(user);

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

  if (loadingUser) {
    return (
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-4 w-72 animate-pulse rounded bg-slate-100" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="mt-8 rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-base font-bold text-white shadow-sm">
            {initials}
          </div>

          <div>
            <p className="text-sm font-semibold text-blue-700">
              Oturum açık
            </p>
            <h2 className="text-xl font-bold text-blue-950">
              Hoş geldiniz, {displayName}
            </h2>
            <p className="mt-1 text-sm text-blue-800">
              Rol: {roleLabel} · Supabase oturumu aktif
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/profile"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-50"
          >
            <BsShieldCheck />
            Profilim
          </Link>

          <Link
            href={dashboardPath}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            {panelLabel}
            <BsArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}