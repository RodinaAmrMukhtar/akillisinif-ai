"use client";

import DashboardShell from "@/components/DashboardShell";
import ClassWorkspaceHeader from "@/components/ClassWorkspaceHeader";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  BsArrowRight,
  BsArrowRepeat,
  BsCheck2Circle,
  BsEnvelope,
  BsFileEarmarkText,
  BsGraphUpArrow,
  BsPersonCheck,
  BsXCircle,
} from "react-icons/bs";

type ClassData = {
  ok: boolean;
  message?: string;
  error?: string;
  students: any[];
  assignments: any[];
  attendanceSessions: any[];
  predictions: any[];
  pendingRequests: any[];
};

const T = {
  loading: "Veriler yükleniyor...",
  loadError: "Veriler yüklenemedi.",
  refresh: "Yenile",

  studentsTitle: "Sınıf Öğrencileri",
  studentsDescription: "Bu sınıfa kayıtlı aktif öğrenciler",
  studentsLabel: "Öğrenciler",
  activeStudents: "Aktif öğrenci listesi",
  noStudents: "Bu sınıfta aktif öğrenci yok.",
  fullName: "Ad Soyad",
  email: "E-posta",
  schoolNo: "Okul No",
  status: "Durum",
  active: "Aktif",

  assignmentsTitle: "Sınıf Ödevleri",
  assignmentsDescription: "Bu sınıfa ait ödevler ve teslim durumları",
  assignmentsLabel: "Ödevler",
  assignmentRecords: "Sınıf ödev kayıtları",
  noAssignments: "Bu sınıfa ait ödev bulunamadı.",
  assignment: "Ödev",
  dueDate: "Teslim tarihi",
  maxPoint: "Maksimum puan",
  submission: "teslim",
  reviewSubmissions: "Teslimatlara G?z At",

  attendanceTitle: "Sınıf Yoklama",
  attendanceDescription: "Bu sınıfa ait yoklama oturumları",
  attendanceLabel: "Yoklama",
  attendanceSessions: "Yoklama oturumları",
  noAttendance: "Bu sınıfa ait yoklama oturumu bulunamadı.",
  date: "Tarih",
  lessonHour: "Ders saati",
  record: "Kayıt",
  present: "Geldi",
  missing: "Eksik",

  predictionsTitle: "Sınıf Tahminleri",
  predictionsDescription: "AI destekli öğrenci performans tahminleri",
  predictionsLabel: "Tahminler",
  predictionsHeading: "AI performans tahminleri",
  noPredictions: "Bu sınıf için henüz AI tahmini yok. Workflow 06 ile bu alan dolacak.",
  riskLevel: "Risk seviyesi",
  score: "Skor",

  joinTitle: "Katılım İstekleri",
  joinDescription: "Bu sınıf için bekleyen öğrenci katılım istekleri",
  joinLabel: "Katılım İstekleri",
  pendingRequests: "Bekleyen istekler",
  noJoinRequests: "Bekleyen katılım isteği yok.",
  waitingApproval: "Onay bekliyor",
  approve: "Onayla",
  reject: "Reddet",
  done: "İşlem tamamlandı.",
};

function formatDate(value: string) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleDateString("tr-TR");
  } catch {
    return value;
  }
}

function useClassData() {
  const params = useParams<{ id: string }>();
  const classId = String(params.id || "");

  const [data, setData] = useState<ClassData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/airtable/classes/section-data?classId=${encodeURIComponent(classId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ? `${result.message} Detay: ${result.error}` : result.message,
        );
      }

      setData(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : T.loadError);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [classId]);

  return { classId, data, isLoading, errorMessage, loadData };
}

function SectionShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <DashboardShell activePage="classes" title={title} description={description}>
      <div className="space-y-6">
        <ClassWorkspaceHeader />
        {children}
      </div>
    </DashboardShell>
  );
}

