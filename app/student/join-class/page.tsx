import DashboardShell from "@/components/DashboardShell";

export default function JoinClassPage() {
  return (
    <DashboardShell
      title="Sınıf Koduyla Katıl"
      description="Öğrenciler öğretmen tarafından verilen sınıf kodunu girerek katılım isteği oluşturabilir."
      activePage="join"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Sınıf kodunu girin
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Katılım isteğiniz öğretmene gönderilir. Öğretmen onayladıktan sonra
            sınıf içeriklerine erişebilirsiniz.
          </p>

          <form className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="classCode"
                className="text-sm font-medium text-slate-700"
              >
                Sınıf Kodu
              </label>
              <input
                id="classCode"
                type="text"
                placeholder="MAT-8F3K"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase tracking-widest outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              className="w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              Katılım İsteği Gönder
            </button>
          </form>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h3 className="text-lg font-bold text-blue-950">Nasıl çalışır?</h3>

          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">
                1. Sınıf kodunu gir
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Öğretmenin verdiği aktif sınıf kodunu kullan.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">
                2. Onay bekle
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Katılım isteği öğretmen paneline düşer.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">
                3. Sınıfa eriş
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Onay sonrası ödevleri, notları ve gelişim önerilerini görürsün.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}