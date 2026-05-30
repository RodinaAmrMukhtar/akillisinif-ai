
"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";

type Attachment = {
  url: string;
  filename: string;
};

type Submission = {
  id: string;
  text: string;
  submittedAt: string;
  status: string;
  score: number | null;
  feedback: string;
  isLate: boolean;
  files: Attachment[];
};

type Assignment = {
  id: string;
  title: string;
  classId: string;
  className: string;
  description: string;
  dueDate: string;
  maxScore: number;
  assignmentType: string;
  difficulty: string;
  resourceLink: string;
  assignmentFiles: Attachment[];
  isPastDue: boolean;
  submission: Submission | null;
};

type DraftState = {
  submissionText: string;
  fileUrl: string;
  fileName: string;
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

function statusClass(assignment: Assignment) {
  if (assignment.submission?.status) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (assignment.isPastDue) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function statusText(assignment: Assignment) {
  if (assignment.submission?.status) {
    return assignment.submission.isLate ? "Ge? Teslim Edildi" : "Teslim Edildi";
  }

  if (assignment.isPastDue) {
    return "S?resi Ge?ti";
  }

  return "Bekliyor";
}

export default function StudentHomeworkPage() {
  const [studentName, setStudentName] = useState("??renci");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filter, setFilter] = useState("pending");

  async function loadAssignments() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const email = user?.email || "";

      const response = await fetch(
        `/api/airtable/student-homework/list?studentEmail=${encodeURIComponent(email)}`,
        {
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "?devler al?namad?.");
      }

      const nextAssignments: Assignment[] = result.assignments || [];

      setStudentName(result.studentName || "??renci");
      setAssignments(nextAssignments);

      const nextDrafts: Record<string, DraftState> = {};

      for (const assignment of nextAssignments) {
        nextDrafts[assignment.id] = {
          submissionText: assignment.submission?.text || "",
          fileUrl: assignment.submission?.files?.[0]?.url || "",
          fileName: assignment.submission?.files?.[0]?.filename || "",
        };
      }

      setDrafts(nextDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata olu?tu.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  const stats = useMemo(() => {
    return {
      total: assignments.length,
      submitted: assignments.filter((assignment) => assignment.submission).length,
      pending: assignments.filter((assignment) => !assignment.submission && !assignment.isPastDue).length,
      overdue: assignments.filter((assignment) => !assignment.submission && assignment.isPastDue).length,
    };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (filter === "all") return assignments;
    if (filter === "submitted") return assignments.filter((assignment) => assignment.submission);
    if (filter === "overdue") {
      return assignments.filter((assignment) => !assignment.submission && assignment.isPastDue);
    }

    return assignments.filter((assignment) => !assignment.submission && !assignment.isPastDue);
  }, [assignments, filter]);

  function updateDraft(assignmentId: string, field: keyof DraftState, value: string) {
    setDrafts((current) => ({
      ...current,
      [assignmentId]: {
        submissionText: current[assignmentId]?.submissionText || "",
        fileUrl: current[assignmentId]?.fileUrl || "",
        fileName: current[assignmentId]?.fileName || "",
        [field]: value,
      },
    }));
  }

  async function submitAssignment(assignment: Assignment) {
    try {
      setSavingId(assignment.id);
      setError("");
      setSuccess("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const draft = drafts[assignment.id] || {
        submissionText: "",
        fileUrl: "",
        fileName: "",
      };

      const response = await fetch("/api/airtable/student-homework/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentEmail: user?.email || "",
          assignmentId: assignment.id,
          submissionText: draft.submissionText,
          fileUrl: draft.fileUrl,
          fileName: draft.fileName,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || result.error || "?dev teslim edilemedi.");
      }

      setSuccess(result.message || "?dev teslim edildi.");
      await loadAssignments();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata olu?tu.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <DashboardShell
      title="?devlerim"
      description="Sana atanan ?devleri g?r?nt?le, teslim metni yaz ve dosya ba?lant?s? ekle."
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            ??renci ?dev Paneli
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">{studentName}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            ?dev tesliminde metin yazabilir ve herkese a??k bir dosya ba?lant?s? ekleyebilirsin.
            Teslimlerin ??retmen panelindeki teslimatlar ekran?nda g?r?n?r.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <button
            onClick={() => setFilter("all")}
            className="rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-slate-500">Toplam ?dev</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stats.total}</p>
          </button>

          <button
            onClick={() => setFilter("pending")}
            className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-left shadow-sm transition hover:border-blue-300"
          >
            <p className="text-sm font-medium text-blue-600">Bekleyen</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.pending}</p>
          </button>

          <button
            onClick={() => setFilter("submitted")}
            className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 text-left shadow-sm transition hover:border-emerald-300"
          >
            <p className="text-sm font-medium text-emerald-600">Teslim Edilen</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.submitted}</p>
          </button>

          <button
            onClick={() => setFilter("overdue")}
            className="rounded-3xl border border-red-100 bg-red-50 p-5 text-left shadow-sm transition hover:border-red-300"
          >
            <p className="text-sm font-medium text-red-600">S?resi Ge?en</p>
            <p className="mt-2 text-3xl font-bold text-red-700">{stats.overdue}</p>
          </button>
        </div>

        {success ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            ?devler y?kleniyor...
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Bu filtrede g?sterilecek ?dev yok.
          </div>
        ) : (
          <div className="space-y-5">
            {filteredAssignments.map((assignment) => {
              const draft = drafts[assignment.id] || {
                submissionText: "",
                fileUrl: "",
                fileName: "",
              };

              return (
                <article
                  key={assignment.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                        {assignment.className}
                      </p>
                      <h2 className="mt-2 text-xl font-bold text-slate-950">
                        {assignment.title}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Teslim tarihi: {formatDate(assignment.dueDate)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1 text-sm font-semibold ${statusClass(
                        assignment,
                      )}`}
                    >
                      {statusText(assignment)}
                    </span>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                    <h3 className="font-bold text-slate-950">?dev A??klamas?</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
                      {assignment.description || "A??klama yok."}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                        T?r: {assignment.assignmentType || "Belirtilmedi"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                        Zorluk: {assignment.difficulty || "Belirtilmedi"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-600">
                        Puan: {assignment.maxScore || 100}
                      </span>
                    </div>

                    {assignment.resourceLink ? (
                      <a
                        href={assignment.resourceLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
                      >
                        Kaynak Linkini A?
                      </a>
                    ) : null}
                  </div>

                  {assignment.submission ? (
                    <div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
                      <h3 className="font-bold text-emerald-800">Mevcut Teslimin</h3>
                      <p className="mt-2 text-sm text-emerald-700">
                        Teslim tarihi: {formatDate(assignment.submission.submittedAt)}
                      </p>

                      {assignment.submission.text ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-emerald-800">
                          {assignment.submission.text}
                        </p>
                      ) : null}

                      {assignment.submission.score !== null ? (
                        <p className="mt-3 text-sm font-semibold text-emerald-800">
                          Puan: {assignment.submission.score}
                        </p>
                      ) : null}

                      {assignment.submission.feedback ? (
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-emerald-800">
                          ??retmen geri bildirimi: {assignment.submission.feedback}
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div className="mt-5 rounded-2xl border border-slate-100 bg-white p-5">
                    <h3 className="font-bold text-slate-950">
                      {assignment.submission ? "Teslimi G?ncelle" : "?devi Teslim Et"}
                    </h3>

                    <label className="mt-4 block space-y-2">
                      <span className="text-sm font-semibold text-slate-700">Teslim Metni</span>
                      <textarea
                        rows={5}
                        value={draft.submissionText}
                        onChange={(event) =>
                          updateDraft(assignment.id, "submissionText", event.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                        placeholder="?dev cevab?n? veya a??klaman? buraya yaz."
                      />
                    </label>

                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Dosya Ba?lant?s?
                        </span>
                        <input
                          value={draft.fileUrl}
                          onChange={(event) =>
                            updateDraft(assignment.id, "fileUrl", event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                          placeholder="https://..."
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Dosya Ad?
                        </span>
                        <input
                          value={draft.fileName}
                          onChange={(event) =>
                            updateDraft(assignment.id, "fileName", event.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                          placeholder="odev.pdf"
                        />
                      </label>
                    </div>

                    <button
                      type="button"
                      disabled={savingId === assignment.id}
                      onClick={() => submitAssignment(assignment)}
                      className="mt-5 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {savingId === assignment.id
                        ? "Kaydediliyor..."
                        : assignment.submission
                          ? "Teslimi G?ncelle"
                          : "?devi Teslim Et"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
