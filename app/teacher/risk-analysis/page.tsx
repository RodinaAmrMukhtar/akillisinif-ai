import DashboardShell from "@/components/DashboardShell";
import RiskBadge from "@/components/RiskBadge";
import StatCard from "@/components/StatCard";

const riskRows = [
  {
    student: "Mehmet Demir",
    className: "10-A Matematik",
    riskScore: 78,
    risk: "Yuksek" as const,
    mainReason: "Ödev teslim oranı düşük ve devamsızlık artıyor.",
    action: "Eksik ödev takibi ve bireysel görüşme önerilir.",
  },
  {
    student: "Ayşe Yılmaz",
    className: "10-A Matematik",
    riskScore: 55,
    risk: "Orta" as const,
    mainReason: "Son 3 not ortalaması genel ortalamanın altında.",
    action: "Kısa konu tekrarı ve ek alıştırma önerilir.",
  },
  {
    student: "Zeynep Arslan",
    className: "9-B Fen Bilimleri",
    riskScore: 18,
    risk: "Dusuk" as const,
    mainReason: "Performans dengeli devam ediyor.",
    action: "Mevcut çalışma düzeni korunabilir.",
  },
];

export default function RiskAnalysisPage() {
  return (
    <DashboardShell
      title="AI Risk Analizi"
      description="Öğrenci performans verileri kullanılarak risk puanı, risk seviyesi, ana risk nedenleri ve önerilen öğretmen aksiyonları bu ekranda gösterilir."
      activePage="risk"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Düşük Risk"
          value="61"
          description="Normal ilerleyen öğrenci sayısı."
          tone="green"
        />
        <StatCard
          title="Orta Risk"
          value="14"
          description="Takip edilmesi önerilen öğrenciler."
          tone="amber"
        />
        <StatCard
          title="Yüksek Risk"
          value="6"
          description="Öğretmen müdahalesi önerilen öğrenciler."
          tone="red"
        />
        <StatCard
          title="Kritik Risk"
          value="3"
          description="Öncelikli destek gerektiren öğrenciler."
          tone="red"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-950">
              Öğrenci Risk Listesi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Bu tablo daha sonra Ogrenci_Ozetleri, Risk_Sinyalleri ve
              Tahminler tablolarından beslenecektir.
            </p>
          </div>

          <div className="divide-y divide-slate-200">
            {riskRows.map((row) => (
              <div key={row.student} className="p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-950">
                        {row.student}
                      </h3>
                      <RiskBadge level={row.risk} />
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {row.className}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Risk Puanı
                    </p>
                    <p className="mt-1 text-2xl font-bold text-slate-950">
                      {row.riskScore}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-950">
                      Ana Risk Nedeni
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {row.mainReason}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-950">
                      Önerilen Aksiyon
                    </p>
                    <p className="mt-2 text-sm leading-6 text-blue-900">
                      {row.action}
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
              Risk Skoru Formülü
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              İlk sürümde sistem kural tabanlı çalışacaktır. Not düşüşü,
              devamsızlık, ödev teslim oranı ve sınıf ortalamasına göre fark
              birlikte değerlendirilir.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Puanlama Mantığı
            </h2>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Ani not düşüşü</span>
                <span className="text-sm font-bold text-slate-950">+30</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">
                  Devamsızlık yüksek
                </span>
                <span className="text-sm font-bold text-slate-950">+25</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">
                  Ödev teslim oranı düşük
                </span>
                <span className="text-sm font-bold text-slate-950">+25</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">
                  Sınıf ortalamasından uzak
                </span>
                <span className="text-sm font-bold text-slate-950">+10</span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Düşük katılım</span>
                <span className="text-sm font-bold text-slate-950">+10</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Etik Kullanım Notu
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Risk analizi öğrenciyi etiketlemek için değil, öğretmene erken
              destek kararı vermek için kullanılır. Nihai karar her zaman insan
              kontrolünde olmalıdır.
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}
