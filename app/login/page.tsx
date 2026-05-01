import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <Navbar variant="light" />

        <div className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-700">
              Güvenli öğretmen ve öğrenci girişi
            </div>

            <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-950 md:text-6xl">
              AkıllıSınıf AI sistemine giriş yapın.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
              Öğretmenler sınıflarını yönetebilir, öğrenciler kendi gelişim
              durumlarını takip edebilir. Giriş sonrası kullanıcı rolüne göre
              uygun panele yönlendirme yapılacaktır.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">
                  Öğretmen Paneli
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sınıf oluşturma, öğrencileri onaylama, not ve yoklama takibi.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-950">
                  Öğrenci Paneli
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Sınıf koduyla katılım, ödevler, notlar ve gelişim önerileri.
                </p>
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-md">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
              <div>
                <h2 className="text-2xl font-bold text-slate-950">Giriş Yap</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Hesabınıza giriş yapmak için bilgilerinizi girin.
                </p>
              </div>

              <form className="mt-8 space-y-5">
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
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
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
                    placeholder="••••••••"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </div>

                <button
                  type="button"
                  className="w-full rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500"
                >
                  Giriş Yap
                </button>
              </form>

              <div className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
                Bu ekran şu anda arayüz aşamasındadır. Bir sonraki aşamada
                Supabase giriş sistemi bağlanacaktır.
              </div>

              <p className="mt-6 text-center text-sm text-slate-500">
                Hesabınız yok mu?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-indigo-600 hover:text-indigo-500"
                >
                  Kayıt olun
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}