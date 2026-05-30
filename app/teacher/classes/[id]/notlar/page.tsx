"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import DashboardShell from "@/components/DashboardShell";
import { supabase } from "@/lib/supabaseClient";

type Student = {
  id: string;
  membershipId: string;
  name: string;
  email: string;
  schoolNumber: string;
};

type GradeRecord = {
  id: string;
  title: string;
  studentId: string;
  studentName: string;
  gradeType: string;
  score: number | null;
  maxScore: number | null;
  weight: number | null;
  date: string;
  description: string;
  publishStatus: string;
  createdAt: string;
};

type GradeRow = {
  studentId: string;
  score: string;
  description: string;
};

type ClassInfo = {
  id: string;
  name: string;
  lessonName: string;
};

const gradeTypes = ["Vize", "Final", "Laboratuvar", "Quiz", "Proje", "Odev", "Ortalama"];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatScore(score: number | null, maxScore: number | null) {
  if (score === null) return "Yok";
  return `${Math.round(score)}/${maxScore || 100}`;
}

function getPublishClass(status: string) {
  if (status === "Yayinda") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getScoreClass(score: number | null, maxScore: number | null) {
  if (score === null) return "text-slate-500";

  const ratio = score / (maxScore || 100);

  if (ratio < 0.5) return "text-red-700";
  if (ratio < 0.7) return "text-orange-700";
  return "text-emerald-700";
}

export default function TeacherClassGradesPage() {
  const params = useParams();
  const rawClassId = params?.id;
  const classId = Array.isArray(rawClassId) ? rawClassId[0] : String(rawClassId || "");

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [rows, setRows] = useState<GradeRow[]>([]);

  const [gradeType, setGradeType] = useState("Vize");
  const [gradeDate, setGradeDate] = useState(todayIso());
  const [maxScore, setMaxScore] = useState("100");
  const [publishStatus, setPublishStatus] = useState("Taslak");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    try {
      if (!classId) return;

      setLoading(true);
      setError("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const email = user?.email || "";

      const response = await fetch(
        `/api/airtable/teacher-grades/list?classId=${encodeURIComponent(
          classId,
        )}&teacherEmail=${encodeURIComponent(email)}`,
        { cache: "no-store" },
      );

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || "Notlar alınamadı.");
      }

      setClassInfo(result.classInfo || null);
      setStudents(result.students || []);
      setGrades(result.grades || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const nextRows = students.map((student) => {
      const existingGrade = grades.find(
        (grade) =>
          grade.studentId === student.id &&
          grade.gradeType === gradeType &&
          grade.date === gradeDate,
      );

      return {
        studentId: student.id,
        score:
          existingGrade?.score === null || existingGrade?.score === undefined
            ? ""
            : String(existingGrade.score),
        description: existingGrade?.description || "",
      };
    });

    setRows(nextRows);
  }, [students, grades, gradeType, gradeDate]);

  const selectedGrades = useMemo(() => {
    return grades.filter((grade) => grade.gradeType === gradeType && grade.date === gradeDate);
  }, [grades, gradeType, gradeDate]);

  const stats = useMemo(() => {
    const numericScores = rows
      .map((row) => Number(row.score))
      .filter((score) => Number.isFinite(score));

    const average =
      numericScores.length > 0
        ? Math.round(numericScores.reduce((sum, score) => sum + score, 0) / numericScores.length)
        : 0;

    const publishedCount = grades.filter((grade) => grade.publishStatus === "Yayinda").length;
    const draftCount = grades.filter((grade) => grade.publishStatus !== "Yayinda").length;

    return {
      studentCount: students.length,
      filledCount: numericScores.length,
      average,
      publishedCount,
      draftCount,
    };
  }, [rows, students.length, grades]);

  function updateRow(studentId: string, field: "score" | "description", value: string) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.studentId === studentId ? { ...row, [field]: value } : row,
      ),
    );
  }

  async function saveGrades(nextStatus: "Taslak" | "Yayinda") {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const entries = rows
        .filter((row) => String(row.score).trim() !== "")
        .map((row) => ({
          studentId: row.studentId,
          score: row.score,
          description: row.description,
        }));

      if (entries.length === 0) {
        throw new Error("Kaydedilecek not girilmedi.");
      }

      const response = await fetch("/api/airtable/teacher-grades/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          teacherEmail: user?.email || "",
          gradeType,
          gradeDate,
          maxScore,
          publishStatus: nextStatus,
          entries,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.message || result.error || "Notlar kaydedilemedi.");
      }

      setPublishStatus(nextStatus);
      setSuccess(result.message || "Notlar kaydedildi.");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Beklenmeyen hata oluştu.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell
      title="Notlar"
      description="Sınıf öğrencileri için not girişi, taslak kayıt ve yayınlama ekranı."
    >
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            {classInfo?.lessonName || "Sınıf"}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">
            {classInfo?.name || "Not Yönetimi"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
            Notları önce taslak olarak kaydedebilir, hazır olduğunda yayınlayabilirsin.
            Yayınlanan notlar öğrenci bildirimleri ve AI tahmin iş akışları için kullanılabilir.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Öğrenci</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stats.studentCount}</p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-blue-600">Girilen Not</p>
            <p className="mt-2 text-3xl font-bold text-blue-700">{stats.filledCount}</p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-emerald-600">Ortalama</p>
            <p className="mt-2 text-3xl font-bold text-emerald-700">{stats.average}</p>
          </div>

          <div className="rounded-3xl border border-violet-100 bg-violet-50 p-5 shadow-sm">
            <p className="text-sm font-medium text-violet-600">Yayınlanan</p>
            <p className="mt-2 text-3xl font-bold text-violet-700">{stats.publishedCount}</p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Taslak</p>
            <p className="mt-2 text-3xl font-bold text-slate-950">{stats.draftCount}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Not Türü</span>
              <select
                value={gradeType}
                onChange={(event) => setGradeType(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400"
              >
                {gradeTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Tarih</span>
              <input
                type="date"
                value={gradeDate}
                onChange={(event) => setGradeDate(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Maksimum Puan</span>
              <input
                type="number"
                min="1"
                value={maxScore}
                onChange={(event) => setMaxScore(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-semibold text-slate-700">Durum</span>
              <select
                value={publishStatus}
                onChange={(event) => setPublishStatus(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400"
              >
                <option value="Taslak">Taslak</option>
                <option value="Yayinda">Yayında</option>
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={saving || loading}
              onClick={() => saveGrades("Taslak")}
              className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Taslak Kaydet
            </button>

            <button
              type="button"
              disabled={saving || loading}
              onClick={() => saveGrades("Yayinda")}
              className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Yayınla
            </button>
          </div>

          {success ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              {success}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Notlar yükleniyor...
          </div>
        ) : students.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm">
            Bu sınıfta aktif öğrenci bulunmuyor.
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-950">Not Girişi</h2>
              <p className="mt-1 text-sm text-slate-500">
                Seçili not türü ve tarih için öğrenci notlarını gir.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Öğrenci
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Okul No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Puan
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Açıklama
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {students.map((student) => {
                    const row = rows.find((item) => item.studentId === student.id);

                    return (
                      <tr key={student.id} className="align-top">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-950">{student.name}</p>
                          {student.email ? (
                            <p className="mt-1 text-xs text-slate-500">{student.email}</p>
                          ) : null}
                        </td>

                        <td className="px-6 py-4 text-sm text-slate-600">
                          {student.schoolNumber || "Yok"}
                        </td>

                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            max={Number(maxScore) || 100}
                            value={row?.score || ""}
                            onChange={(event) =>
                              updateRow(student.id, "score", event.target.value)
                            }
                            className="w-28 rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                            placeholder="0"
                          />
                        </td>

                        <td className="px-6 py-4">
                          <textarea
                            value={row?.description || ""}
                            onChange={(event) =>
                              updateRow(student.id, "description", event.target.value)
                            }
                            rows={2}
                            className="min-w-72 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400"
                            placeholder="İsteğe bağlı öğretmen notu"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Seçili Kayıtlar</h2>
              <p className="mt-1 text-sm text-slate-500">
                {gradeType}  {gradeDate}
              </p>
            </div>

            <span className="w-fit rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-700">
              {selectedGrades.length} kayıt
            </span>
          </div>

          {selectedGrades.length === 0 ? (
            <p className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              Bu not türü ve tarih için kayıt yok.
            </p>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {selectedGrades.map((grade) => (
                <div
                  key={grade.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-950">{grade.studentName}</p>
                      <p className="mt-1 text-sm text-slate-500">{grade.gradeType}</p>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${getPublishClass(
                        grade.publishStatus,
                      )}`}
                    >
                      {grade.publishStatus === "Yayinda" ? "Yayında" : "Taslak"}
                    </span>
                  </div>

                  <p
                    className={`mt-3 text-2xl font-bold ${getScoreClass(
                      grade.score,
                      grade.maxScore,
                    )}`}
                  >
                    {formatScore(grade.score, grade.maxScore)}
                  </p>

                  {grade.description ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      {grade.description}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}