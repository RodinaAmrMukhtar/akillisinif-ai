import DashboardShell from "@/components/DashboardShell";
import RiskBadge from "@/components/RiskBadge";
import StatCard from "@/components/StatCard";

const gradeRows = [
  {
    student: "Ayşe Yılmaz",
    className: "10-A Matematik",
    type: "Quiz",
    topic: "Fonksiyonlar",
    score: 62,
    maxScore: 100,
    trend: "Düşüyor",
    risk: "Orta" as const,
  },
  {
    student: "Mehmet Demir",
    className: "10-A Matematik",
    type: "Sınav",
    topic: "Denklemler",
    score: 48,
    maxScore: 100,
    trend: "Ani Düşüş",
    risk: "Yuksek" as const,
  },
  {
    student: "Zeynep Arslan",
    className: "9-B Fen Bilimleri",
    type: "Proje",
    topic: "Kuvvet",
    score: 91,
    maxScore: 100,
    trend: "Stabil",
    risk: "Dusuk" as const,
  },
];

export default function GradesPage() {
  return (
    <DashboardShell
      title="Notlar"
      description="Öğrenci notları, sınav sonuçları, quiz puanları ve not trendleri bu ekranda takip edilir. Not düşüşleri erken uyarı sisteminin ana sinyallerinden biridir."
      activePage="grades"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Not Kaydı"
          value="126"
          description="Sistemdeki toplam not/puan kaydı."
          tone="blue"
        />
        <StatCard
          title="Sınıf Ortalaması"
          value="74"
          description="Örnek sınıflar genel akademik ortalaması."
          tone="slate"
        />
        <StatCard
          title="Ani Düşüş"
          value="5"
          description="Son notlarda belirgin düşüş yaşayan öğrenci."
          tone="red"
        />
        <StatCard
          title="Stabil"
          value="61"
          description="Performansı dengeli devam eden öğrenci sayısı."
          tone="green"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Not Takip Tablosu
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Bu tablo daha sonra Airtable Notlar tablosundan beslenecektir.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Yeni Not Gir
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Öğrenci</th>
                  <th className="px-6 py-4">Sınıf</th>
                  <th className="px-6 py-4">Tür</th>
                  <th className="px-6 py-4">Konu</th>
                  <th className="px-6 py-4">Puan</th>
                  <th className="px-6 py-4">Trend</th>
                  <th className="px-6 py-4">Risk</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {gradeRows.map((row) => (
                  <tr key={`${row.student}-${row.topic}`}>
                    <td className="px-6 py-4 font-semibold text-slate-950">
                      {row.student}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.className}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{row.type}</td>
                    <td className="px-6 py-4 text-slate-600">{row.topic}</td>
                    <td className="px-6 py-4 font-semibold text-slate-950">
                      {row.score}/{row.maxScore}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          row.trend === "Ani Düşüş"
                            ? "border-red-200 bg-red-50 text-red-700"
                            : row.trend === "Düşüyor"
                              ? "border-amber-200 bg-amber-50 text-amber-700"
                              : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {row.trend}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge level={row.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-xl font-bold text-blue-950">
              Not Analizi Mantığı
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Sistem genel ortalama, son 3 not ortalaması ve sınıf ortalamasına
              göre farkı hesaplayarak risk puanı üretir.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Örnek Risk Kuralı
            </h2>

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">
                Ani not düşüşü
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Eğer öğrencinin son 3 not ortalaması genel ortalamasından 15
                puan veya daha fazla düşükse sistem risk sinyali oluşturur.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}