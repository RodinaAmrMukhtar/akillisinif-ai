import DashboardShell from "@/components/DashboardShell";
import StatCard from "@/components/StatCard";
import ClassCard from "@/components/ClassCard";
import RiskBadge from "@/components/RiskBadge";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <DashboardShell
      title="Genel Bakış"
      description="AkıllıSınıf AI paneli; sınıf yönetimi, öğrenci katılım istekleri, akademik risk sinyalleri ve erken uyarı özetlerini tek ekranda toplar."
      activePage="dashboard"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Aktif Sınıf"
          value="3"
          description="Öğretmene bağlı aktif sınıf sayısı."
          tone="blue"
        />
        <StatCard
          title="Toplam Öğrenci"
          value="84"
          description="Aktif sınıflardaki toplam öğrenci sayısı."
          tone="slate"
        />
        <StatCard
          title="Bekleyen Katılım"
          value="6"
          description="Öğretmen onayı bekleyen öğrenci istekleri."
          tone="amber"
        />
        <StatCard
          title="Yüksek Risk"
          value="4"
          description="Dikkat gerektiren yüksek riskli öğrenci sayısı."
          tone="red"
        />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Sınıflarım</h2>
              <p className="mt-1 text-sm text-slate-500">
                Aktif sınıflar ve temel performans özeti.
              </p>
            </div>

            <Link
              href="/teacher/classes/new"
              className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Yeni Sınıf
            </Link>
          </div>

          <div className="grid gap-4">
            <ClassCard
              title="10-A Matematik"
              lesson="Matematik"
              code="MAT-8F3K"
              students={28}
              pending={3}
              riskLevel="Orta"
              href="/teacher/classes/10-a-matematik"
            />

            <ClassCard
              title="9-B Fen Bilimleri"
              lesson="Fen Bilimleri"
              code="FEN-3L9Q"
              students={31}
              pending={1}
              riskLevel="Dusuk"
              href="/teacher/classes/9-b-fen"
            />

            <ClassCard
              title="11-C Türkçe"
              lesson="Türkçe"
              code="TRK-7P2A"
              students={25}
              pending={2}
              riskLevel="Yuksek"
              href="/teacher/classes/11-c-turkce"
            />
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              AI Risk Özeti
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Kural tabanlı erken uyarı motorundan örnek çıktı.
            </p>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-amber-900">Ayşe Yılmaz</p>
                  <RiskBadge level="Orta" />
                </div>
                <p className="mt-2 text-sm leading-6 text-amber-900">
                  Son 3 not ortalaması genel ortalamanın 14 puan altına düştü.
                </p>
              </div>

              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-red-900">Mehmet Demir</p>
                  <RiskBadge level="Yuksek" />
                </div>
                <p className="mt-2 text-sm leading-6 text-red-900">
                  Devamsızlık oranı arttı ve ödev teslim oranı %55 seviyesine
                  düştü.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Sistem Durumu
            </h2>

            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Airtable Base</span>
                <span className="text-sm font-semibold text-emerald-700">
                  Hazır
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">Supabase Auth</span>
                <span className="text-sm font-semibold text-amber-700">
                  Bağlanacak
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">n8n Otomasyon</span>
                <span className="text-sm font-semibold text-amber-700">
                  Planlandı
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}