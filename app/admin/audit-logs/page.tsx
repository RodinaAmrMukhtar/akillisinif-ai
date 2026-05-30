"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";

type AuditLog = {
  id: string;
  title: string;
  userName: string;
  operationType: string;
  tableName: string;
  recordId: string;
  oldValue: string;
  newValue: string;
  ipAddress: string;
  description: string;
  actionDate: string;
};

function getOperationClass(type: string) {
  const value = type.toLowerCase();

  if (value.includes("hata") || value.includes("uyari") || value.includes("uyarı")) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (value.includes("veri") || value.includes("kalite")) {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }

  if (value.includes("ai") || value.includes("otomasyon")) {
    return "border-violet-200 bg-violet-50 text-violet-700";
  }

  if (value.includes("olustur") || value.includes("oluştur") || value.includes("create")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-700";
}

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

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    async function loadLogs() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch("/api/airtable/audit-logs/list", {
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok || !result.ok) {
          throw new Error(result.message || "Denetim kayıtları alınamadı.");
        }

        setLogs(result.logs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
      } finally {
        setLoading(false);
      }
    }

    loadLogs();
  }, []);

  const stats = useMemo(() => {
    const dataQuality = logs.filter((log) => {
      const value = `${log.operationType} ${log.title} ${log.description}`.toLowerCase();
      return value.includes("veri") || value.includes("kalite") || value.includes("data");
    });

    const warnings = logs.filter((log) => {
      const value = `${log.operationType} ${log.title} ${log.description}`.toLowerCase();
      return (
        value.includes("uyari") ||
        value.includes("uyarı") ||
        value.includes("hata") ||
        value.includes("eksik")
      );
    });

    const automation = logs.filter((log) => {
      const value = `${log.operationType} ${log.title} ${log.description}`.toLowerCase();
      return value.includes("ai") || value.includes("otomasyon") || value.includes("workflow");
    });

    return {
      total: logs.length,
      dataQuality: dataQuality.length,
      warnings: warnings.length,
      automation: automation.length,
    };
  }, [logs]);

  const filteredLogs = useMemo(() => {
    if (filter === "all") return logs;

    if (filter === "dataQuality") {
      return logs.filter((log) => {
        const value = `${log.operationType} ${log.title} ${log.description}`.toLowerCase();
        return value.includes("veri") || value.includes("kalite") || value.includes("data");
      });
    }

    if (filter === "warnings") {
      return logs.filter((log) => {
        const value = `${log.operationType} ${log.title} ${log.description}`.toLowerCase();
        return (
          value.includes("uyari") ||
          value.includes("uyarı") ||
          value.includes("hata") ||
          value.includes("eksik")
        );
      });
    }

    if (filter === "automation") {
      return logs.filter((log) => {
        const value = `${log.operationType} ${log.title} ${log.description}`.toLowerCase();
        return value.includes("ai") || value.includes("otomasyon") || value.includes("workflow");
      });
    }

    return logs;
  }, [filter, logs]);

  return (
    <DashboardShell
      title="Denetim ve Veri Kalitesi"
      description="Sistem denetim kayıtları, otomasyon günlükleri ve veri kalite uyarıları."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          <button
            onClick={() => setFilter("all")}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-slate-500">Toplam Kayıt</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stats.total}</p>
          </button>

          <button
            onClick={() => setFilter("dataQuality")}
            className="rounded-3xl border border-orange-100 bg-orange-50 p-5 text-left shadow-sm transition hover:border-orange-300"
          >
            <p className="text-sm font-medium text-orange-600">Veri Kalitesi</p>
            <p className="mt-2 text-3xl font-bold text-orange-700">{stats.dataQuality}</p>
          </button>

          <button
            onClick={() => setFilter("warnings")}
            className="rounded-3xl border border-red-100 bg-red-50 p-5 text-left shadow-sm transition hover:border-red-300"
          >
            <p className="text-sm font-medium text-red-600">Uyarı/Hata</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{stats.warnings}</p>
          </button>

          <button
            onClick={() => setFilter("automation")}
            className="rounded-3xl border border-violet-100 bg-violet-50 p-5 text-left shadow-sm transition hover:border-violet-300"
          >
            <p className="text-sm font-medium text-violet-600">Otomasyon</p>
            <p className="mt-2 text-3xl font-bold text-violet-700">{stats.automation}</p>
          </button>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Denetim kayıtları yükleniyor...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-700 shadow-sm">
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Bu filtrede gösterilecek denetim kaydı bulunmuyor.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredLogs.map((log) => (
              <article
                key={log.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {log.tableName || "Sistem"}  {formatDate(log.actionDate)}
                    </p>
                    <h2 className="mt-2 text-xl font-bold text-slate-950">
                      {log.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Kullanıcı: {log.userName}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1 text-sm font-semibold ${getOperationClass(
                      log.operationType,
                    )}`}
                  >
                    {log.operationType || "İşlem"}
                  </span>
                </div>

                <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                  <h3 className="font-bold text-slate-950">Açıklama</h3>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                    {log.description || "Açıklama yok."}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Tablo
                    </p>
                    <p className="mt-2 break-words font-semibold text-slate-900">
                      {log.tableName || "Yok"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Kayıt ID
                    </p>
                    <p className="mt-2 break-words font-semibold text-slate-900">
                      {log.recordId || "Yok"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      IP Adresi
                    </p>
                    <p className="mt-2 break-words font-semibold text-slate-900">
                      {log.ipAddress || "Yok"}
                    </p>
                  </div>
                </div>

                {(log.oldValue || log.newValue) ? (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <h3 className="font-bold text-slate-950">Eski Değer</h3>
                      <p className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {log.oldValue || "Yok"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <h3 className="font-bold text-slate-950">Yeni Değer</h3>
                      <p className="mt-3 max-h-52 overflow-auto whitespace-pre-wrap text-sm leading-7 text-slate-700">
                        {log.newValue || "Yok"}
                      </p>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
