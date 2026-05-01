import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-lg font-bold text-white">
              AS
            </div>

            <div>
              <p className="text-lg font-bold text-slate-950">AkıllıSınıf AI</p>
              <p className="text-xs text-slate-500">
                Yapay zekâ destekli eğitim platformu
              </p>
            </div>
          </div>

          <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600">
            AkıllıSınıf AI; sınıf yönetimi, öğrenci performans takibi, erken
            uyarı mantığı, öğretmen karar desteği, mesajlaşma ve AI destekli
            çalışma asistanı modüllerini bir araya getiren akademik proje
            prototipidir.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Sayfalar
          </p>

          <div className="mt-4 space-y-3">
            <Link href="/" className="block text-sm text-slate-600 hover:text-blue-700">
              Ana Sayfa
            </Link>
            <Link href="/demo" className="block text-sm text-slate-600 hover:text-blue-700">
              Demo Akışı
            </Link>
            <Link href="/login" className="block text-sm text-slate-600 hover:text-blue-700">
              Giriş Yap
            </Link>
            <Link href="/register" className="block text-sm text-slate-600 hover:text-blue-700">
              Kayıt Ol
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Sistem Bileşenleri
          </p>

          <div className="mt-4 space-y-3 text-sm text-slate-600">
            <p>Next.js arayüz</p>
            <p>Airtable veri tabanı</p>
            <p>Supabase kimlik doğrulama</p>
            <p>Supabase chat ve bildirim</p>
            <p>OpenRouter AI asistan</p>
            <p>n8n otomasyon akışları</p>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-6 py-5 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>© 2026 AkıllıSınıf AI. Akademik proje prototipi.</p>
          <p>Öğretmen karar desteği ve erken uyarı sistemi</p>
        </div>
      </div>
    </footer>
  );
}