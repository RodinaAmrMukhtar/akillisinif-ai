import {
  BsBell,
  BsCheckCircle,
  BsClock,
  BsExclamationTriangle,
} from "react-icons/bs";
import DashboardShell from "@/components/DashboardShell";

const notifications = [
  {
    title: "Yeni katılım isteği",
    message:
      "10-A Matematik sınıfına yeni bir öğrenci katılım isteği gönderdi.",
    type: "Öğretmen bildirimi",
    time: "10 dakika önce",
    status: "Okunmadı",
    icon: BsBell,
  },
  {
    title: "Ödev teslim tarihi yaklaşıyor",
    message:
      "Programlama Temelleri ödevi için teslim tarihine 1 gün kaldı.",
    type: "Ödev hatırlatması",
    time: "45 dakika önce",
    status: "Okunmadı",
    icon: BsClock,
  },
  {
    title: "AI risk sinyali oluşturuldu",
    message:
      "Bir öğrencide not düşüşü ve eksik ödev eğilimi tespit edildi.",
    type: "Erken uyarı",
    time: "Bugün",
    status: "Okunmadı",
    icon: BsExclamationTriangle,
  },
  {
    title: "Haftalık rapor hazırlandı",
    message:
      "Sınıf performans özeti ve önerilen müdahale adımları oluşturuldu.",
    type: "Rapor",
    time: "Dün",
    status: "Okundu",
    icon: BsCheckCircle,
  },
];

export default function NotificationsPage() {
  return (
    <DashboardShell
      title="Bildirim Merkezi"
      description="Katılım istekleri, ödev hatırlatmaları, risk uyarıları ve sistem raporları bu merkezde görüntülenir."
      activePage="notifications"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="space-y-4">
          {notifications.map((notification) => {
            const Icon = notification.icon;
            const unread = notification.status === "Okunmadı";

            return (
              <div
                key={notification.title}
                className={`rounded-3xl border p-5 shadow-sm ${
                  unread
                    ? "border-blue-100 bg-blue-50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
                      unread
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <Icon className="text-lg" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h2 className="text-lg font-bold text-slate-950">
                        {notification.title}
                      </h2>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                          unread
                            ? "bg-white text-blue-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {notification.status}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {notification.message}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {notification.type}
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                        {notification.time}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Özet
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-950">3</h2>
            <p className="mt-2 text-sm text-slate-600">
              Okunmamış bildirim
            </p>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
            <p className="text-sm font-semibold text-blue-950">
              Gerçek zamanlı bildirim planı
            </p>
            <p className="mt-2 text-sm leading-7 text-blue-900">
              Sonraki aşamada bu bildirimler Supabase Realtime ve n8n
              otomasyonlarıyla canlı olarak güncellenecektir.
            </p>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}