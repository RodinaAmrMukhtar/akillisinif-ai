"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BsArrowRight,
  BsBell,
  BsCalendarCheck,
  BsCardChecklist,
  BsCheckCircle,
  BsExclamationTriangle,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  getNotifications,
  type AppNotification,
  type NotificationsData,
} from "@/lib/notificationsApi";
import { supabase } from "@/lib/supabaseClient";

function priorityClass(priority: AppNotification["priority"]) {
  if (priority === "high") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "medium") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function notificationIcon(type: string) {
  if (type === "Ödev") return BsCardChecklist;
  if (type === "Yoklama") return BsCalendarCheck;
  if (type === "Not") return BsCheckCircle;
  if (type === "Katılım") return BsExclamationTriangle;
  return BsBell;
}

export default function NotificationsPage() {
  const [data, setData] = useState<NotificationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadNotifications() {
    setLoading(true);
    setErrorMessage("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      setLoading(false);
      return;
    }

    try {
      const result = await getNotifications(authData.user.id);
      setData(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Bildirimler yüklenemedi.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <DashboardShell
      title="Bildirimler"
      description="Airtable verilerinden oluşturulan gerçek akademik bildirimler."
      activePage="notifications"
    >
      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-8 w-56 animate-pulse rounded bg-slate-100" />
          <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100" />
        </div>
      )}

      {!loading && errorMessage && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700">
          {errorMessage}
        </div>
      )}

      {!loading && data && (
        <div className="space-y-8">
          <section className="grid gap-5 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsBell />
                <p className="text-sm font-semibold">Toplam Bildirim</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {data.summary.total}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Gerçek akademik verilerden üretildi.
              </p>
            </div>

            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 shadow-sm">
              <div className="flex items-center gap-3 text-red-600">
                <BsExclamationTriangle />
                <p className="text-sm font-semibold">Öncelikli Bildirim</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-red-700">
                {data.summary.highPriority}
              </p>
              <p className="mt-2 text-sm text-red-700">
                Bekleyen işlem veya yüksek öncelik taşıyan kayıtlar.
              </p>
            </div>
          </section>

          {data.notifications.length === 0 ? (
            <EmptyState
              icon={BsBell}
              title="Şu anda bildirim yok"
              description="Yeni ödev, teslim, yoklama veya katılım hareketi olduğunda burada görünecektir."
            />
          ) : (
            <section className="space-y-4">
              {data.notifications.map((notification) => {
                const Icon = notificationIcon(notification.type);

                return (
                  <Link
                    key={notification.id}
                    href={notification.href}
                    className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                          <Icon className="text-xl" />
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityClass(
                                notification.priority,
                              )}`}
                            >
                              {notification.priority === "high"
                                ? "Yüksek Öncelik"
                                : notification.priority === "medium"
                                  ? "Orta Öncelik"
                                  : "Bilgi"}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              {notification.type}
                            </span>
                          </div>

                          <h2 className="mt-4 text-xl font-bold text-slate-950">
                            {notification.title}
                          </h2>

                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {notification.description}
                          </p>

                          {notification.date && (
                            <p className="mt-2 text-xs font-semibold text-slate-400">
                              {notification.date}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700">
                        Aç
                        <BsArrowRight />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </section>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
