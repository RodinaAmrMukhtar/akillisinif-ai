import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function RegisterPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <Navbar variant="dark" />

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
              Yeni kullanıcı oluşturma
            </div>

            <h1 className="max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
              Öğretmen ve öğrenciler için akıllı başlangıç.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Kayıt sırasında kullanıcı rolü seçilir. Öğretmenler sınıf
              oluşturabilir, öğrenciler ise öğretmenin verdiği sınıf koduyla
              katılım isteği gönderebilir.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">
                  Öğretmen hesabı
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Sınıf oluşturur, davet kodu üretir, öğrencileri onaylar ve
                  performans/risk panelini görür.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <p className="text-sm font-semibold text-white">
                  Öğrenci hesabı
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Sınıf koduyla katılır, kendi notlarını, ödevlerini, devam
                  durumunu ve çalışma önerilerini görür.
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur">
              <div>
                <h2 className="text-2xl font-bold">Kayıt Ol</h2>
                <p className="mt-2 text-sm text-slate-300">
                  AkıllıSınıf AI hesabınızı oluşturun.
                </p>
              </div>

              <form className="mt-8 space-y-5">
                <div>
                  <label
                    htmlFor="fullName"
                    className="text-sm font-medium text-slate-200"
                  >
                    Ad Soyad
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Ayşe Yılmaz"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-400/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-200"
                  >
                    E-posta
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="ornek@eposta.com"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-400/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-200"
                  >
                    Şifre
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="En az 6 karakter"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-400/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="text-sm font-medium text-slate-200"
                  >
                    Rol
                  </label>
                  <select
                    id="role"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-400/10"
                  >
                    <option value="Ogretmen">Öğretmen</option>
                    <option value="Ogrenci">Öğrenci</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="schoolNumber"
                    className="text-sm font-medium text-slate-200"
                  >
                    Okul No
                  </label>
                  <input
                    id="schoolNumber"
                    type="text"
                    placeholder="Öğrenciler için opsiyonel"
                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-400/10"
                  />
                </div>

                <button
                  type="button"
                  className="w-full rounded-2xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400"
                >
                  Hesap Oluştur
                </button>
              </form>

              <div className="mt-6 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-4 text-sm leading-6 text-cyan-100">
                Bu ekran şu anda arayüz aşamasındadır. Bir sonraki aşamada
                Supabase kayıt sistemi ve Airtable kullanıcı kaydı bağlanacaktır.
              </div>

              <p className="mt-6 text-center text-sm text-slate-300">
                Zaten hesabınız var mı?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-cyan-300 hover:text-cyan-200"
                >
                  Giriş yapın
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}