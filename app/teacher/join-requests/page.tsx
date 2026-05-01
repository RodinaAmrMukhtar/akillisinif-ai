import DashboardShell from "@/components/DashboardShell";

const requests = [
  {
    name: "Ayşe Yılmaz",
    className: "10-A Matematik",
    code: "MAT-8F3K",
    date: "Bugün",
  },
  {
    name: "Emir Kaya",
    className: "11-C Türkçe",
    code: "TRK-7P2A",
    date: "Dün",
  },
  {
    name: "Zeynep Arslan",
    className: "9-B Fen Bilimleri",
    code: "FEN-3L9Q",
    date: "2 gün önce",
  },
];

export default function JoinRequestsPage() {
  return (
    <DashboardShell
      title="Katılım İstekleri"
      description="Sınıf kodu ile katılım isteği gönderen öğrenciler burada öğretmen onayına sunulur."
      activePage="requests"
    >
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-950">
            Onay Bekleyen Öğrenciler
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Bu liste şu anda örnek veridir. Airtable bağlantısı sonraki aşamada
            eklenecektir.
          </p>
        </div>

        <div className="divide-y divide-slate-200">
          {requests.map((request) => (
            <div
              key={`${request.name}-${request.className}`}
              className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-950">{request.name}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {request.className} sınıfına katılmak istiyor.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Kod: {request.code} • {request.date}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Reddet
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  Onayla
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}