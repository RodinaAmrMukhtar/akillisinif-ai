import Link from "next/link";
import {
  BsActivity,
  BsArrowRight,
  BsBarChartLine,
  BsCalendarCheck,
  BsClipboardCheck,
  BsPeople,
} from "react-icons/bs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const featureCards = [
  {
    title: "Sınıf Yönetimi",
    description:
      "Öğretmenler sınıf oluşturur, öğrenci katılım isteklerini yönetir ve davet kodu üretir.",
    icon: BsPeople,
  },
  {
    title: "Ödev, Not ve Yoklama",
    description:
      "Akademik süreçler tek platformdan izlenir; ödevler, not kayıtları ve yoklamalar düzenli takip edilir.",
    icon: BsClipboardCheck,
  },
  {
    title: "AI Risk Analizi",
    description:
      "Not düşüşü, devamsızlık artışı ve ödev teslim oranı gibi göstergelerle erken uyarı üretilir.",
    icon: BsActivity,
  },
  {
    title: "Karar Destek Paneli",
    description:
      "Öğretmenler risk sinyallerini görür, öğrenci bazlı müdahale planları oluşturabilir.",
    icon: BsBarChartLine,
  },
];

const workflowSteps = [
  "Öğretmen sisteme giriş yapar ve yeni sınıf oluşturur.",
  "Sistem sınıf için aktif davet kodu üretir.",
  "Öğrenci sınıf koduyla katılım isteği gönderir.",
  "Öğretmen isteği onaylar ve öğrenci sınıfa alınır.",
  "Ödev, not ve yoklama verileri sisteme işlenir.",
  "AI erken uyarı motoru risk sinyalleri üretir.",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <Navbar />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
              Yapay zekâ destekli sınıf performans ve erken uyarı sistemi
            </div>

            <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-slate-950 md:text-7xl">
              Akademik sınıf yönetimini <span className="text-blue-700">veri</span>{" "}
              ve <span className="text-blue-700">yapay zekâ</span> ile güçlendirin.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              AkıllıSınıf AI; öğretmenlerin sınıf oluşturmasını, öğrencilerin
              sınıf koduyla katılmasını, akademik verilerin takip edilmesini ve
              riskli öğrenciler için erken destek kararlarının alınmasını
              sağlayan modern bir eğitim teknolojisi platformudur.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Sisteme Başla
                <BsArrowRight />
              </Link>

              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              >
                Demo Akışını İncele
              </Link>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-bold text-blue-700">20+</p>
                <p className="mt-2 text-sm text-slate-500">Veri tabanı tablosu</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-bold text-blue-700">AI</p>
                <p className="mt-2 text-sm text-slate-500">Risk analizi motoru</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-3xl font-bold text-blue-700">n8n</p>
                <p className="mt-2 text-sm text-slate-500">Otomasyon planı</p>
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
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Sistem Modülleri
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              Profesörlerin görmek isteyeceği temel yapı
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Sistem sadece bir arayüz değil; sınıf yönetimi, veri takibi,
              karar destek mantığı ve otomasyon temelli bütüncül bir akademik
              platform yaklaşımı sunar.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                    <Icon className="text-xl" />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-slate-950">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Çalışma Mantığı
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              Sistem nasıl işler?
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Öğretmen ve öğrenci etkileşimi, veri tabanı kayıtları ve AI risk
              mantığı birlikte çalışarak sürdürülebilir bir sınıf yönetim
              mekanizması oluşturur.
            </p>

            <div className="mt-10 space-y-4">
              {workflowSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-slate-700">{step}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <BsCalendarCheck className="text-xl" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    Veri Kaynakları
                  </p>
                  <p className="text-sm text-slate-500">
                    Yoklama, not, ödev ve üyelik verileri
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    Airtable
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Ana veri tabanı yapısı burada tutulur.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">
                    Supabase
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Kullanıcı kayıt ve giriş işlemlerini yönetecektir.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-950">n8n</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Bildirim, rapor ve otomasyon akışları kurulacaktır.
                  </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm font-semibold text-blue-950">
                    Akademik amaç
                  </p>
                  <p className="mt-1 text-sm leading-6 text-blue-900">
                    Erken uyarı sistemi ile öğretmenin karar verme sürecine
                    destek olmak.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}