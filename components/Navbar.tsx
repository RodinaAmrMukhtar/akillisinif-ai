import Link from "next/link";

type NavbarProps = {
  showAuthButtons?: boolean;
};

export default function Navbar({ showAuthButtons = true }: NavbarProps) {
  return (
    <nav className="flex w-full items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
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

      {showAuthButtons && (
        <div className="flex items-center gap-3">
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
        </div>
      )}
    </nav>
  );
}