"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsBarChart,
  BsClipboardData,
  BsGraphUp,
  BsPeople,
  BsPlusSquare,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import EmptyState from "@/components/EmptyState";
import {
  createManualGrade,
  getTeacherGradebook,
  type GradebookClass,
  type TeacherManualGrade,
} from "@/lib/gradebookApi";
import { supabase } from "@/lib/supabaseClient";

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function percentage(score: number, maxPoints: number) {
  if (!maxPoints) return 0;
  return Math.round((score / maxPoints) * 100);
}

function weightedAverage(grades: TeacherManualGrade[]) {
  if (grades.length === 0) return null;

  const gradesWithWeight = grades.filter((grade) => grade.weight > 0);

  if (gradesWithWeight.length > 0) {
    const totalWeight = gradesWithWeight.reduce(
      (sum, grade) => sum + grade.weight,
      0,
    );

    if (totalWeight === 0) return null;

    const weightedTotal = gradesWithWeight.reduce((sum, grade) => {
      return sum + percentage(grade.score, grade.maxPoints) * grade.weight;
    }, 0);

    return Math.round(weightedTotal / totalWeight);
  }

  const total = grades.reduce(
    (sum, grade) => sum + percentage(grade.score, grade.maxPoints),
    0,
  );

  return Math.round(total / grades.length);
}

function totalWeight(grades: TeacherManualGrade[]) {
  return grades.reduce((sum, grade) => sum + grade.weight, 0);
}

function metricText(value: number | null) {
  if (value === null) return "Veri yok";
  return `${value}%`;
}

