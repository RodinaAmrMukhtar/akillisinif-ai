import Link from "next/link";
import Navbar from "./Navbar";

type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
  activePage?: string;
};

const teacherMenuItems = [
  { label: "Genel Bakış", href: "/dashboard", key: "dashboard" },
  { label: "Sınıflar", href: "/teacher/classes", key: "classes" },
  { label: "Yeni Sınıf", href: "/teacher/classes/new", key: "new-class" },
  { label: "Katılım İstekleri", href: "/teacher/join-requests", key: "requests" },
];

const studentMenuItems = [
  { label: "Sınıflarım", href: "/student/classes", key: "student-classes" },
  { label: "Sınıfa Katıl", href: "/student/join-class", key: "join" },
];

export default function DashboardShell({
  children,
  title,
  description,
  activePage = "dashboard",
}: DashboardShellProps) {
  return (
    <main className="min-h-screen bg-slate-50">
      <Navbar showAuthButtons={false} />

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[270px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-6 rounded-2xl bg-blue-50 p-4">
            <p className="text-sm font-semibold text-blue-800">
              Demo Kullanıcı
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-700">
              Bu panel şu anda arayüz ön izlemesidir. Supabase ve Airtable
              bağlantısı sonraki aşamada eklenecektir.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Öğretmen
              </p>
              <nav className="space-y-1">
                {teacherMenuItems.map((item) => {
                  const isActive = activePage === item.key;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-700 text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div>
              <p className="mb-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                Öğrenci
              </p>
              <nav className="space-y-1">
                {studentMenuItems.map((item) => {
                  const isActive = activePage === item.key;

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`block rounded-xl px-4 py-3 text-sm font-medium transition ${
                        isActive
                          ? "bg-blue-700 text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
              AkıllıSınıf AI v0.1
            </div>
          </div>

          {children}
        </section>
      </div>
    </main>
  );
}