
"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string;
  relatedTable: string;
  relatedRecordId: string;
  createdAt: string;
};

function formatDate(value: string) {
  if (!value) return "Tarih yok";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getTypeClass(type: string) {
  const value = type.toLowerCase();

  if (value.includes("risk") || value.includes("uyar?") || value.includes("uyari")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value.includes("not")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (value.includes("?dev") || value.includes("odev")) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (value.includes("yoklama") || value.includes("devams?zl?k") || value.includes("devamsizlik")) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (value.includes("kat?l?m") || value.includes("katilim")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("unread");

  async function loadNotifications() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const email = user?.email || "";

      const response = await fetch(
        `/api/airtable/notifications/list?email=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Bildirimler al?namad?.");
      }

      setNotifications(result.notifications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata olu?tu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const stats = useMemo(() => {
    return {
      total: notifications.length,
      unread: notifications.filter((item) => !item.read).length,
      read: notifications.filter((item) => item.read).length,
    };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "read") return notifications.filter((item) => item.read);
    return notifications.filter((item) => !item.read);
  }, [filter, notifications]);

  async function markAsRead(notificationIds: string[]) {
    try {
      setMarking(true);
      setError("");

      if (notificationIds.length === 0) return;

      const response = await fetch("/api/airtable/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || result.error || "Bildirim g?ncellenemedi.");
      }

      await loadNotifications();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata olu?tu.");
    } finally {
      setMarking(false);
    }
  }

  return (
    <DashboardShell
      title="Bildirimler"
      description="Sistem, sınıf, ödev, not, risk ve otomasyon bildirimlerini takip et."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <button
            onClick={() => setFilter("all")}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-slate-500">Toplam Bildirim</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stats.total}</p>
          </button>

          <button
            onClick={() => setFilter("unread")}
            className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-blue-600">Okunmamış</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.unread}</p>
          </button>

          <button
            onClick={() => setFilter("read")}
            className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-left shadow-sm transition hover:border-emerald-300"
          >
            <p className="text-sm font-medium text-emerald-600">Okundu</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.read}</p>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Bildirim Kutusu</h2>
            <p className="mt-1 text-sm text-slate-500">
              Seçili filtre: {filter === "all" ? "T?m?" : filter === "read" ? "Okundu" : "Okunmamış"}
            </p>
          </div>

          <button
            type="button"
            disabled={marking || stats.unread === 0}
            onClick={() =>
              markAsRead(notifications.filter((item) => !item.read).map((item) => item.id))
            }
            className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tümünü Okundu Olarak İşaretle
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Bildirimler y?kleniyor...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            {error}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Bu filtrede g?sterilecek bildirim yok.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                className={`rounded-3xl border p-6 shadow-sm ${
                  notification.read
                    ? "border-slate-200 bg-white"
                    : "border-blue-200 bg-blue-50/50"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getTypeClass(
                          notification.type,
                        )}`}
                      >
                        {notification.type}
                      </span>

                      {!notification.read ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          Yeni
                        </span>
                      ) : (
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          Okundu
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-slate-950">
                      {notification.title}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>

                  {!notification.read ? (
                    <button
                      type="button"
                      disabled={marking}
                      onClick={() => markAsRead([notification.id])}
                      className="w-fit rounded-2xl border border-blue-200 bg-white px-4 py-2 text-sm font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Okundu Olarak İşaretle
                    </button>
                  ) : null}
                </div>

                <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                  {notification.message}
                </p>

                {(notification.relatedTable || notification.relatedRecordId) ? (
                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                    {notification.relatedTable ? (
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        Tablo: {notification.relatedTable}
                      </span>
                    ) : null}

                    {notification.relatedRecordId ? (
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1">
                        Kay?t: {notification.relatedRecordId}
                      </span>
                    ) : null}
                  </div>
                ) : null}

                {notification.link ? (
                  <a
                    href={notification.link}
                    className="mt-5 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                  >
                    ?lgili Sayfay? A?
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
