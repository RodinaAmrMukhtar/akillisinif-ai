"use client";

import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsCalendarCheck,
  BsCheckCircle,
  BsClipboard,
  BsQrCode,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  createAttendanceSession,
  listTeacherAttendanceSessions,
  type AttendanceSession,
} from "@/lib/attendanceApi";
import { listTeacherClasses, type TeacherClass } from "@/lib/classesApi";
import { supabase } from "@/lib/supabaseClient";

export default function TeacherAttendancePage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [lessonHour, setLessonHour] = useState(1);
  const [createdSession, setCreatedSession] = useState<AttendanceSession | null>(null);
  const [attendanceUrl, setAttendanceUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      const [teacherClasses, teacherSessions] = await Promise.all([
        listTeacherClasses(data.user.id),
        listTeacherAttendanceSessions(data.user.id),
      ]);

      setClasses(teacherClasses);
      setSessions(teacherSessions);

      if (!selectedClassId && teacherClasses[0]) {
        setSelectedClassId(teacherClasses[0].id);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Yoklama verileri yüklenemedi.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setCreating(true);
    setErrorMessage("");
    setCreatedSession(null);

    if (!selectedClassId) {
      setErrorMessage("Lütfen bir sınıf seçin.");
      setCreating(false);
      return;
    }

    try {
      const session = await createAttendanceSession({
        teacherAuthId: user.id,
        classId: selectedClassId,
        lessonHour,
      });

      setCreatedSession(session);

      const origin = window.location.origin;
      setAttendanceUrl(`${origin}/student/attendance?code=${session.code}`);

      await loadData();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Yoklama oturumu oluşturulamadı.",
      );
    }

    setCreating(false);
  }

  return (
    <DashboardShell
      title="Yoklama"
      description="Sınıf için QR kodlu yoklama oturumu oluşturun ve öğrencilerin kod ile katılımını alın."
      activePage="attendance"
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

      {!loading && classes.length === 0 && (
        <EmptyState
          icon={BsCalendarCheck}
          title="Yoklama için önce sınıf gerekli"
          description="QR kodlu yoklama oluşturmak için öğretmen hesabınıza bağlı aktif bir sınıf bulunmalıdır."
          primaryActionLabel="Yeni Sınıf Oluştur"
          primaryActionHref="/teacher/classes/new"
        />
      )}

      {!loading && classes.length > 0 && (
        <div className="space-y-8">
          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <BsQrCode className="text-xl" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Yeni Yoklama Oturumu
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sistem kısa bir yoklama kodu üretir. Öğrenciler QR kodu okutarak
                  veya kodu elle girerek yoklamaya katılır.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSession} className="grid gap-5 md:grid-cols-[1fr_180px_auto]">
              <div>
                <label className="text-sm font-medium text-slate-700">
                  Sınıf
                </label>
                <select
                  value={selectedClassId}
                  onChange={(event) => setSelectedClassId(event.target.value)}
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
                  Ders Saati
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={lessonHour}
                  onChange={(event) => setLessonHour(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <BsCalendarCheck />
                  {creating ? "Oturum oluşturuluyor..." : "Yoklama Başlat"}
                </button>
              </div>
            </form>
          </section>

          {createdSession && (
            <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 shadow-sm">
              <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-emerald-700">
                      <BsCheckCircle className="text-xl" />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-emerald-700">
                        Yoklama oturumu aktif
                      </p>
                      <h2 className="text-2xl font-bold text-emerald-950">
                        {createdSession.className} - {createdSession.courseName}
                      </h2>
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl bg-white p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                      Yoklama Kodu
                    </p>
                    <p className="mt-2 font-mono text-5xl font-bold tracking-wider text-slate-950">
                      {createdSession.code}
                    </p>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      Öğrenci bu kodu öğrenci yoklama ekranına girerek katılımını
                      onaylayabilir. Vercel yayını sonrası QR kod telefonla da
                      doğrudan açılacaktır.
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl bg-white p-6 text-center">
                  <p className="mb-4 text-sm font-semibold text-slate-700">
                    QR Kod
                  </p>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(attendanceUrl)}`}
                    alt="Yoklama QR kodu"
                    className="mx-auto rounded-2xl border border-slate-200 bg-white p-2"
                  />
                  <p className="mt-4 break-all text-xs leading-5 text-slate-500">
                    {attendanceUrl}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-950">
              Son Yoklama Oturumları
            </h2>

            {sessions.length === 0 ? (
              <EmptyState
                icon={BsCalendarCheck}
                title="Henüz yoklama oturumu yok"
                description="Yoklama başlattığınızda oturumlar burada listelenecektir."
              />
            ) : (
              <div className="grid gap-5 lg:grid-cols-2">
                {sessions.map((session) => (
                  <article
                    key={session.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {session.status}
                        </span>
                        <h3 className="mt-4 text-2xl font-bold text-slate-950">
                          {session.className}
                        </h3>
                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          {session.courseName}
                        </p>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                        <BsClipboard className="text-xl" />
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Kod
                        </p>
                        <p className="mt-2 font-mono text-lg font-bold text-blue-700">
                          {session.code}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Ders
                        </p>
                        <p className="mt-2 text-lg font-bold text-slate-950">
                          {session.lessonHour}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Gelen
                        </p>
                        <p className="mt-2 text-lg font-bold text-slate-950">
                          {session.presentCount || 0}
                        </p>
                      </div>
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
