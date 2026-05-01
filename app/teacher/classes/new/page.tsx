"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  BsArrowRight,
  BsCheckCircle,
  BsClipboard,
  BsPlusSquare,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";
import { createTeacherClass } from "@/lib/classesApi";
import { supabase } from "@/lib/supabaseClient";

export default function NewClassPage() {
  const [user, setUser] = useState<User | null>(null);

  const [className, setClassName] = useState("");
  const [courseName, setCourseName] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [term, setTerm] = useState("1. Dönem");
  const [level, setLevel] = useState("Lise");
  const [description, setDescription] = useState("");
  const [maxUsage, setMaxUsage] = useState(40);
  const [joinApprovalRequired, setJoinApprovalRequired] = useState(true);

  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [createdClassName, setCreatedClassName] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    }

    loadUser();
  }, []);

  async function handleCreateClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setCreatedCode("");
    setCreatedClassName("");
    setErrorMessage("");

    if (!user) {
      setErrorMessage("Sınıf oluşturmak için giriş yapmanız gerekir.");
      setLoading(false);
      return;
    }

    if (!className.trim()) {
      setErrorMessage("Lütfen sınıf adını girin.");
      setLoading(false);
      return;
    }

    if (!courseName.trim()) {
      setErrorMessage("Lütfen ders adını girin.");
      setLoading(false);
      return;
    }

    try {
      const result = await createTeacherClass({
        teacherAuthId: user.id,
        className,
        courseName,
        academicYear,
        term,
        level,
        description,
        maxUsage,
        joinApprovalRequired,
      });

      setCreatedCode(result.inviteCode.code);
      setCreatedClassName(result.class.className);

      setClassName("");
      setCourseName("");
      setDescription("");
      setMaxUsage(40);
      setJoinApprovalRequired(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Sınıf oluşturma işlemi başarısız.",
      );
    }

    setLoading(false);
  }

  return (
    <DashboardShell
      title="Yeni Sınıf Oluştur"
      description="Öğretmen hesabınızla gerçek bir sınıf oluşturun. Sınıf bilgileri Airtable Siniflar tablosuna, davet kodu ise Davet_Kodlari tablosuna kaydedilir."
      activePage="new-class"
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <BsPlusSquare className="text-xl" />
            </div>

            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950">
                Sınıf Bilgileri
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Bu form gönderildiğinde sistem otomatik bir sınıf katılım kodu
                oluşturur. Öğrenciler bu kodla katılım isteği gönderebilir.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateClass} className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="className"
                  className="text-sm font-medium text-slate-700"
                >
                  Sınıf Adı
                </label>
                <input
                  id="className"
                  type="text"
                  value={className}
                  onChange={(event) => setClassName(event.target.value)}
                  placeholder="10-A"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="courseName"
                  className="text-sm font-medium text-slate-700"
                >
                  Ders Adı
                </label>
                <input
                  id="courseName"
                  type="text"
                  value={courseName}
                  onChange={(event) => setCourseName(event.target.value)}
                  placeholder="Matematik"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="academicYear"
                  className="text-sm font-medium text-slate-700"
                >
                  Akademik Yıl
                </label>
                <select
                  id="academicYear"
                  value={academicYear}
                  onChange={(event) => setAcademicYear(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="2025-2026">2025-2026</option>
                  <option value="2026-2027">2026-2027</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="term"
                  className="text-sm font-medium text-slate-700"
                >
                  Dönem
                </label>
                <select
                  id="term"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="1. Dönem">1. Dönem</option>
                  <option value="2. Dönem">2. Dönem</option>
                  <option value="Yaz Dönemi">Yaz Dönemi</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="level"
                  className="text-sm font-medium text-slate-700"
                >
                  Seviye
                </label>
                <select
                  id="level"
                  value={level}
                  onChange={(event) => setLevel(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="Ortaokul">Ortaokul</option>
                  <option value="Lise">Lise</option>
                  <option value="Üniversite">Üniversite</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="maxUsage"
                  className="text-sm font-medium text-slate-700"
                >
                  Maksimum Katılım
                </label>
                <input
                  id="maxUsage"
                  type="number"
                  min={1}
                  max={200}
                  value={maxUsage}
                  onChange={(event) => setMaxUsage(Number(event.target.value))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium text-slate-700"
              >
                Açıklama
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Sınıf hakkında kısa açıklama yazın."
                rows={4}
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input
                type="checkbox"
                checked={joinApprovalRequired}
                onChange={(event) =>
                  setJoinApprovalRequired(event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-slate-300"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-950">
                  Öğretmen onayı gerekli olsun
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-600">
                  Öğrenciler kodu girdikten sonra doğrudan sınıfa girmek yerine
                  öğretmen onayı bekler.
                </span>
              </span>
            </label>

            {errorMessage && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                {errorMessage}
              </div>
            )}

            {createdCode && (
              <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700">
                    <BsCheckCircle className="text-xl" />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-emerald-700">
                      Sınıf başarıyla oluşturuldu
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-emerald-950">
                      {createdClassName}
                    </h3>

                    <div className="mt-4 rounded-2xl bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                        Sınıf Katılım Kodu
                      </p>
                      <p className="mt-2 font-mono text-3xl font-bold tracking-wider text-slate-950">
                        {createdCode}
                      </p>
                    </div>

                    <Link
                      href="/teacher/classes"
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
                    >
                      Sınıflarıma Git
                      <BsArrowRight />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <BsPlusSquare />
              {loading ? "Sınıf oluşturuluyor..." : "Sınıf Oluştur"}
            </button>
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-700">
              <BsClipboard className="text-xl" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-blue-950">
              Davet kodu nasıl çalışır?
            </h2>

            <p className="mt-3 text-sm leading-7 text-blue-900">
              Sistem otomatik olarak benzersiz bir kod üretir. Öğrenci bu kodu
              sınıfa katılım ekranına girer. Öğretmen onayı açıksa öğrenci
              önce bekleme listesine düşer.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Kaydedilecek tablolar
            </p>

            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">
                  Siniflar
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Sınıf adı, ders, öğretmen, dönem ve aktif kod.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">
                  Davet_Kodlari
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Kod, bağlı sınıf, oluşturan öğretmen ve kullanım limiti.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}