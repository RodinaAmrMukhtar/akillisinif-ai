"use client";

import DashboardShell from "@/components/DashboardShell";
import { useEffect, useMemo, useState } from "react";
import {
  BsBell,
  BsCheck2Circle,
  BsEnvelope,
  BsExclamationTriangle,
  BsInfoCircle,
} from "react-icons/bs";
import { supabase } from "@/lib/supabaseClient";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationIdentity,
} from "@/lib/notificationsApi";

function getUserName(user: any) {
  return (
    user?.user_metadata?.ad_soyad ||
    user?.user_metadata?.full_name ||
    ""
  );
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function importanceClass(importance: string) {
  const normalized = importance.toLowerCase();

  if (normalized.includes("yüksek") || normalized.includes("kritik")) {
    return "border-red-200 bg-red-50 text-red-800";
  }

  if (normalized.includes("orta")) {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-800";
}

export default function NotificationsPage() {
  const [identity, setIdentity] = useState<NotificationIdentity | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadNotifications(currentIdentity?: NotificationIdentity) {
    const usedIdentity = currentIdentity || identity;

    if (!usedIdentity) return;

    try {
      setIsLoading(true);
      setErrorMessage("");

      const data = await getNotifications(usedIdentity);

      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Bildirimler yüklenemedi.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("Bildirimleri görmek için giriş yapmalısınız.");
        }

        const currentIdentity = {
          authId: user.id,
          email: user.email || "",
          name: getUserName(user),
        };

        setIdentity(currentIdentity);
        await loadNotifications(currentIdentity);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Bildirimler yüklenemedi.",
        );
        setIsLoading(false);
      }
    }

    init();
  }, []);

  const readCount = useMemo(() => {
    return notifications.filter((notification) => notification.isRead).length;
  }, [notifications]);

  async function handleMarkRead(notificationId: string) {
    if (!identity) return;

    try {
      setActionLoadingId(notificationId);
      await markNotificationRead({
        ...identity,
        notificationId,
      });
      await loadNotifications(identity);
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Bildirim okundu olarak işaretlenemedi.",
      );
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleMarkAllRead() {
    if (!identity) return;

    try {
      setActionLoadingId("all");
      await markAllNotificationsRead(identity);
      await loadNotifications(identity);
      window.dispatchEvent(new Event("notifications-updated"));
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Bildirimler okundu olarak işaretlenemedi.",
      );
    } finally {
      setActionLoadingId("");
    }
  }

  return (
    <DashboardShell
      activePage="notifications"
      pageTitle="Bildirim Merkezi"
      pageDescription="Sistem bildirimleri, ödev hatırlatmaları ve erken uyarılar"
    >
      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                AkıllıSınıf AI
              </p>
              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                Bildirim Merkezi
              </h1>
              <p className="mt-3 max-w-3xl text-slate-600">
                n8n otomasyonları ve sistem uyarıları tarafından oluşturulan
                gerçek bildirimler burada listelenir.
              </p>
            </div>

            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0 || actionLoadingId === "all"}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <BsCheck2Circle />
              Tümünü okundu yap
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500">
              <BsBell />
              <span className="text-sm font-medium">Toplam Bildirim</span>
            </div>
            <p className="mt-3 text-3xl font-bold">{notifications.length}</p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <div className="flex items-center gap-3 text-blue-700">
              <BsInfoCircle />
              <span className="text-sm font-medium">Okunmamış</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-blue-950">
              {unreadCount}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <div className="flex items-center gap-3 text-emerald-700">
              <BsCheck2Circle />
              <span className="text-sm font-medium">Okunmuş</span>
            </div>
            <p className="mt-3 text-3xl font-bold text-emerald-950">
              {readCount}
            </p>
          </div>
        </section>

        {isLoading ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-slate-600">Bildirimler yükleniyor...</p>
          </section>
        ) : errorMessage ? (
          <section className="rounded-[2rem] border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            <p className="font-semibold">Bildirimler yüklenemedi.</p>
            <p className="mt-2">{errorMessage}</p>
          </section>
        ) : notifications.length === 0 ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <BsBell className="text-4xl text-slate-400" />
            <h2 className="mt-4 text-xl font-semibold text-slate-950">
              Henüz bildirim yok
            </h2>
            <p className="mt-2 text-slate-600">
              n8n otomasyonları veya sistem uyarıları bildirim oluşturduğunda
              burada görünecek.
            </p>
          </section>
        ) : (
          <section className="space-y-4">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-[2rem] border p-6 shadow-sm transition ${
                  notification.isRead
                    ? "border-slate-200 bg-white"
                    : "border-blue-200 bg-blue-50/60"
                }`}
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!notification.isRead ? (
                        <span className="rounded-full bg-blue-700 px-3 py-1 text-xs font-semibold text-white">
                          Yeni
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Okundu
                        </span>
                      )}

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${importanceClass(
                          notification.importance,
                        )}`}
                      >
                        {notification.importance || "Normal"}
                      </span>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                        {notification.type || "Sistem"}
                      </span>

                      {notification.channel ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          <BsEnvelope />
                          {notification.channel}
                        </span>
                      ) : null}
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-slate-950">
                      {notification.title || "Bildirim"}
                    </h2>

                    <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                      {notification.message}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                      <span>Sınıf: {notification.className}</span>
                      <span>Oluşturulma: {formatDate(notification.createdAt)}</span>
                      {notification.readAt ? (
                        <span>Okunma: {formatDate(notification.readAt)}</span>
                      ) : null}
                    </div>
                  </div>

                  {!notification.isRead ? (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notification.id)}
                      disabled={actionLoadingId === notification.id}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <BsCheck2Circle />
                      Okundu olarak işaretle
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
