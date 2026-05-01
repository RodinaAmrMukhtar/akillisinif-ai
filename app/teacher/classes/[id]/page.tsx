import DashboardShell from "@/components/DashboardShell";
import RiskBadge from "@/components/RiskBadge";
import StatCard from "@/components/StatCard";

const students = [
  {
    name: "Ayşe Yılmaz",
    number: "1001",
    average: 72,
    attendance: "86%",
    homework: "70%",
    risk: "Orta" as const,
  },
  {
    name: "Mehmet Demir",
    number: "1002",
    average: 58,
    attendance: "72%",
    homework: "55%",
    risk: "Yuksek" as const,
  },
  {
    name: "Zeynep Arslan",
    number: "1003",
    average: 88,
    attendance: "96%",
    homework: "92%",
    risk: "Dusuk" as const,
  },
];

export default function ClassDetailPage() {
  return (
    <DashboardShell
      title="10-A Matematik"
      description="Sınıf detay ekranı; öğrenciler, sınıf kodu, performans özeti, risk sinyalleri ve öğretmen aksiyonlarını tek yerde gösterir."
      activePage="classes"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Sınıf Kodu"
          value="MAT-8F3K"
          description="Öğrencilerin sınıfa katılmak için kullanacağı aktif kod."
          tone="blue"
        />
        <StatCard
          title="Aktif Öğrenci"
          value="28"
          description="Onaylanmış aktif öğrenci sayısı."
          tone="slate"
        />
        <StatCard
          title="Bekleyen"
          value="3"
          description="Öğretmen onayı bekleyen katılım isteği."
          tone="amber"
        />
        <StatCard
          title="Yüksek Risk"
          value="2"
          description="Yakın takip gerektiren öğrenci sayısı."
          tone="red"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-950">
              Öğrenci Performans Tablosu
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Bu tablo daha sonra Airtable <strong>Ogrenci_Ozetleri</strong>,{" "}
              <strong>Notlar</strong>, <strong>Yoklamalar</strong> ve{" "}
              <strong>Risk_Sinyalleri</strong> tablolarından beslenecektir.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Öğrenci</th>
                  <th className="px-6 py-4">Okul No</th>
                  <th className="px-6 py-4">Ortalama</th>
                  <th className="px-6 py-4">Devam</th>
                  <th className="px-6 py-4">Ödev</th>
                  <th className="px-6 py-4">Risk</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {students.map((student) => (
                  <tr key={student.number} className="bg-white">
                    <td className="px-6 py-4 font-semibold text-slate-950">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.number}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.average}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.attendance}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.homework}
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge level={student.risk} />
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
              AI Sınıf Özeti
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Sınıfta en yaygın risk nedeni ödev teslim oranındaki düşüştür.
              Bu hafta eksik ödev takibi ve kısa konu tekrarı önerilir.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Hızlı İşlemler
            </h2>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                className="w-full rounded-xl bg-blue-700 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-blue-800"
              >
                Yeni Ödev Oluştur
              </button>

              <button
                type="button"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Not Gir
              </button>

              <button
                type="button"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Yoklama Al
              </button>

              <button
                type="button"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Müdahale Planı Oluştur
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Risk Sinyalleri
            </h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Ani Not Düşüşü
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  Ayşe Yılmaz için son 3 not ortalaması düşüş gösteriyor.
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-900">
                  Ödev Teslim Azalması
                </p>
                <p className="mt-1 text-sm leading-6 text-red-900">
                  Mehmet Demir için ödev teslim oranı %55 seviyesine indi.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}