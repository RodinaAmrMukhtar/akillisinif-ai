import DashboardShell from "@/components/DashboardShell";
import {
  BsCpu,
  BsFileEarmarkText,
  BsLightbulb,
  BsSend,
  BsShieldCheck,
} from "react-icons/bs";

const teacherTools = [
  {
    title: "Müdahale Planı Öner",
    description:
      "Riskli öğrenci için haftalık destek planı, kısa hedefler ve takip önerileri üretir.",
  },
  {
    title: "Sınıf Risk Özeti Yaz",
    description:
      "Sınıfın genel risk durumunu öğretmen diliyle kısa rapora dönüştürür.",
  },
  {
    title: "Ödev Geri Bildirimi Hazırla",
    description:
      "Öğrencinin teslim durumuna göre destekleyici geri bildirim taslağı üretir.",
  },
  {
    title: "Çalışma Planı Oluştur",
    description:
      "Öğrenci performansına göre kısa ve uygulanabilir çalışma planı önerir.",
  },
];

const sampleMessages = [
  {
    role: "teacher",
    text: "Mehmet Demir için kısa bir müdahale planı öner.",
  },
  {
    role: "assistant",
    text: "Öğrencinin ödev teslim oranı düşük ve devamsızlık oranı artıyor. İlk hafta eksik ödevlerin listelenmesi, kısa bireysel görüşme yapılması ve 3 günlük küçük çalışma hedefleri belirlenmesi önerilir. İkinci hafta not trendi ve devam durumu tekrar kontrol edilmelidir.",
  },
];

export default function TeacherAIAssistantPage() {
  return (
    <DashboardShell
      title="Öğretmen AI Asistanı"
      description="Öğretmenler bu alanda müdahale planı, sınıf özeti, geri bildirim taslağı ve akademik destek önerileri oluşturabilir. AI çıktıları karar destek amaçlıdır."
      activePage="teacher-ai"
    >
      <div className="grid min-h-[720px] gap-6 xl:grid-cols-[1fr_380px]">
        <section className="flex rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
                  <BsCpu />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-950">
                    Öğretmen Karar Destek Asistanı
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Risk analizi, müdahale planı ve akademik geri bildirim için
                    güvenli AI destek alanı.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-5 bg-slate-50 p-6">
              {sampleMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={`flex ${
                    message.role === "teacher" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-2xl rounded-3xl border p-5 shadow-sm ${
                      message.role === "teacher"
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
                  placeholder="Öğrenci desteği, müdahale planı veya sınıf özeti hakkında soru sorun"
                  className="w-full resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-slate-400"
                />

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    AI çıktıları öğretmen kararını desteklemek için kullanılır.
                  </p>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                  >
                    Oluştur
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
              Hızlı AI Araçları
            </h2>

            <div className="mt-5 space-y-3">
              {teacherTools.map((tool) => (
                <button
                  key={tool.title}
                  type="button"
                  className="w-full rounded-2xl bg-white p-4 text-left shadow-sm transition hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <BsLightbulb className="text-blue-700" />
                    {tool.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {tool.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Etik Kullanım
            </h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <BsShieldCheck />
                  İnsan kontrolü
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  AI karar vermez; öğretmenin karar sürecine destek olur.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                  <BsFileEarmarkText />
                  Açıklanabilir çıktı
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Öneriler hangi akademik risk nedenlerine dayandığını açıkça
                  belirtmelidir.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}