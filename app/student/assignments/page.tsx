"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsArrowRight,
  BsCardChecklist,
  BsCheckCircle,
  BsClock,
  BsSend,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  listStudentAssignments,
  submitAssignment,
  type StudentAssignment,
} from "@/lib/assignmentsApi";
import { supabase } from "@/lib/supabaseClient";

export default function StudentAssignmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [openAssignmentId, setOpenAssignmentId] = useState("");
  const [submissionText, setSubmissionText] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadAssignments() {
    setLoading(true);
    setErrorMessage("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setLoading(false);
      return;
    }

    setUser(data.user);

    try {
      const studentAssignments = await listStudentAssignments(data.user.id);
      setAssignments(studentAssignments);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Ödevler yüklenemedi.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  async function handleSubmitAssignment(
    event: FormEvent<HTMLFormElement>,
    assignmentId: string,
  ) {
    event.preventDefault();

    if (!user) return;

    setSubmittingId(assignmentId);
    setSuccessMessage("");
    setErrorMessage("");

    if (!submissionText.trim()) {
      setErrorMessage("Lütfen teslim metni yazın.");
      setSubmittingId("");
      return;
    }

    try {
      await submitAssignment({
        studentAuthId: user.id,
        assignmentId,
        submissionText,
      });

      setSuccessMessage("Ödev tesliminiz Airtable Odev_Teslimleri tablosuna kaydedildi.");
      setSubmissionText("");
      setOpenAssignmentId("");

      await loadAssignments();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Ödev teslim edilemedi.",
      );
    }

    setSubmittingId("");
  }

  return (
    <DashboardShell
      title="Ödevlerim"
      description="Aktif sınıflarınıza ait gerçek ödevleri görüntüleyin ve teslim gönderin."
      activePage="student-assignments"
    >
      {loading && (
        <div className="grid gap-5 lg:grid-cols-2">
          {[1, 2].map((item) => (
            <div
              key={item}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="h-5 w-40 animate-pulse rounded bg-slate-100" />
              <div className="mt-5 h-8 w-56 animate-pulse rounded bg-slate-100" />
              <div className="mt-4 h-4 w-full animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {!loading && errorMessage && (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700">
          {errorMessage}
        </div>
      )}

      {!loading && successMessage && (
        <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-700">
          {successMessage}
        </div>
      )}

      {!loading && assignments.length === 0 && !errorMessage && (
        <EmptyState
          icon={BsCardChecklist}
          title="Henüz yayınlanmış ödev yok"
          description="Öğretmeniniz aktif sınıfınıza ödev yayınladığında burada görünecektir."
          primaryActionLabel="Sınıflarıma Git"
          primaryActionHref="/student/classes"
        />
      )}

      {!loading && assignments.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-2">
          {assignments.map((assignment) => {
            const submitted = Boolean(assignment.submission);
            const isOpen = openAssignmentId === assignment.id;

            return (
              <article
                key={assignment.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        submitted
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {submitted ? assignment.submission?.status : "Teslim Bekliyor"}
                    </span>

                    <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                      {assignment.title}
                    </h2>

                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {assignment.className} · {assignment.courseName}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <BsCardChecklist className="text-xl" />
                  </div>
                </div>

                {assignment.description && (
                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    {assignment.description}
                  </p>
                )}

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Teslim Tarihi
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {assignment.dueDate || "Yok"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Puan
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {assignment.maxPoints}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Zorluk
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-950">
                      {assignment.difficulty}
                    </p>
                  </div>
                </div>

                {assignment.submission && (
                  <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-start gap-3">
                      <BsCheckCircle className="mt-1 text-emerald-700" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-800">
                          Teslim kaydı mevcut
                        </p>
                        <p className="mt-2 text-sm leading-7 text-emerald-900">
                          {assignment.submission.text}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {assignment.resourceLink && (
                  <a
                    href={assignment.resourceLink}
                    target="_blank"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                  >
                    Kaynak Linkini Aç
                    <BsArrowRight />
                  </a>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setOpenAssignmentId(isOpen ? "" : assignment.id);
                      setSubmissionText(assignment.submission?.text || "");
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                  >
                    <BsSend />
                    {submitted ? "Teslimi Güncelle" : "Ödev Teslim Et"}
                  </button>
                </div>

                {isOpen && (
                  <form
                    onSubmit={(event) => handleSubmitAssignment(event, assignment.id)}
                    className="mt-6 space-y-4 rounded-3xl border border-blue-100 bg-blue-50 p-5"
                  >
                    <label className="text-sm font-semibold text-blue-950">
                      Teslim Metni
                    </label>

                    <textarea
                      value={submissionText}
                      onChange={(event) => setSubmissionText(event.target.value)}
                      rows={5}
                      placeholder="Ödev cevabınızı veya açıklamanızı buraya yazın."
                      className="w-full resize-none rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />

                    <button
                      type="submit"
                      disabled={submittingId === assignment.id}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <BsClock />
                      {submittingId === assignment.id
                        ? "Teslim kaydediliyor..."
                        : "Teslimi Kaydet"}
                    </button>
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </DashboardShell>
  );
}
