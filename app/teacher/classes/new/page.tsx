import DashboardShell from "@/components/DashboardShell";

export default function CreateClassPage() {
  return (
    <DashboardShell
      title="Yeni Sınıf Oluştur"
      description="Öğretmenler bu ekrandan yeni sınıf oluşturur. Sistem daha sonra otomatik sınıf kodu üretecek ve öğrenciler bu kodla katılım isteği gönderecektir."
      activePage="new-class"
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.75fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">
            Sınıf Bilgileri
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Bu form şu anda arayüz aşamasındadır. Airtable bağlantısı eklendikten
            sonra bilgiler doğrudan <strong>Siniflar</strong>,{" "}
            <strong>Davet_Kodlari</strong> ve{" "}
            <strong>Sinif_Uyelikleri</strong> tablolarına yazılacaktır.
          </p>

          <form className="mt-8 grid gap-5">
            <div>
              <label
                htmlFor="className"
                className="text-sm font-medium text-slate-700"
              >
                Sınıf Adı
              </label>
              <input
                id="className"
                type="text"
                placeholder="10-A Matematik"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="lessonName"
                className="text-sm font-medium text-slate-700"
              >
                Ders Adı
              </label>
              <input
                id="lessonName"
                type="text"
                placeholder="Matematik"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <label
                  htmlFor="academicYear"
                  className="text-sm font-medium text-slate-700"
                >
                  Akademik Yıl
                </label>
                <select
                  id="academicYear"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option>2025-2026</option>
                  <option>2026-2027</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="term"
                  className="text-sm font-medium text-slate-700"
                >
                  Dönem
                </label>
                <select
                  id="term"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option>1. Donem</option>
                  <option>2. Donem</option>
                  <option>Yaz Donemi</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="level"
                  className="text-sm font-medium text-slate-700"
                >
                  Seviye
                </label>
                <select
                  id="level"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option>9</option>
                  <option>10</option>
                  <option>11</option>
                  <option>12</option>
                  <option>Universite</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="text-sm font-medium text-slate-700"
              >
                Açıklama
              </label>
              <textarea
                id="description"
                rows={5}
                placeholder="Bu sınıf için kısa açıklama yazın."
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <input type="checkbox" defaultChecked className="mt-1" />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Öğretmen onayı gerekli olsun
                </span>
                <span className="mt-1 block text-sm leading-6 text-slate-500">
                  Öğrenci sınıf kodunu girse bile öğretmen onaylamadan sınıfa
                  erişemez.
                </span>
              </span>
            </label>

            <button
              type="button"
              className="rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              Sınıfı Oluştur
            </button>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h3 className="text-lg font-bold text-blue-950">
              Oluşturma sonrası ne olacak?
            </h3>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">
                  1. Sınıf kaydı açılır
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Bilgiler Airtable <strong>Siniflar</strong> tablosuna yazılır.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">
                  2. Davet kodu üretilir
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Örnek: <strong>MAT-8F3K</strong>. Kod{" "}
                  <strong>Davet_Kodlari</strong> tablosuna yazılır.
                </p>
              </div>

              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">
                  3. Öğretmen üyeliği eklenir
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Öğretmen sınıfa <strong>Aktif</strong> rolüyle bağlanır.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-950">
              Örnek sınıf kodu
            </h3>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Kod
              </p>
              <p className="mt-2 text-3xl font-bold tracking-widest text-blue-700">
                MAT-8F3K
              </p>
            </div>
          </div>
        </aside>
      </div>
    </DashboardShell>
  );
}