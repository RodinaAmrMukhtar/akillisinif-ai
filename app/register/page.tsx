"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabaseClient";

type UserRole = "Ogretmen" | "Ogrenci";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("Ogretmen");
  const [schoolNumber, setSchoolNumber] = useState("");

  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Lütfen ad soyad alanını doldurun.");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Lütfen e-posta alanını doldurun.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalıdır.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ad_soyad: fullName,
          rol: role,
          okul_no: schoolNumber,
        },
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setErrorMessage("Kayıt oluşturulamadı. Lütfen tekrar deneyin.");
      setLoading(false);
      return;
    }

    setSuccessMessage("Hesap başarıyla oluşturuldu. Yönlendiriliyorsunuz...");

    setTimeout(() => {
      if (role === "Ogrenci") {
        router.push("/student/classes");
      } else {
        router.push("/dashboard");
      }
    }, 800);

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Yeni kullanıcı oluşturma
          </div>

          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
            Öğretmen ve öğrenciler için akıllı başlangıç.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Kayıt sırasında kullanıcı rolü seçilir. Öğretmenler sınıf
            oluşturabilir, öğrenciler ise öğretmenin verdiği sınıf koduyla
            katılım isteği gönderebilir.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">
                Öğretmen hesabı
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sınıf oluşturur, davet kodu üretir, öğrencileri onaylar ve
                performans/risk panelini görür.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">
                Öğrenci hesabı
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sınıf koduyla katılır, kendi notlarını, ödevlerini, devam
                durumunu ve çalışma önerilerini görür.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div>
              <h2 className="text-2xl font-bold text-slate-950">Kayıt Ol</h2>
              <p className="mt-2 text-sm text-slate-500">
                AkıllıSınıf AI hesabınızı oluşturun.
              </p>
            </div>

            <form onSubmit={handleRegister} className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium text-slate-700"
                >
                  Ad Soyad
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Ayşe Yılmaz"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ornek@eposta.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="En az 6 karakter"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="text-sm font-medium text-slate-700"
                >
                  Rol
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(event) => setRole(event.target.value as UserRole)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="Ogretmen">Öğretmen</option>
                  <option value="Ogrenci">Öğrenci</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="schoolNumber"
                  className="text-sm font-medium text-slate-700"
                >
                  Okul No
                </label>
                <input
                  id="schoolNumber"
                  type="text"
                  value={schoolNumber}
                  onChange={(event) => setSchoolNumber(event.target.value)}
                  placeholder="Öğrenciler için opsiyonel"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-700">
                  {errorMessage}
                </div>
              )}

              {successMessage && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-700">
                  {successMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Hesap oluşturuluyor..." : "Hesap Oluştur"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Zaten hesabınız var mı?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-700 hover:text-blue-800"
              >
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}