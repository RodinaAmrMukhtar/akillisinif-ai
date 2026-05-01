import DashboardShell from "@/components/DashboardShell";
import {
  BsBell,
  BsCheckCircle,
  BsClock,
  BsExclamationTriangle,
} from "react-icons/bs";

const notifications = [
  {
    title: "Yeni katılım isteği",
    message: "Ayşe Yılmaz, 10-A Matematik sınıfına katılmak istiyor.",
    type: "Katılım İsteği",
    priority: "Yüksek",
    time: "5 dakika önce",
    read: false,
  },
  {
    title: "Risk sinyali oluşturuldu",
    message:
      "Mehmet Demir için ödev teslim oranı düşüşü nedeniyle yüksek risk sinyali oluştu.",
    type: "Risk Uyarısı",
    priority: "Acil",
    time: "22 dakika önce",
    read: false,
  },
  {
    title: "Ödev teslim tarihi yaklaşıyor",
    message: "Fonksiyonlar Alıştırma Seti için teslim tarihine 1 gün kaldı.",
    type: "Ödev Hatırlatma",
    priority: "Normal",
    time: "Bugün",
    read: true,
  },
  {
    title: "Haftalık rapor hazır",
    message: "10-A Matematik sınıfı için haftalık performans raporu oluşturuldu.",
    type: "Haftalık Rapor",
    priority: "Normal",
    time: "Dün",
    read: true,
  },
];

function priorityStyles(priority: string) {
  if (priority === "Acil") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (priority === "Yüksek") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-blue-100 bg-blue-50 text-blue-700";
}

export default function NotificationsPage() {
  return (
    <DashboardShell
      title="Bildirim Merkezi"
      description="Sistem bildirimleri; katılım istekleri, risk uyarıları, ödev hatırlatmaları, mesajlar ve haftalık raporları tek merkezde toplar."
      activePage="notifications"
    >
      <div className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-950">
                Son Bildirimler
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Bu liste daha sonra Supabase ve Airtable Bildirimler tablosu ile
                gerçek zamanlı hale getirilecektir.
              </p>
            </div>

            <button
              type="button"
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Tümünü okundu işaretle
            </button>
          </div>

          <div className="divide-y divide-slate-200">
            {notifications.map((item) => (
              <div
                key={`${item.title}-${item.time}`}
                className={`p-6 ${item.read ? "bg-white" : "bg-blue-50/40"}`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex gap-4">
                    <div
                      className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        item.priority === "Acil"
                          ? "bg-red-50 text-red-700"
                          : item.priority === "Yüksek"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.priority === "Acil" ? (
                        <BsExclamationTriangle />
                      ) : item.read ? (
                        <BsCheckCircle />
                      ) : (
                        <BsBell />
                      )}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-950">
                          {item.title}
                        </h3>
                        {!item.read && (
                          <span className="rounded-full bg-blue-700 px-2.5 py-1 text-xs font-bold text-white">
                            Yeni
                          </span>
                        )}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.message}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                          {item.type}
                        </span>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${priorityStyles(
                            item.priority,
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <BsClock />
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h2 className="text-xl font-bold text-blue-950">
              Bildirim Mantığı
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Bildirimler öğrencinin veya öğretmenin panelinde gerçek zamanlı
              olarak gösterilecektir. Kritik akademik riskler, katılım
              istekleri ve ödev hatırlatmaları öncelikli bildirimlerdir.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">
              Bildirim Kaynakları
            </h2>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Supabase</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Panel içi canlı bildirimler ve okunma durumları.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">
                  Airtable Bildirimler
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Resmi kayıt ve raporlama amacıyla tutulacak bildirim kopyaları.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">n8n</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Otomatik e-posta, haftalık rapor ve risk uyarısı akışları.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}