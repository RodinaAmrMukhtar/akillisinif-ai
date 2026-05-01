import DashboardShell from "@/components/DashboardShell";
import RiskBadge from "@/components/RiskBadge";
import Link from "next/link";

const studentClasses = [
  {
    title: "10-A Matematik",
    teacher: "Ahmet Ogretmen",
    status: "Aktif",
    average: 72,
    attendance: "86%",
    homework: "70%",
    risk: "Orta" as const,
  },
  {
    title: "9-B Fen Bilimleri",
    teacher: "Selin Ogretmen",
    status: "Onay Bekliyor",
    average: null,
    attendance: null,
    homework: null,
    risk: "Dusuk" as const,
  },
];

export default function StudentClassesPage() {
  return (
    <DashboardShell
      title="Sınıflarım"
      description="Öğrenci panelinde aktif sınıflar, onay bekleyen katılımlar, not durumu, devam oranı ve destekleyici AI önerileri görüntülenir."
      activePage="student-classes"
    >
      <div className="mb-6 flex justify-end">
        <Link
          href="/student/join-class"
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          Sınıf Koduyla Katıl
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {studentClasses.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{item.teacher}</p>
                <h2 className="mt-1 text-xl font-bold text-slate-950">
                  {item.title}
                </h2>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                  item.status === "Aktif"
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {item.status}
              </span>
            </div>

            {item.status === "Aktif" ? (
              <>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Ortalama</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {item.average}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Devam</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {item.attendance}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Ödev</p>
                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {item.homework}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-950">
                      AI Çalışma Önerisi
                    </p>
                    <p className="mt-1 text-sm leading-6 text-blue-900">
                      Bu hafta fonksiyonlar konusundan kısa tekrar ve eksik ödev
                      tamamlama önerilir.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <RiskBadge level={item.risk} />
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">
                  Öğretmen onayı bekleniyor
                </p>
                <p className="mt-1 text-sm leading-6 text-amber-900">
                  Öğretmen katılım isteğinizi onayladıktan sonra sınıf
                  içeriklerini, notları ve gelişim önerilerini görebilirsiniz.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}