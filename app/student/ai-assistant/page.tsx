import DashboardShell from "@/components/DashboardShell";
import {
  BsCpu,
  BsDatabaseCheck,
  BsPatchCheck,
  BsSend,
  BsShieldCheck,
} from "react-icons/bs";

const allowedTopics = [
  "AkıllıSınıf AI sistemi nasıl kullanılır?",
  "Sınıf koduyla nasıl katılırım?",
  "Notlarımı ve ödevlerimi nereden görürüm?",
  "Ders çalışma planı nasıl yapabilirim?",
  "Programlama konularını nasıl çalışabilirim?",
  "Matematik, fen, Türkçe ve akademik konular",
];

const sampleMessages = [
  {
    role: "student",
    text: "Fonksiyonlar konusuna nasıl çalışmalıyım?",
  },
  {
    role: "assistant",
    text: "Önce fonksiyon tanımı ve grafik yorumlama konularını tekrar etmeni öneririm. Ardından 20 dakikalık kısa alıştırmalarla pekiştirme yapabilirsin. Eksik ödevlerin varsa onları tamamlamak da gelişimini destekler.",
  },
  {
    role: "student",
    text: "Sistemde ödevlerimi nereden görebilirim?",
  },
  {
    role: "assistant",
    text: "Öğrenci panelindeki Sınıflarım bölümünden aktif sınıfını seçerek ödevlerini, notlarını ve devam durumunu görüntüleyebilirsin.",
  },
];

export default function StudentAIAssistantPage() {
  return (
    <DashboardShell
      title="AI Çalışma Asistanı"
      description="Öğrenciler bu alanda sistem kullanımı, ders çalışma, akademik destek ve programlama öğrenimiyle ilgili sorular sorabilir. Konu dışı sorular güvenli biçimde reddedilecektir."
      activePage="student-ai"
    >
      <div className="grid min-h-[720px] gap-6 xl:grid-cols-[1fr_360px]">
        <section className="flex rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <BsCpu />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Öğrenci AI Asistanı
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Eğitim, çalışma ve sistem kullanımı odaklı güvenli asistan.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 bg-slate-50 p-6">
              {sampleMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === "student" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-2xl rounded-3xl border p-5 shadow-sm ${
                      message.role === "student"
                        ? "border-blue-200 bg-blue-700 text-white"
                        : "border-slate-200 bg-white text-slate-950"
                    }`}
                  >
                    <p className="text-sm leading-7">{message.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 p-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <textarea
                  rows={3}
                  placeholder="Ders çalışma, programlama veya sistem kullanımı hakkında soru sorun"
                  className="w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
                />

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    Konu dışı sorular otomatik olarak reddedilecektir.
                  </p>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    Sor
                    <BsSend />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-xl font-bold text-blue-950">
              İzin Verilen Konular
            </h2>

            <div className="mt-5 space-y-3">
              {allowedTopics.map((topic) => (
                <div key={topic} className="flex gap-3 rounded-2xl bg-white p-4">
                  <BsPatchCheck className="mt-1 shrink-0 text-blue-700" />
                  <p className="text-sm leading-6 text-slate-700">{topic}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              RAG Mantığı
            </h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <BsDatabaseCheck />
                  Kontrollü kaynaklar
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sistem rehberi, sınıf kuralları, ödev açıklamaları ve güvenli
                  akademik kaynaklar asistan bağlamı olarak verilecektir.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <BsShieldCheck />
                  Güvenli yanıt
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Eğitim dışı veya uygunsuz konulara yanıt verilmeyecektir.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}