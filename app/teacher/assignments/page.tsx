"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsArrowRight,
  BsCardChecklist,
  BsCheckCircle,
  BsEnvelope,
  BsPencilSquare,
  BsPlusSquare,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  createAssignment,
  gradeAssignmentSubmission,
  listTeacherAssignments,
  type TeacherAssignment,
} from "@/lib/assignmentsApi";
import { listTeacherClasses, type TeacherClass } from "@/lib/classesApi";
import { supabase } from "@/lib/supabaseClient";

function getTomorrowDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().split("T")[0];
}

type GradeInput = {
  score: string;
  feedback: string;
};

export default function TeacherAssignmentsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);

  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState(getTomorrowDate());
  const [maxPoints, setMaxPoints] = useState(100);
  const [assignmentType, setAssignmentType] = useState("Odev");
  const [difficulty, setDifficulty] = useState("Orta");
  const [resourceLink, setResourceLink] = useState("");

  const [gradeInputs, setGradeInputs] = useState<Record<string, GradeInput>>({});
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [gradingId, setGradingId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const hasClasses = classes.length > 0;

  const assignmentStats = useMemo(() => {
    return {
      total: assignments.length,
      published: assignments.filter((item) => item.status === "Yayinda").length,
      submitted: assignments.reduce((sum, item) => sum + item.submittedCount, 0),
      graded: assignments.reduce((sum, item) => sum + item.gradedCount, 0),
    };
  }, [assignments]);

  async function loadData() {
    setLoading(true);
    setErrorMessage("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setLoading(false);
      return;
    }

    setUser(data.user);

    try {
      const [teacherClasses, teacherAssignments] = await Promise.all([
        listTeacherClasses(data.user.id),
        listTeacherAssignments(data.user.id),
      ]);

      setClasses(teacherClasses);
      setAssignments(teacherAssignments);

      if (!classId && teacherClasses[0]) {
        setClassId(teacherClasses[0].id);
      }

      const nextGradeInputs: Record<string, GradeInput> = {};

      teacherAssignments.forEach((assignment) => {
        assignment.submissions.forEach((submission) => {
          nextGradeInputs[submission.id] = {
            score: submission.score === null ? "" : String(submission.score),
            feedback: submission.feedback || "",
          };
        });
      });

      setGradeInputs(nextGradeInputs);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ödev verileri yüklenemedi.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateAssignment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setCreating(true);
    setSuccessMessage("");
    setErrorMessage("");

    if (!classId || !title.trim() || !dueDate) {
      setErrorMessage("Lütfen sınıf, ödev başlığı ve teslim tarihi alanlarını doldurun.");
      setCreating(false);
      return;
    }

    try {
      await createAssignment({
        teacherAuthId: user.id,
        classId,
        title,
        description,
        dueDate,
        maxPoints,
        assignmentType,
        difficulty,
        resourceLink,
      });

      setSuccessMessage("Ödev başarıyla oluşturuldu ve Airtable Odevler tablosuna kaydedildi.");
      setTitle("");
      setDescription("");
      setDueDate(getTomorrowDate());
      setMaxPoints(100);
      setAssignmentType("Odev");
      setDifficulty("Orta");
      setResourceLink("");

      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Ödev oluşturulamadı.",
      );
    }

    setCreating(false);
  }

  async function handleGradeSubmission(
    event: FormEvent<HTMLFormElement>,
    submissionId: string,
  ) {
    event.preventDefault();

    if (!user) return;

    setGradingId(submissionId);
    setSuccessMessage("");
    setErrorMessage("");

    const input = gradeInputs[submissionId];

    if (!input || input.score.trim() === "") {
      setErrorMessage("Lütfen puan girin.");
      setGradingId("");
      return;
    }

    try {
      await gradeAssignmentSubmission({
        teacherAuthId: user.id,
        submissionId,
        score: Number(input.score),
        feedback: input.feedback,
      });

      setSuccessMessage("Teslim değerlendirildi ve Notlar tablosuna işlendi.");
      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Teslim değerlendirilemedi.",
      );
    }

    setGradingId("");
  }

  function updateGradeInput(submissionId: string, field: keyof GradeInput, value: string) {
    setGradeInputs((current) => ({
      ...current,
      [submissionId]: {
        score: current[submissionId]?.score || "",
        feedback: current[submissionId]?.feedback || "",
        [field]: value,
      },
    }));
  }

  return (
    <DashboardShell
      title="Ödevler"
      description=""
      activePage="assignments"
    >
      {loading && (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="h-8 w-56 animate-pulse rounded bg-slate-100" />
          <div className="mt-5 h-4 w-full animate-pulse rounded bg-slate-100" />
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

      {!loading && !hasClasses && (
        <EmptyState
          icon={BsCardChecklist}
          title="Ödev oluşturmak için önce sınıf gerekli"
          description="Ödevler Airtable Siniflar tablosundaki gerçek sınıflara bağlanır. Önce bir sınıf oluşturun, ardından bu ekrandan ödev yayınlayın."
          primaryActionLabel="Yeni Sınıf Oluştur"
          primaryActionHref="/teacher/classes/new"
        />
      )}

      {!loading && hasClasses && (
        <div className="space-y-8">
          <div className="grid gap-5 lg:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Toplam Ödev</p>
              <p className="mt-3 text-4xl font-bold text-slate-950">
                {assignmentStats.total}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Yayında</p>
              <p className="mt-3 text-4xl font-bold text-slate-950">
                {assignmentStats.published}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Teslim</p>
              <p className="mt-3 text-4xl font-bold text-slate-950">
                {assignmentStats.submitted}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-slate-500">Değerlendirilen</p>
              <p className="mt-3 text-4xl font-bold text-slate-950">
                {assignmentStats.graded}
              </p>
            </div>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <BsPlusSquare className="text-xl" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Yeni Ödev Yayınla
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Bu form Airtable Odevler tablosuna gerçek kayıt oluşturur.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Sınıf
                  </label>
                  <select
                    value={classId}
                    onChange={(event) => setClassId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    {classes.map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.className} - {classItem.courseName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Ödev Başlığı
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Kesirler Alıştırması"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Teslim Tarihi
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(event) => setDueDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Maksimum Puan
                  </label>
                  <input
                    type="number"
                    value={maxPoints}
                    min={1}
                    max={1000}
                    onChange={(event) => setMaxPoints(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Ödev Türü
                  </label>
                  <select
                    value={assignmentType}
                    onChange={(event) => setAssignmentType(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="Odev">Ödev</option>
                    <option value="Proje">Proje</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Performans">Performans</option>
                    <option value="Okuma">Okuma</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Zorluk Seviyesi
                  </label>
                  <select
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="Kolay">Kolay</option>
                    <option value="Orta">Orta</option>
                    <option value="Zor">Zor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Açıklama
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  placeholder="Öğrencilere ödev hakkında açıklama yazın."
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Kaynak Linki
                </label>
                <input
                  type="url"
                  value={resourceLink}
                  onChange={(event) => setResourceLink(event.target.value)}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <BsPlusSquare />
                {creating ? "Ödev oluşturuluyor..." : "Ödev Yayınla"}
              </button>
            </form>
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-950">
              Yayınlanan Ödevler ve Teslimler
            </h2>

            {assignments.length === 0 ? (
              <EmptyState
                icon={BsCardChecklist}
                title="Henüz ödev oluşturmadınız"
                description="İlk ödevinizi yayınladığınızda öğrenciler kendi panellerinde görebilecek ve teslim gönderebilecek."
              />
            ) : (
              <div className="space-y-6">
                {assignments.map((assignment) => (
                  <article
                    key={assignment.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {assignment.status}
                        </span>

                        <h3 className="mt-4 text-2xl font-bold tracking-tight text-slate-950">
                          {assignment.title}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {assignment.className}  {assignment.courseName}
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

                    <div className="mt-6 grid gap-3 sm:grid-cols-4">
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
                          Maksimum
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {assignment.maxPoints}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Teslim
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {assignment.submittedCount}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Değerlendirilen
                        </p>
                        <p className="mt-2 text-sm font-semibold text-slate-950">
                          {assignment.gradedCount}
                        </p>
                      </div>
                    </div>

                    {assignment.resourceLink && (
                      <Link
                        href={assignment.resourceLink}
                        target="_blank"
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 transition hover:text-blue-800"
                      >
                        Kaynak Linkini Aç
                        <BsArrowRight />
                      </Link>
                    )}

                    <div className="mt-8 border-t border-slate-200 pt-6">
                      <h4 className="text-lg font-bold text-slate-950">
                        Öğrenci Teslimleri
                      </h4>

                      {assignment.submissions.length === 0 ? (
                        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-7 text-slate-600">
                          Bu ödev için henüz öğrenci teslimi yok.
                        </div>
                      ) : (
                        <div className="mt-4 space-y-4">
                          {assignment.submissions.map((submission) => {
                            const input = gradeInputs[submission.id] || {
                              score: "",
                              feedback: "",
                            };

                            return (
                              <div
                                key={submission.id}
                                className="rounded-3xl border border-slate-200 bg-slate-50 p-5"
                              >
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <h5 className="text-lg font-bold text-slate-950">
                                        {submission.studentName}
                                      </h5>

                                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
                                        {submission.status}
                                      </span>

                                      {submission.late && (
                                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                          Geç Teslim
                                        </span>
                                      )}
                                    </div>

                                    <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                      <BsEnvelope />
                                      {submission.studentEmail || "E-posta yok"}
                                    </p>

                                    <p className="mt-3 rounded-2xl bg-white p-4 text-sm leading-7 text-slate-700">
                                      {submission.submissionText || "Teslim metni yok."}
                                    </p>
                                  </div>

                                  {submission.status === "Teslim Edildi" && (
                                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 lg:min-w-[220px]">
                                      <div className="flex items-center gap-2 text-emerald-700">
                                        <BsCheckCircle />
                                        <p className="text-sm font-semibold">
                                          Teslim Edildi
                                        </p>
                                      </div>

                                      <p className="mt-3 text-2xl font-bold text-emerald-950">
                                        {submission.score} / {assignment.maxPoints}
                                      </p>

                                      {submission.feedback && (
                                        <p className="mt-2 text-sm leading-6 text-emerald-900">
                                          {submission.feedback}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <form
                                  onSubmit={(event) =>
                                    handleGradeSubmission(event, submission.id)
                                  }
                                  className="mt-5 grid gap-4 rounded-2xl border border-blue-100 bg-white p-4 lg:grid-cols-[160px_1fr_auto]"
                                >
                                  <div>
                                    <label className="text-sm font-medium text-slate-700">
                                      Puan
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={assignment.maxPoints}
                                      value={input.score}
                                      onChange={(event) =>
                                        updateGradeInput(
                                          submission.id,
                                          "score",
                                          event.target.value,
                                        )
                                      }
                                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-sm font-medium text-slate-700">
                                      Öğretmen Geri Bildirimi
                                    </label>
                                    <input
                                      type="text"
                                      value={input.feedback}
                                      onChange={(event) =>
                                        updateGradeInput(
                                          submission.id,
                                          "feedback",
                                          event.target.value,
                                        )
                                      }
                                      placeholder="Kısa geri bildirim yazın."
                                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                                    />
                                  </div>

                                  <div className="flex items-end">
                                    <button
                                      type="submit"
                                      disabled={gradingId === submission.id}
                                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                      <BsPencilSquare />
                                      {gradingId === submission.id
                                        ? "Kaydediliyor..."
                                        : "Değerlendir"}
                                    </button>
                                  </div>
                                </form>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </DashboardShell>
  );
}
