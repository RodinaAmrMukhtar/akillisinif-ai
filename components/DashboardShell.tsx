"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import type { IconType } from "react-icons";
import {
  BsActivity,
  BsBell,
  BsBook,
  BsBoxArrowRight,
  BsCalendarCheck,
  BsCardChecklist,
  BsChatDots,
  BsClipboardData,
  BsCollection,
  BsCpu,
  BsGrid1X2,
  BsHouseDoor,
  BsJournalText,
  BsPersonCheck,
  BsPlusSquare,
  BsShieldCheck,
} from "react-icons/bs";
import { supabase } from "@/lib/supabaseClient";

type DashboardShellProps = {
  children: ReactNode;
  title: string;
  description: string;
  activePage?: string;
};

type MenuItem = {
  label: string;
  href: string;
  key: string;
  icon: IconType;
};

type UserRole = "Ogretmen" | "Ogrenci" | "Unknown";

const teacherMenuItems: MenuItem[] = [
  {
    label: "Genel Bakış",
    href: "/dashboard",
    key: "dashboard",
    icon: BsGrid1X2,
  },
  {
    label: "Sınıflar",
    href: "/teacher/classes",
    key: "classes",
    icon: BsCollection,
  },
  {
    label: "Yeni Sınıf",
    href: "/teacher/classes/new",
    key: "new-class",
    icon: BsPlusSquare,
  },
  {
    label: "Katılım İstekleri",
    href: "/teacher/join-requests",
    key: "requests",
    icon: BsPersonCheck,
  },
  {
    label: "Ödevler",
    href: "/teacher/assignments",
    key: "assignments",
    icon: BsCardChecklist,
  },
  {
    label: "Notlar",
    href: "/teacher/grades",
    key: "grades",
    icon: BsJournalText,
  },
  {
    label: "Yoklama",
    href: "/teacher/attendance",
    key: "attendance",
    icon: BsCalendarCheck,
  },
  {
    label: "AI Risk Analizi",
    href: "/teacher/risk-analysis",
    key: "risk",
    icon: BsActivity,
  },
  {
    label: "Haftalık Raporlar",
    href: "/teacher/weekly-reports",
    key: "weekly-reports",
    icon: BsClipboardData,
  },
  {
    label: "Mesajlar",
    href: "/teacher/chat",
    key: "teacher-chat",
    icon: BsChatDots,
  },
  {
    label: "AI Asistan",
    href: "/teacher/ai-assistant",
    key: "teacher-ai",
    icon: BsCpu,
  },
{ key: "risk-signals", label: "Risk Sinyalleri", href: "/teacher/risk-signals", icon: BsCpu },
{ key: "intervention-plans", label: "Müdahale Planları", href: "/teacher/intervention-plans", icon: BsCpu },
{ key: "reports", label: "AI Raporları", href: "/teacher/reports", icon: BsCpu },
{ key: "audit-logs", label: "Denetim Kayıtları", href: "/admin/audit-logs", icon: BsCpu },
{ key: "predictions", label: "AI Tahminleri", href: "/teacher/predictions", icon: BsCpu },
];

const studentMenuItems: MenuItem[] = [
  {
    label: "Sınıflarım",
    href: "/student/classes",
    key: "student-classes",
    icon: BsBook,
  },
  {
    label: "Sınıfa Katıl",
    href: "/student/join-class",
    key: "join",
    icon: BsClipboardData,
  },
  {
    label: "Yoklama",
    href: "/student/attendance",
    key: "student-attendance",
    icon: BsCalendarCheck,
  },
  {
    label: "Ödevler",
    href: "/student/assignments",
    key: "student-assignments",
    icon: BsCardChecklist,
  },
  {
    label: "Notlarım",
    href: "/student/grades",
    key: "student-grades",
    icon: BsClipboardData,
  },
  { key: "student-homework", label: "?devlerim", href: "/student/homework", icon: BsClipboardData },



  {
    label: "Mesajlar",
    href: "/student/chat",
    key: "student-chat",
    icon: BsChatDots,
  },
  {
    label: "AI Asistan",
    href: "/student/ai-assistant",
    key: "student-ai",
    icon: BsCpu,
  },
];

const systemMenuItems: MenuItem[] = [
  {
    label: "Bildirimler",
    href: "/notifications",
    key: "notifications",
    icon: BsBell,
  },
];

function getDisplayName(user: User | null) {
  if (!user) return "Demo Kullanıcı";

  return (
    user.user_metadata?.ad_soyad ||
    user.user_metadata?.full_name ||
    user.email ||
    "Kullanıcı"
  );
}

function getUserRole(user: User | null): UserRole {
  const role = user?.user_metadata?.rol;

  if (role === "Ogretmen") return "Ogretmen";
  if (role === "Ogrenci") return "Ogrenci";

  return "Unknown";
}

function getRoleLabel(role: UserRole) {
  if (role === "Ogretmen") return "Öğretmen";
  if (role === "Ogrenci") return "Öğrenci";

  return "Ön izleme modu";
}

