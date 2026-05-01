import Link from "next/link";
import { BsHouseDoor, BsDiagram3 } from "react-icons/bs";

type NavbarProps = {
  showAuthButtons?: boolean;
  showNavigationLinks?: boolean;
};

export default function Navbar({
  showAuthButtons = true,
  showNavigationLinks = true,
}: NavbarProps) {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-700 text-lg font-bold text-white shadow-sm">
            AS
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight text-slate-950">
              AkıllıSınıf AI
            </p>
            <p className="text-xs text-slate-500">
              Yapay Zekâ Destekli Eğitim Platformu
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          {showNavigationLinks && (
            <div className="hidden items-center gap-2 md:flex">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <BsHouseDoor className="text-base" />
                Ana Sayfa
              </Link>

              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                <BsDiagram3 className="text-base" />
                Demo Akışı
              </Link>
            </div>
          )}

          {showAuthButtons && (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Giriş Yap
              </Link>

              <Link
                href="/register"
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
              >
                Kayıt Ol
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}