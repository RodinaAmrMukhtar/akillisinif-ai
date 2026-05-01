import Link from "next/link";

type NavbarProps = {
  variant?: "dark" | "light";
};

export default function Navbar({ variant = "dark" }: NavbarProps) {
  const isDark = variant === "dark";

  return (
    <nav className="flex w-full items-center justify-between">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-lg font-bold text-white shadow-lg shadow-indigo-500/30">
          AS
        </div>

        <div>
          <p
            className={`text-lg font-bold tracking-tight ${
              isDark ? "text-white" : "text-slate-950"
            }`}
          >
            AkıllıSınıf AI
          </p>
          <p className={isDark ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
            Yapay Zekâ Destekli Eğitim Platformu
          </p>
        </div>
      </Link>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
            isDark
              ? "text-slate-200 hover:bg-white/10"
              : "text-slate-700 hover:bg-slate-100"
          }`}
        >
          Giriş Yap
        </Link>

        <Link
          href="/register"
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            isDark
              ? "bg-white text-slate-950 hover:bg-slate-200"
              : "bg-slate-950 text-white hover:bg-slate-800"
          }`}
        >
          Kayıt Ol
        </Link>
      </div>
    </nav>
  );
}