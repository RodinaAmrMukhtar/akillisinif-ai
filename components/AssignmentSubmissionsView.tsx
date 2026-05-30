"use client";

import DashboardShell from "@/components/DashboardShell";
import ClassWorkspaceHeader from "@/components/ClassWorkspaceHeader";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BsArrowLeft,
  BsArrowRepeat,
  BsCheck2Circle,
  BsDownload,
  BsFileEarmarkArrowDown,
} from "react-icons/bs";

type Submission = {
  id: string;
  studentName: string;
  studentEmail: string;
  submissionText: string;
  submittedAt: string;
  status: string;
  score: number | null;
  feedback: string;
  isLate: boolean;
  attachments: {
    id: string;
    filename: string;
    url: string;
    type: string;
    size: number | null;
  }[];
};

type AssignmentData = {
  ok: boolean;
  assignment: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
    maxPoint: number | null;
    type: string;
    status: string;
  };
  submissions: Submission[];
};

function formatDate(value: string) {
  if (!value) return "-";

  try {
    return new Date(value).toLocaleString("tr-TR");
  } catch {
    return value;
  }
}

export default function AssignmentSubmissionsView() {
  const params = useParams<{ id: string; assignmentId: string }>();

  const classId = String(params.id || "");
  const assignmentId = String(params.assignmentId || "");

  const [data, setData] = useState<AssignmentData | null>(null);
  const [scores, setScores] = useState<Record<string, string>>({});
  const [feedbacks, setFeedbacks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadSubmissions() {
    try {
      setIsLoading(true);
      setMessage("");
      setErrorMessage("");

      const query = new URLSearchParams();
      query.set("classId", classId);
      query.set("assignmentId", assignmentId);

      const response = await fetch(
        `/api/airtable/classes/assignment-submissions?${query.toString()}`,
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

      const nextScores: Record<string, string> = {};
      const nextFeedbacks: Record<string, string> = {};

      for (const submission of result.submissions || []) {
        nextScores[submission.id] =
          submission.score === null || submission.score === undefined
            ? ""
            : String(submission.score);
        nextFeedbacks[submission.id] = submission.feedback || "";
      }

      setScores(nextScores);
      setFeedbacks(nextFeedbacks);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Teslimatlar y?klenemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSubmissions();
  }, [classId, assignmentId]);

  async function saveEvaluation(submissionId: string) {
    try {
      setMessage("");
      setErrorMessage("");

      const response = await fetch("/api/airtable/classes/assignment-submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          submissionId,
          score: scores[submissionId] || null,
          feedback: feedbacks[submissionId] || "",
          status: "De?erlendirildi",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ? `${result.message} Detay: ${result.error}` : result.message,
        );
      }

      setMessage("Teslimat de?erlendirildi.");
      await loadSubmissions();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Teslimat de?erlendirilemedi.");
    }
  }

  return (
    <DashboardShell
      activePage="classes"
      title="Ödev Teslimatlar?"
      description="Öğrencilerin g?nderdi?i Ödev teslimlerini inceleyin ve de?erlendirin"
    >
      <div className="space-y-6">
        <ClassWorkspaceHeader />

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href={`/teacher/classes/${classId}/odevler`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
              >
                <BsArrowLeft />
                Ödevlere dön
              </Link>

              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.25em] text-blue-700">
                Teslimatlar
              </p>

              <h1 className="mt-2 text-3xl font-bold text-slate-950">
                {data?.assignment?.title || "Ödev Teslimatlar?"}
              </h1>

              <p className="mt-3 max-w-3xl text-slate-600">
                {data?.assignment?.description ||
                  "Bu ekranda Öğrencilerin teslim metni, dosya ekleri, puanı ve Öğretmen geri bildirimi yönetilir."}
              </p>
            </div>

            <button
              type="button"
              onClick={loadSubmissions}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
            >
              <BsArrowRepeat />
              Yenile
            </button>
          </div>
        </section>

        {message ? (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            {message}
          </section>
        ) : null}

        {errorMessage ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {errorMessage}
          </section>
        ) : null}

        {isLoading ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            Teslimatlar y?kleniyor...
          </section>
        ) : (data?.submissions || []).length === 0 ? (
          <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Henüz teslim yok
            </h2>
            <p className="mt-2 text-slate-600">
              Öğrenciler bu Ödevi teslim etti?inde burada listelenecek.
            </p>
          </section>
        ) : (
          <section className="grid gap-5">
            {(data?.submissions || []).map((submission) => (
              <article
                key={submission.id}
                className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">
                      {submission.studentName}
                    </h2>

                    <p className="mt-1 text-sm text-slate-600">
                      {submission.studentEmail || "-"}  Teslim tarihi:{" "}
                      {formatDate(submission.submittedAt)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {submission.status || "Teslim Edildi"}
                      </span>

                      {submission.isLate ? (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                          Ge? teslim
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                    Puan: {submission.score ?? "-"}
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-700">
                    Teslim Metni
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                    {submission.submissionText || "Teslim metni eklenmemi?."}
                  </p>
                </div>

                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-700">
                    Dosya Ekleri
                  </p>

                  {submission.attachments.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-500">
                      Bu teslimatta dosya eki yok.
                    </p>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {submission.attachments.map((file) => (
                        <a
                          key={file.id || file.url}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
                        >
                          <BsFileEarmarkArrowDown />
                          {file.filename || "Dosya"}
                          <BsDownload />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[180px,1fr,auto] md:items-end">
                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Puan
                    </span>
                    <input
                      value={scores[submission.id] || ""}
                      onChange={(event) =>
                        setScores((current) => ({
                          ...current,
                          [submission.id]: event.target.value,
                        }))
                      }
                      inputMode="decimal"
                      placeholder="0-100"
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-slate-700">
                      Öğretmen Geri Bildirimi
                    </span>
                    <input
                      value={feedbacks[submission.id] || ""}
                      onChange={(event) =>
                        setFeedbacks((current) => ({
                          ...current,
                          [submission.id]: event.target.value,
                        }))
                      }
                      placeholder="K?sa de?erlendirme yaz?n"
                      className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => saveEvaluation(submission.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-sm font-semibold text-white"
                  >
                    <BsCheck2Circle />
                    Kaydet
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
