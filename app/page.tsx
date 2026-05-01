import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Navbar />

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Öğrenci performansı için erken uyarı ve akıllı takip sistemi
          </div>

          <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">
            Sınıf yönetimini{" "}
            <span className="text-blue-700">yapay zekâ</span> ile güçlendirin.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            AkıllıSınıf AI; öğretmenlerin sınıf oluşturmasını, öğrencilerin
            sınıf koduyla katılmasını, not-yoklama-ödev verilerinin takip
            edilmesini ve riskli öğrenciler için erken uyarı üretilmesini
            sağlayan modern bir eğitim teknolojisi sistemidir.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-2xl bg-blue-700 px-6 py-3 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              Sisteme Başla
            </Link>
            <Link
              href="/login"
              className="rounded-2xl border border-slate-300 px-6 py-3 text-center text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Öğretmen / Öğrenci Girişi
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-bold text-blue-700">20+</p>
              <p className="mt-2 text-sm text-slate-500">Veri tabanı tablosu</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-bold text-blue-700">AI</p>
              <p className="mt-2 text-sm text-slate-500">Risk analizi</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-3xl font-bold text-blue-700">n8n</p>
              <p className="mt-2 text-sm text-slate-500">Otomasyon desteği</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Öğretmen Paneli
                </p>
                <h2 className="text-2xl font-bold text-slate-950">
                  10-A Matematik
                </h2>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Aktif
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Öğrenci Sayısı</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">28</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Bekleyen Katılım</p>
                <p className="mt-2 text-3xl font-bold text-slate-950">3</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Orta Risk</p>
                <p className="mt-2 text-3xl font-bold text-amber-600">5</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm text-slate-500">Yüksek Risk</p>
                <p className="mt-2 text-3xl font-bold text-red-600">2</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-800">
                AI Erken Uyarı
              </p>
              <p className="mt-2 text-sm leading-6 text-blue-900">
                Bu hafta 2 öğrencide ani not düşüşü ve 3 öğrencide ödev teslim
                oranında azalma tespit edildi.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}