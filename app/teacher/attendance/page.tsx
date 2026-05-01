import DashboardShell from "@/components/DashboardShell";
import RiskBadge from "@/components/RiskBadge";
import StatCard from "@/components/StatCard";

const attendanceRows = [
  {
    student: "Ayşe Yılmaz",
    className: "10-A Matematik",
    status: "Geldi",
    attendanceRate: "86%",
    absentHours: 8,
    risk: "Orta" as const,
  },
  {
    student: "Mehmet Demir",
    className: "10-A Matematik",
    status: "Gelmedi",
    attendanceRate: "72%",
    absentHours: 18,
    risk: "Yuksek" as const,
  },
  {
    student: "Zeynep Arslan",
    className: "9-B Fen Bilimleri",
    status: "Geldi",
    attendanceRate: "96%",
    absentHours: 2,
    risk: "Dusuk" as const,
  },
];

export default function AttendancePage() {
  return (
    <DashboardShell
      title="Yoklama"
      description="Öğretmenler bu ekrandan ders yoklamasını takip eder. Devamsızlık artışı erken uyarı sisteminde önemli bir risk göstergesidir."
      activePage="attendance"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Bugünkü Yoklama"
          value="3"
          description="Bugün işlenen sınıf yoklaması sayısı."
          tone="blue"
        />
        <StatCard
          title="Gelen"
          value="76"
          description="Bugün yoklamada gelen öğrenciler."
          tone="green"
        />
        <StatCard
          title="Gelmeyen"
          value="8"
          description="Bugün yoklamada gelmeyen öğrenciler."
          tone="red"
        />
        <StatCard
          title="Geç Gelen"
          value="5"
          description="Bugün geç gelen öğrenci kayıtları."
          tone="amber"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Yoklama Kayıtları
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Bu tablo daha sonra Airtable Yoklamalar tablosundan beslenecektir.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Yoklama Al
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-4">Öğrenci</th>
                  <th className="px-6 py-4">Sınıf</th>
                  <th className="px-6 py-4">Bugünkü Durum</th>
                  <th className="px-6 py-4">Devam Oranı</th>
                  <th className="px-6 py-4">Devamsız Saat</th>
                  <th className="px-6 py-4">Risk</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200">
                {attendanceRows.map((row) => (
                  <tr key={`${row.student}-${row.className}`}>
                    <td className="px-6 py-4 font-semibold text-slate-950">
                      {row.student}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.className}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          row.status === "Geldi"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.attendanceRate}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {row.absentHours}
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
              Devamsızlık Erken Uyarısı
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Öğrencinin devamsızlık oranı belirlenen eşik değerin üstüne
              çıktığında veya son haftalarda hızlı artış gösterdiğinde sistem
              risk sinyali oluşturur.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Örnek Kural
            </h2>

            <div className="mt-5 rounded-2xl bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-950">
                Devamsızlık artışı
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Eğer öğrencinin devamsızlık oranı %20 üstüne çıkarsa veya son 2
                haftada belirgin artış olursa sistem öğretmene uyarı verir.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}