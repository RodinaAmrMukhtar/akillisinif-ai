import Link from "next/link";
import { BsArrowRight, BsBoxArrowRight, BsHouseDoor } from "react-icons/bs";
import Navbar from "@/components/Navbar";

export default function LogoutPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <Navbar />

      <section className="mx-auto flex min-h-[calc(100vh-76px)] max-w-7xl items-center justify-center px-6 py-16">
        <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl md:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-50 text-blue-700">
            <BsBoxArrowRight className="text-2xl" />
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-950">
            Çıkış işlemi tamamlandı
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600">
            AkıllıSınıf AI hesabınızdan güvenli şekilde çıkış yaptınız. Ana
            sayfaya dönebilir veya tekrar giriş yapabilirsiniz.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-700 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
            >
              <BsHouseDoor />
              Ana Sayfaya Dön
            </Link>

            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Tekrar Giriş Yap
              <BsArrowRight />
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-left">
            <p className="text-sm font-semibold text-blue-950">
              Oturum bilgisi
            </p>
            <p className="mt-2 text-sm leading-6 text-blue-900">
              Bu sayfaya geldikten sonra panel erişimi için tekrar giriş
              yapmanız gerekir.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}