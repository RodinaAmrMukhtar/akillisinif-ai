import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <Navbar variant="dark" />

        <div className="grid flex-1 items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-2 text-sm text-indigo-200">
              Öğrenci performansı için erken uyarı ve akıllı takip sistemi
            </div>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white md:text-7xl">
              Sınıf yönetimini{" "}
              <span className="bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent">
                yapay zekâ
              </span>{" "}
              ile güçlendirin.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              AkıllıSınıf AI; öğretmenlerin sınıf oluşturmasını, öğrencilerin
              sınıf koduyla katılmasını, not-yoklama-ödev verilerinin takip
              edilmesini ve riskli öğrenciler için erken uyarı üretilmesini
              sağlayan modern bir eğitim teknolojisi sistemidir.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/register"
                className="rounded-2xl bg-indigo-500 px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
              >
                Sisteme Başla
              </a>
              <a
                href="/login"
                className="rounded-2xl border border-white/15 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Öğretmen / Öğrenci Girişi
              </a>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-3xl font-bold">20+</p>
                <p className="text-sm text-slate-400">Veri tabanı tablosu</p>
              </div>
              <div>
                <p className="text-3xl font-bold">AI</p>
                <p className="text-sm text-slate-400">Risk analizi</p>
              </div>
              <div>
                <p className="text-3xl font-bold">n8n</p>
                <p className="text-sm text-slate-400">Otomasyon desteği</p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur">
            <div className="rounded-2xl bg-slate-900 p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Öğretmen Paneli</p>
                  <h2 className="text-2xl font-bold">10-A Matematik</h2>
                </div>
                <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  Aktif
                </span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Öğrenci Sayısı</p>
                  <p className="mt-2 text-3xl font-bold">28</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Bekleyen Katılım</p>
                  <p className="mt-2 text-3xl font-bold">3</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Orta Risk</p>
                  <p className="mt-2 text-3xl font-bold text-amber-300">5</p>
                </div>
                <div className="rounded-2xl bg-white/5 p-4">
                  <p className="text-sm text-slate-400">Yüksek Risk</p>
                  <p className="mt-2 text-3xl font-bold text-rose-300">2</p>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-indigo-300/20 bg-indigo-400/10 p-4">
                <p className="text-sm font-semibold text-indigo-200">
                  AI Erken Uyarı
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Bu hafta 2 öğrencide ani not düşüşü ve 3 öğrencide ödev teslim
                  oranında azalma tespit edildi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}