function LoadingOrError({
  isLoading,
  errorMessage,
}: {
  isLoading: boolean;
  errorMessage: string;
}) {
  if (isLoading) {
    return (
      <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        {T.loading}
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-[2rem] border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
        {errorMessage}
      </section>
    );
  }

  return null;
}

export function StudentsSection() {
  const { data, isLoading, errorMessage, loadData } = useClassData();

  return (
    <SectionShell title={T.studentsTitle} description={T.studentsDescription}>
      <LoadingOrError isLoading={isLoading} errorMessage={errorMessage} />

      {!isLoading && !errorMessage ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                {T.studentsLabel}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {T.activeStudents}
              </h2>
            </div>

            <button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold">
              <BsArrowRepeat />
              {T.refresh}
            </button>
          </div>

          {(data?.students || []).length === 0 ? (
            <p className="text-slate-600">{T.noStudents}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{T.fullName}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{T.email}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{T.schoolNo}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">{T.status}</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {(data?.students || []).map((student) => (
                    <tr key={student.membershipId}>
                      <td className="px-4 py-3 font-semibold text-slate-950">{student.name}</td>
                      <td className="px-4 py-3 text-slate-600">{student.email || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{student.schoolNo || "-"}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                          {student.status || T.active}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </SectionShell>
  );
}

export function AssignmentsSection() {
  const { classId, data, isLoading, errorMessage, loadData } = useClassData();

  return (
    <SectionShell title={T.assignmentsTitle} description={T.assignmentsDescription}>
      <LoadingOrError isLoading={isLoading} errorMessage={errorMessage} />

      {!isLoading && !errorMessage ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                {T.assignmentsLabel}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {T.assignmentRecords}
              </h2>
            </div>

            <button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold">
              <BsArrowRepeat />
              {T.refresh}
            </button>
          </div>

          {(data?.assignments || []).length === 0 ? (
            <p className="text-slate-600">{T.noAssignments}</p>
          ) : (
            <div className="grid gap-4">
              {(data?.assignments || []).map((assignment) => (
                <article key={assignment.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-blue-700">
                        <BsFileEarmarkText />
                        <span className="text-sm font-semibold">
                          {assignment.type || T.assignment}
                        </span>
                      </div>

                      <h3 className="mt-2 text-xl font-bold text-slate-950">
                        {assignment.title}
                      </h3>

                      <p className="mt-2 text-sm text-slate-600">
                        {T.dueDate}: {formatDate(assignment.dueDate)}  {T.maxPoint}:{" "}
                        {assignment.maxPoint ?? "-"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:items-end">
                      <div className="rounded-2xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
                        {assignment.submissionsCount} {T.submission}
                      </div>

                      <Link
                        href={`/teacher/classes/${classId}/odevler/${assignment.id}/teslimatlar`}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
                      >
                        <span>{T.reviewSubmissions}</span>
                        <BsArrowRight />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </SectionShell>
  );
}

export function AttendanceSection() {
  const { data, isLoading, errorMessage, loadData } = useClassData();

  return (
    <SectionShell title={T.attendanceTitle} description={T.attendanceDescription}>
      <LoadingOrError isLoading={isLoading} errorMessage={errorMessage} />

      {!isLoading && !errorMessage ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                {T.attendanceLabel}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {T.attendanceSessions}
              </h2>
            </div>

            <button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold">
              <BsArrowRepeat />
              {T.refresh}
            </button>
          </div>

          {(data?.attendanceSessions || []).length === 0 ? (
            <p className="text-slate-600">{T.noAttendance}</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {(data?.attendanceSessions || []).map((session) => (
                <article key={session.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-lg font-bold text-slate-950">{session.name}</h3>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {session.status || "-"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-600">
                    {T.date}: {formatDate(session.date)}  {T.lessonHour}:{" "}
                    {session.lessonHour || "-"}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                    <div className="rounded-2xl bg-slate-50 p-3">
                      <p className="font-bold text-slate-950">{session.totalRecords}</p>
                      <p className="text-slate-500">{T.record}</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 p-3">
                      <p className="font-bold text-emerald-800">{session.presentCount}</p>
                      <p className="text-emerald-700">{T.present}</p>
                    </div>
                    <div className="rounded-2xl bg-red-50 p-3">
                      <p className="font-bold text-red-800">{session.absentCount}</p>
                      <p className="text-red-700">{T.missing}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </SectionShell>
  );
}

export function PredictionsSection() {
  const { data, isLoading, errorMessage, loadData } = useClassData();

  return (
    <SectionShell title={T.predictionsTitle} description={T.predictionsDescription}>
      <LoadingOrError isLoading={isLoading} errorMessage={errorMessage} />

      {!isLoading && !errorMessage ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                {T.predictionsLabel}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {T.predictionsHeading}
              </h2>
            </div>

            <button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold">
              <BsArrowRepeat />
              {T.refresh}
            </button>
          </div>

          {(data?.predictions || []).length === 0 ? (
            <p className="text-slate-600">{T.noPredictions}</p>
          ) : (
            <div className="grid gap-4">
              {(data?.predictions || []).map((prediction) => (
                <article key={prediction.id} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex items-center gap-2 text-blue-700">
                    <BsGraphUpArrow />
                    <span className="text-sm font-semibold">{prediction.studentName}</span>
                  </div>

                  <h3 className="mt-2 text-xl font-bold text-slate-950">
                    {prediction.title}
                  </h3>

                  <p className="mt-2 text-sm text-slate-600">
                    {T.riskLevel}: {prediction.riskLevel || "-"}  {T.score}:{" "}
                    {prediction.score ?? "-"}  {T.date}: {formatDate(prediction.createdAt)}
                  </p>

                  {prediction.summary ? (
                    <p className="mt-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                      {prediction.summary}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </SectionShell>
  );
}

export function JoinRequestsSection() {
  const { data, isLoading, errorMessage, loadData } = useClassData();
  const [actionMessage, setActionMessage] = useState("");

  async function updateRequest(membershipId: string, action: "approve" | "reject") {
    setActionMessage("");

    const response = await fetch("/api/airtable/classes/membership-action", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ membershipId, action }),
    });

    const result = await response.json();

    if (!response.ok) {
      setActionMessage(
        result.error ? `${result.message} Detay: ${result.error}` : result.message,
      );
      return;
    }

    setActionMessage(result.message || T.done);
    await loadData();
  }

  return (
    <SectionShell title={T.joinTitle} description={T.joinDescription}>
      <LoadingOrError isLoading={isLoading} errorMessage={errorMessage} />

      {!isLoading && !errorMessage ? (
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                {T.joinLabel}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                {T.pendingRequests}
              </h2>
            </div>

            <button type="button" onClick={loadData} className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold">
              <BsArrowRepeat />
              {T.refresh}
            </button>
          </div>

          {actionMessage ? (
            <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-800">
              {actionMessage}
            </div>
          ) : null}

          {(data?.pendingRequests || []).length === 0 ? (
            <p className="text-slate-600">{T.noJoinRequests}</p>
          ) : (
            <div className="grid gap-4">
              {(data?.pendingRequests || []).map((request) => (
                <article key={request.membershipId} className="rounded-3xl border border-slate-200 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-blue-700">
                        <BsPersonCheck />
                        <span className="text-sm font-semibold">{T.waitingApproval}</span>
                      </div>

                      <h3 className="mt-2 text-xl font-bold text-slate-950">
                        {request.name}
                      </h3>

                      <p className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                        <BsEnvelope />
                        {request.email || "-"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => updateRequest(request.membershipId, "approve")} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">
                        <BsCheck2Circle />
                        {T.approve}
                      </button>

                      <button type="button" onClick={() => updateRequest(request.membershipId, "reject")} className="inline-flex items-center gap-2 rounded-2xl bg-red-700 px-4 py-2 text-sm font-semibold text-white">
                        <BsXCircle />
                        {T.reject}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}
    </SectionShell>
  );
}
