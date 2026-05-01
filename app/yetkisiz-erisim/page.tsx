import Link from "next/link";
import { BsExclamationTriangle, BsHouseDoor, BsShieldLock } from "react-icons/bs";
import Navbar from "@/components/Navbar";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl md:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
            <BsShieldLock className="text-2xl" />
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
            Yetkisiz erişim
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            Bu sayfaya erişim yetkiniz bulunmamaktadır. Lütfen hesabınızın
            rolüne uygun paneli kullanın.
          </p>

          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left">
            <div className="flex gap-3">
              <BsExclamationTriangle className="mt-1 shrink-0 text-amber-700" />
              <p className="text-sm leading-6 text-amber-800">
                Öğrenci hesapları öğretmen sayfalarına, öğretmen hesapları ise
                öğrenciye özel sayfalara doğrudan erişemez. Bu kontrol sistemin
                güvenli rol yönetimi için eklenmiştir.
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              <BsHouseDoor />
              Ana Sayfaya Dön
            </Link>

            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Profilimi Gör
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}