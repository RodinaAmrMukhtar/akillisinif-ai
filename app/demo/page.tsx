import {
  BsActivity,
  BsArrowRight,
  BsBell,
  BsChatDots,
  BsCheckCircle,
  BsClipboardData,
  BsCollection,
  BsCpu,
  BsPersonPlus,
} from "react-icons/bs";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const teacherFlow = [
  "Öğretmen sisteme kayıt olur ve giriş yapar.",
  "Yeni sınıf oluşturur ve sistem sınıf kodu üretir.",
  "Öğrencilerin katılım isteklerini onaylar.",
  "Ödev, not ve yoklama verilerini işler.",
  "AI risk panelinden risk sinyallerini inceler.",
  "Mesajlaşma ve bildirim merkeziyle öğrencilerle iletişim kurar.",
  "Gerekirse AI destekli müdahale planı oluşturur.",
];

const studentFlow = [
  "Öğrenci sisteme kayıt olur.",
  "Sınıf kodunu kullanarak katılım isteği gönderir.",
  "Öğretmen onayını bekler.",
  "Onay sonrası sınıf içeriklerine erişir.",
  "Notlarını, yoklama durumunu ve ödevlerini görür.",
  "Sınıf mesajlaşmasını ve bildirimlerini takip eder.",
  "AI çalışma asistanından ders ve sistem desteği alır.",
];

const architecture = [
  {
    title: "Frontend",
    text: "Next.js ile geliştirilen modern, beyaz ve mavi temalı arayüz.",
  },
  {
    title: "Auth",
    text: "Supabase ile kullanıcı kayıt, giriş ve rol yönetimi.",
  },
  {
    title: "Database",
    text: "Airtable üzerinde sınıf, öğrenci, ödev, not, yoklama ve risk tabloları.",
  },
  {
    title: "Realtime",
    text: "Supabase Realtime ile chat ve bildirim akışları.",
  },
  {
    title: "AI",
    text: "OpenRouter API ve kontrollü RAG mantığı ile eğitim odaklı asistan.",
  },
  {
    title: "Automation",
    text: "n8n ile risk uyarısı, haftalık rapor ve bildirim otomasyonları.",
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Demo Akışı
            </p>
            <h1 className="mt-3 text-5xl font-bold tracking-tight text-slate-950">
              AkıllıSınıf AI sisteminin uçtan uca çalışma akışı
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              Bu sayfa, öğretmen ve öğrenci perspektifinden sistemin nasıl
              çalıştığını; veri tabanı, mesajlaşma, bildirim, AI asistan ve
              erken uyarı modülleriyle birlikte açıklar.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                <BsCollection className="text-xl" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">
                Sınıf Yönetimi
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sınıf oluşturma ve kodla katılım.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                <BsClipboardData className="text-xl" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">
                Veri Takibi
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ödev, not ve yoklama kayıtları.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                <BsActivity className="text-xl" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">
                Erken Uyarı
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Risk sinyali ve müdahale önerisi.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                <BsChatDots className="text-xl" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">
                Mesajlaşma
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sınıf ve özel görüşme alanları.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
              <div className="inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
                <BsCpu className="text-xl" />
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-950">
                AI Asistan
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Eğitim odaklı kontrollü yardım.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-20 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              Öğretmen Akışı
            </h2>

            <div className="mt-8 space-y-4">
              {teacherFlow.map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-7 text-slate-700">{step}</p>
                  </div>
                  {index < teacherFlow.length - 1 && (
                    <BsArrowRight className="mt-2 hidden text-slate-300 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-950">
              Öğrenci Akışı
            </h2>

            <div className="mt-8 space-y-4">
              {studentFlow.map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm leading-7 text-slate-700">{step}</p>
                  </div>
                  {index < studentFlow.length - 1 && (
                    <BsArrowRight className="mt-2 hidden text-slate-300 lg:block" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
              Teknik Mimari
            </p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-slate-950">
              Ücretsiz ve düşük maliyetli servislerle gerçekçi sistem tasarımı
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              Proje, üretim ortamı mantığına benzeyen ancak prototip geliştirmeye
              uygun, bulut tabanlı ve modüler bir mimari üzerine kurulmuştur.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {architecture.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-6"
              >
                <h3 className="text-xl font-bold text-slate-950">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-8">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-700">
                Akademik Değer
              </p>
              <h2 className="mt-3 text-4xl font-bold tracking-tight text-blue-950">
                Sistem sadece veri göstermez, karar destek sunar.
              </h2>
              <p className="mt-4 text-lg leading-8 text-blue-900">
                Bu proje; öğrenci başarısını tahmin etme, riskli öğrencileri
                erken fark etme, öğretmene müdahale önerisi sunma ve öğrencinin
                çalışma sürecini destekleme yaklaşımıyla klasik sınıf yönetim
                sistemlerinden ayrılır.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <BsCheckCircle className="text-lg text-blue-700" />
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    Veri temelli yaklaşım
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <BsCheckCircle className="text-lg text-blue-700" />
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    Öğretmen karar desteği
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <BsBell className="text-lg text-blue-700" />
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    Bildirim ve takip
                  </p>
                </div>

                <div className="rounded-2xl bg-white p-5 shadow-sm">
                  <BsPersonPlus className="text-lg text-blue-700" />
                  <p className="mt-3 text-sm font-semibold text-slate-950">
                    Öğrenci destek akışı
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