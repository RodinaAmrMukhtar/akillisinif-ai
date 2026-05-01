import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";

const assignments = [
  {
    title: "Fonksiyonlar Alıştırma Seti",
    className: "10-A Matematik",
    type: "Odev",
    dueDate: "12 Mayıs 2026",
    maxScore: 100,
    status: "Yayında",
    submitted: 21,
    missing: 7,
  },
  {
    title: "Paragraf Analizi Çalışması",
    className: "11-C Türkçe",
    type: "Performans",
    dueDate: "15 Mayıs 2026",
    maxScore: 100,
    status: "Yayında",
    submitted: 18,
    missing: 7,
  },
  {
    title: "Kuvvet ve Hareket Mini Quiz",
    className: "9-B Fen Bilimleri",
    type: "Quiz",
    dueDate: "Geçti",
    maxScore: 50,
    status: "Kapandı",
    submitted: 29,
    missing: 2,
  },
];

export default function AssignmentsPage() {
  return (
    <DashboardShell
      title="Ödevler"
      description="Öğretmenler bu ekrandan ödev, quiz, proje ve performans görevlerini takip eder. Teslim durumu daha sonra Airtable Odevler ve Odev_Teslimleri tablolarından beslenecektir."
      activePage="assignments"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Yayındaki Ödev"
          value="7"
          description="Öğrencilerin erişimine açık görevler."
          tone="blue"
        />
        <StatCard
          title="Yaklaşan Teslim"
          value="3"
          description="Teslim tarihi yaklaşan aktif ödevler."
          tone="amber"
        />
        <StatCard
          title="Eksik Teslim"
          value="16"
          description="Henüz teslim edilmemiş öğrenci görevleri."
          tone="red"
        />
        <StatCard
          title="Değerlendirilen"
          value="42"
          description="Puan ve geri bildirim girilmiş teslimler."
          tone="green"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Ödev Listesi
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Aktif ve kapanmış ödevlerin örnek görünümü.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Yeni Ödev Oluştur
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {assignments.map((item) => (
              <div
                key={item.title}
                className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-950">{item.title}</h3>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                        item.status === "Yayında"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {item.className} • {item.type} • Maksimum puan:{" "}
                    {item.maxScore}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Teslim tarihi: {item.dueDate}
                  </p>
                </div>

                <div className="grid min-w-[220px] grid-cols-2 gap-3">
                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="text-xs text-blue-700">Teslim</p>
                    <p className="mt-1 text-lg font-bold text-blue-900">
                      {item.submitted}
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="text-xs text-red-700">Eksik</p>
                    <p className="mt-1 text-lg font-bold text-red-900">
                      {item.missing}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-xl font-bold text-blue-950">
              Ödev Erken Uyarı Mantığı
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Sistem, ödev teslim oranı düşen öğrenciler için risk sinyali
              oluşturacaktır. Özellikle geç teslim sayısı ve eksik ödev sayısı
              AI risk puanına etki eder.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Airtable bağlantısı
            </h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Odevler</p>
                <p className="mt-1 text-sm text-slate-500">
                  Ödev başlığı, sınıf, konu, öğretmen, teslim tarihi ve durum.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">
                  Odev_Teslimleri
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Öğrenci teslimleri, puan, geç teslim ve öğretmen geri
                  bildirimi.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}