function getRoleDescription(role: UserRole) {
  if (role === "Ogretmen") {
    return "Sınıf yönetimi ve erken uyarı paneli";
  }

  if (role === "Ogrenci") {
    return "Öğrenci öğrenme ve takip paneli";
  }

  return "Rol bilgisi bekleniyor";
}

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "AS";

  const first = parts[0]?.charAt(0) || "";
  const second =
    parts.length > 1 ? parts[parts.length - 1]?.charAt(0) || "" : "";

  return `${first}${second}`.toLocaleUpperCase("tr-TR");
}

function getMainMenu(role: UserRole) {
  if (role === "Ogrenci") {
    return {
      title: "Öğrenci Menüsü",
      items: studentMenuItems,
    };
  }

  if (role === "Ogretmen") {
    return {
      title: "Öğretmen Menüsü",
      items: teacherMenuItems,
    };
  }

  return {
    title: "Panel Menüsü",
    items: [
      {
        label: "Genel Bakış",
        href: "/dashboard",
        key: "dashboard",
        icon: BsGrid1X2,
      },
    ],
  };
}

function isTeacherOnlyPath(pathname: string) {
  return pathname === "/dashboard" || pathname.startsWith("/teacher");
}

function isStudentOnlyPath(pathname: string) {
  return pathname.startsWith("/student");
}

function MenuSection({
  title,
  items,
  activePage,
  unreadNotificationCount = 0,
}: {
  title: string;
  items: MenuItem[];
  activePage: string;
  unreadNotificationCount?: number;
}) {
  return (
    <div>
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = activePage === item.key;
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon className="shrink-0 text-base" />
              <span>{item.label}</span>
              {item.key === "notifications" && unreadNotificationCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1.5 text-[11px] font-bold text-white">
                  {unreadNotificationCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DashboardShell({
  children,
  title,
  description,
  activePage = "dashboard",
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [accessChecked, setAccessChecked] = useState(false);

  const role = getUserRole(user);
  const roleLabel = getRoleLabel(role);
  const roleDescription = getRoleDescription(role);
  const displayName = getDisplayName(user);
  const initials = getInitials(displayName);
  const email = user?.email || "demo@akillisinif.ai";
  const mainMenu = getMainMenu(role);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

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

  useEffect(() => {
    if (loadingUser) return;

    if (!user) {
      router.push("/login");
      return;
    }

    if (role === "Ogrenci" && isTeacherOnlyPath(pathname)) {
      router.push("/yetkisiz-erisim");
      return;
    }

    if (role === "Ogretmen" && isStudentOnlyPath(pathname)) {
      router.push("/yetkisiz-erisim");
      return;
    }

    setAccessChecked(true);
  }, [loadingUser, pathname, role, router, user]);

  async function handleLogout() {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/logout");
    router.refresh();
  }

  if (loadingUser || !accessChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
            <BsShieldCheck className="text-2xl" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-slate-950">
            Oturum kontrol ediliyor
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Kullanıcı rolü ve sayfa erişim yetkisi doğrulanıyor.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-50 text-slate-950">
      <aside className="flex w-[292px] shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-lg font-bold text-white shadow-sm">
              AS
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight text-slate-950">
                AkıllıSınıf AI
              </p>
              <p className="truncate text-xs text-slate-500">
                Eğitim Yönetim Paneli
              </p>
            </div>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <Link
            href="/profile"
            className="mb-6 block rounded-2xl border border-blue-100 bg-blue-50 p-4 transition hover:bg-blue-100"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white shadow-sm">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-blue-950">
                  {displayName}
                </p>
                <p className="truncate text-xs font-medium text-blue-700">
                  {roleLabel}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-white/70 p-3">
              <p className="truncate text-xs text-blue-900">{email}</p>
              <p className="mt-1 text-xs leading-5 text-blue-800">
                {roleDescription}
              </p>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-xs font-semibold text-emerald-700">
              <BsShieldCheck />
              Rol doğrulaması yapıldı
            </div>
          </Link>

          <div className="space-y-7">
            <MenuSection
              title={mainMenu.title}
              items={mainMenu.items}
              activePage={activePage}
              unreadNotificationCount={0}
            />

            <MenuSection
              title="Sistem"
              items={systemMenuItems}
              activePage={activePage}
              unreadNotificationCount={unreadNotificationCount}
            />
          </div>
        </div>

        <div className="space-y-2 border-t border-slate-200 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <BsHouseDoor className="shrink-0 text-base" />
            <span>Ana Sayfaya Dön</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
          >
            <BsBoxArrowRight className="shrink-0 text-base" />
            <span>Çıkış Yap</span>
          </button>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex min-h-[92px] items-center justify-between gap-6 px-8 py-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {title}
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/notifications"
                className="relative rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 transition hover:bg-blue-100"
              >
                Bildirim Merkezi
                {unreadNotificationCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-700 px-1.5 text-[11px] font-bold text-white">
                    {unreadNotificationCount}
                  </span>
                ) : null}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </header>

        <div className="px-8 py-8">{children}</div>
      </section>
    </main>
  );
}