export default function TeacherGradesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<GradebookClass[]>([]);
  const [grades, setGrades] = useState<TeacherManualGrade[]>([]);

  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [gradeTitle, setGradeTitle] = useState("");
  const [gradeType, setGradeType] = useState("Vize");
  const [score, setScore] = useState(80);
  const [maxPoints, setMaxPoints] = useState(100);
  const [weight, setWeight] = useState(40);
  const [date, setDate] = useState(getTodayDate());
  const [description, setDescription] = useState("");

  const [selectedSummaryClassId, setSelectedSummaryClassId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadGradebook() {
    setLoading(true);
    setErrorMessage("");

    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      setLoading(false);
      return;
    }

    setUser(data.user);

    try {
      const result = await getTeacherGradebook(data.user.id);

      setClasses(result.classes);
      setGrades(result.grades);

      if (!classId && result.classes[0]) {
        setClassId(result.classes[0].id);
        setSelectedSummaryClassId(result.classes[0].id);

        if (result.classes[0].students[0]) {
          setStudentId(result.classes[0].students[0].id);
        }
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Not defteri verileri yüklenemedi.",
      );
    }

    setLoading(false);
  }

  useEffect(() => {
    loadGradebook();
  }, []);

  const selectedClass = useMemo(() => {
    return classes.find((classItem) => classItem.id === classId);
  }, [classes, classId]);

  const filteredGrades = useMemo(() => {
    if (selectedSummaryClassId === "all") return grades;
    return grades.filter((grade) => grade.classId === selectedSummaryClassId);
  }, [grades, selectedSummaryClassId]);

  const studentSummaries = useMemo(() => {
    const relevantClasses =
      selectedSummaryClassId === "all"
        ? classes
        : classes.filter((classItem) => classItem.id === selectedSummaryClassId);

    return relevantClasses.flatMap((classItem) => {
      return classItem.students.map((student) => {
        const studentGrades = grades.filter(
          (grade) =>
            grade.classId === classItem.id && grade.studentId === student.id,
        );

        return {
          id: `${classItem.id}-${student.id}`,
          classId: classItem.id,
          className: classItem.className,
          courseName: classItem.courseName,
          studentName: student.name,
          schoolNumber: student.schoolNumber,
          gradeCount: studentGrades.length,
          totalWeight: totalWeight(studentGrades),
          average: weightedAverage(studentGrades),
          grades: studentGrades,
        };
      });
    });
  }, [classes, grades, selectedSummaryClassId]);

  async function handleCreateGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!user) return;

    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    if (!classId || !studentId) {
      setErrorMessage("Lütfen sınıf ve öğrenci seçin.");
      setSaving(false);
      return;
    }

    try {
      await createManualGrade({
        teacherAuthId: user.id,
        classId,
        studentId,
        gradeTitle,
        gradeType,
        score,
        maxPoints,
        weight,
        date,
        description,
      });

      setSuccessMessage("Not kaydı oluşturuldu ve formül hesaplamasına dahil edildi.");
      setGradeTitle("");
      setScore(80);
      setMaxPoints(100);
      setDescription("");

      await loadGradebook();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Not kaydı oluşturulamadı.",
      );
    }

    setSaving(false);
  }

  function applyFormulaTemplate(template: "vize-final" | "vize-lab-final") {
    if (template === "vize-final") {
      setGradeType("Vize");
      setWeight(40);
      setGradeTitle("Vize Notu");
      setDescription("Varsayılan formül örneği: Vize %40, Final %60.");
    }

    if (template === "vize-lab-final") {
      setGradeType("Laboratuvar");
      setWeight(20);
      setGradeTitle("Laboratuvar Notu");
      setDescription("Örnek formül: Vize %30, Laboratuvar %20, Final %50.");
    }
  }

  return (
    <DashboardShell
      title="Not Defteri"
      description="Vize, final, laboratuvar ve öğretmenin kendi ağırlık formülüne göre manuel not yönetimi."
      activePage="grades"
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

      {!loading && classes.length === 0 && (
        <EmptyState
          icon={BsClipboardData}
          title="Not girmek için aktif sınıf gerekli"
          description="Önce sınıf oluşturun ve öğrencileri sınıfa ekleyin. Daha sonra vize, final ve laboratuvar notları girilebilir."
          primaryActionLabel="Sınıflara Git"
          primaryActionHref="/teacher/classes"
        />
      )}

      {!loading && classes.length > 0 && (
        <div className="space-y-8">
          <section className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsPeople />
                <p className="text-sm font-semibold">Aktif Sınıf</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {classes.length}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsClipboardData />
                <p className="text-sm font-semibold">Manuel Not</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {grades.length}
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500">
                <BsBarChart />
                <p className="text-sm font-semibold">Görünen Kayıt</p>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-950">
                {filteredGrades.length}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <BsPlusSquare className="text-xl" />
              </div>

              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Vize / Final / Laboratuvar Notu Ekle
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Ödev sistemi ayrı kalır. Bu ekran sadece Notlar tablosuna manuel
                  sınav ve performans notu ekler. Ağırlık alanı öğretmenin kendi
                  formülü için kullanılır.
                </p>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => applyFormulaTemplate("vize-final")}
                className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Şablon: Vize %40 + Final %60
              </button>

              <button
                type="button"
                onClick={() => applyFormulaTemplate("vize-lab-final")}
                className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Şablon: Vize %30 + Lab %20 + Final %50
              </button>
            </div>

            <form onSubmit={handleCreateGrade} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Sınıf
                  </label>
                  <select
                    value={classId}
                    onChange={(event) => {
                      const nextClassId = event.target.value;
                      const nextClass = classes.find(
                        (classItem) => classItem.id === nextClassId,
                      );

                      setClassId(nextClassId);
                      setStudentId(nextClass?.students[0]?.id || "");
                    }}
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
                    Öğrenci
                  </label>
                  <select
                    value={studentId}
                    onChange={(event) => setStudentId(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    {selectedClass?.students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.schoolNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Not Türü
                  </label>
                  <select
                    value={gradeType}
                    onChange={(event) => setGradeType(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="Vize">Vize</option>
                    <option value="Final">Final</option>
                    <option value="Laboratuvar">Laboratuvar</option>
                    <option value="Quiz">Quiz</option>
                    <option value="Performans">Performans</option>
                    <option value="Katilim">Katılım</option>
                    <option value="Sinav">Sınav</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Not Başlığı
                  </label>
                  <input
                    type="text"
                    value={gradeTitle}
                    onChange={(event) => setGradeTitle(event.target.value)}
                    placeholder="Vize Notu, Final Notu, Laboratuvar 1"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Puan
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={maxPoints}
                    value={score}
                    onChange={(event) => setScore(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Maksimum Puan
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={maxPoints}
                    onChange={(event) => setMaxPoints(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Ağırlık
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={weight}
                    onChange={(event) => setWeight(Number(event.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Örnek: Vize 40, Final 60. Laboratuvar varsa öğretmen kendi
                    ağırlığını belirler.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-700">
                    Tarih
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Açıklama
                </label>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="Öğretmen not açıklaması veya formül notu."
                  className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !studentId}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <BsPlusSquare />
                {saving ? "Not kaydediliyor..." : "Notu Kaydet"}
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 lg:grid-cols-[1fr_260px] lg:items-end">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                  Formül Sonuçları
                </h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Sistem her öğrenci için ağırlıklı ortalama hesaplar. Ağırlık
                  toplamı 100 değilse sonuç yine hesaplanır, fakat akademik formül
                  kontrolü için toplam ağırlık ayrıca gösterilir.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">
                  Sınıf Filtresi
                </label>
                <select
                  value={selectedSummaryClassId}
                  onChange={(event) => setSelectedSummaryClassId(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">Tüm Sınıflar</option>
                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.className} - {classItem.courseName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            {studentSummaries.map((summary) => (
              <article
                key={summary.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-950">
                      {summary.studentName}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {summary.className}  {summary.courseName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Okul No: {summary.schoolNumber}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <BsGraphUp />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Ortalama
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {metricText(summary.average)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Ağırlık
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {summary.totalWeight}%
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Kayıt
                    </p>
                    <p className="mt-2 text-2xl font-bold text-slate-950">
                      {summary.gradeCount}
                    </p>
                  </div>
                </div>

                {summary.totalWeight !== 100 && summary.gradeCount > 0 && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                    Bu öğrencinin ağırlık toplamı 100 değil. Formül sonucu
                    mevcut ağırlık toplamına göre normalize edilmiştir.
                  </div>
                )}

                {summary.grades.length > 0 && (
                  <div className="mt-5 space-y-2">
                    {summary.grades.map((grade) => (
                      <div
                        key={grade.id}
                        className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-950">
                            {grade.gradeType}  {grade.title}
                          </p>
                          <p className="text-slate-500">
                            {grade.score} / {grade.maxPoints}
                          </p>
                        </div>

                        <p className="font-bold text-blue-700">
                          {grade.weight}%
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </section>

          <section>
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-slate-950">
              Girilen Not Kayıtları
            </h2>

            {filteredGrades.length === 0 ? (
              <EmptyState
                icon={BsClipboardData}
                title="Henüz manuel not kaydı yok"
                description="Vize, final veya laboratuvar notu eklediğinizde burada görünecektir."
              />
            ) : (
              <div className="space-y-4">
                {filteredGrades.map((grade) => (
                  <article
                    key={grade.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                          {grade.gradeType}
                        </span>

                        <h3 className="mt-4 text-xl font-bold text-slate-950">
                          {grade.title}
                        </h3>

                        <p className="mt-2 text-sm font-semibold text-slate-600">
                          {grade.studentName}  {grade.className}  {grade.courseName}
                        </p>

                        {grade.description && (
                          <p className="mt-3 text-sm leading-7 text-slate-600">
                            {grade.description}
                          </p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 lg:min-w-[260px]">
                        <div className="rounded-2xl bg-slate-50 p-4 text-center">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Puan
                          </p>
                          <p className="mt-2 text-xl font-bold text-slate-950">
                            {grade.score} / {grade.maxPoints}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4 text-center">
                          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Ağırlık
                          </p>
                          <p className="mt-2 text-xl font-bold text-blue-700">
                            {grade.weight}%
                          </p>
                        </div>
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
