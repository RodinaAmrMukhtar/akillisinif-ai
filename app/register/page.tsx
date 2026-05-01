import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
        <div>
          <div className="mb-6 inline-flex rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
            Yeni kullanıcı oluşturma
          </div>

          <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
            Öğretmen ve öğrenciler için akıllı başlangıç.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Kayıt sırasında kullanıcı rolü seçilir. Öğretmenler sınıf
            oluşturabilir, öğrenciler ise öğretmenin verdiği sınıf koduyla
            katılım isteği gönderebilir.
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">
                Öğretmen hesabı
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sınıf oluşturur, davet kodu üretir, öğrencileri onaylar ve
                performans/risk panelini görür.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-slate-950">
                Öğrenci hesabı
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sınıf koduyla katılır, kendi notlarını, ödevlerini, devam
                durumunu ve çalışma önerilerini görür.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
            <div>
              <h2 className="text-2xl font-bold">Kayıt Ol</h2>
              <p className="mt-2 text-sm text-slate-500">
                AkıllıSınıf AI hesabınızı oluşturun.
              </p>
            </div>

            <form className="mt-8 space-y-5">
              <div>
                <label
                  htmlFor="fullName"
                  className="text-sm font-medium text-slate-700"
                >
                  Ad Soyad
                </label>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Ayşe Yılmaz"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-slate-700"
                >
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="ornek@eposta.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700"
                >
                  Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="En az 6 karakter"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="text-sm font-medium text-slate-700"
                >
                  Rol
                </label>
                <select
                  id="role"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="Ogretmen">Öğretmen</option>
                  <option value="Ogrenci">Öğrenci</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="schoolNumber"
                  className="text-sm font-medium text-slate-700"
                >
                  Okul No
                </label>
                <input
                  id="schoolNumber"
                  type="text"
                  placeholder="Öğrenciler için opsiyonel"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <button
                type="button"
                className="w-full rounded-2xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Hesap Oluştur
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
              Bu ekran şu anda arayüz aşamasındadır. Sonraki aşamada Supabase
              kayıt sistemi ve Airtable kullanıcı kaydı bağlanacaktır.
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
              Zaten hesabınız var mı?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-700 hover:text-blue-800"
              >
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}