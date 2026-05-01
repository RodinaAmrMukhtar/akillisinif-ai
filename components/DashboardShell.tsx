import Link from "next/link";
import { IconType } from "react-icons";
import {
  BsActivity,
  BsBook,
  BsBoxArrowRight,
  BsCalendarCheck,
  BsCardChecklist,
  BsClipboardData,
  BsCollection,
  BsGrid1X2,
  BsJournalText,
  BsPersonCheck,
  BsPlusSquare,
} from "react-icons/bs";

type DashboardShellProps = {
  children: React.ReactNode;
  title: string;
  description: string;
  activePage?: string;
};

type MenuItem = {
  label: string;
  href: string;
  key: string;
  icon: IconType;
};

const teacherMenuItems: MenuItem[] = [
  { label: "Genel Bakış", href: "/dashboard", key: "dashboard", icon: BsGrid1X2 },
  { label: "Sınıflar", href: "/teacher/classes", key: "classes", icon: BsCollection },
  { label: "Yeni Sınıf", href: "/teacher/classes/new", key: "new-class", icon: BsPlusSquare },
  { label: "Katılım İstekleri", href: "/teacher/join-requests", key: "requests", icon: BsPersonCheck },
  { label: "Ödevler", href: "/teacher/assignments", key: "assignments", icon: BsCardChecklist },
  { label: "Notlar", href: "/teacher/grades", key: "grades", icon: BsJournalText },
  { label: "Yoklama", href: "/teacher/attendance", key: "attendance", icon: BsCalendarCheck },
  { label: "AI Risk Analizi", href: "/teacher/risk-analysis", key: "risk", icon: BsActivity },
];

const studentMenuItems: MenuItem[] = [
  { label: "Sınıflarım", href: "/student/classes", key: "student-classes", icon: BsBook },
  { label: "Sınıfa Katıl", href: "/student/join-class", key: "join", icon: BsClipboardData },
];

function MenuSection({
  title,
  items,
  activePage,
}: {
  title: string;
  items: MenuItem[];
  activePage: string;
}) {
  return (
    <div>
      <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <nav className="space-y-1">
        {items.map((item) => {
          const isActive = activePage === item.key;
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              <Icon className="shrink-0 text-base" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default function DashboardShell({
  children,
  title,
  description,
  activePage = "dashboard",
}: DashboardShellProps) {
  return (
    <main className="flex min-h-screen bg-slate-50 text-slate-950">
      <aside className="flex w-[292px] shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-700 text-lg font-bold text-white shadow-sm">
              AS
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-bold tracking-tight text-slate-950">
                AkıllıSınıf AI
              </p>
              <p className="truncate text-xs text-slate-500">
                Eğitim Yönetim Paneli
              </p>
            </div>
          </Link>
        </div>

        <div className="flex-1 px-4 py-5">
          <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white">
                DU
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-blue-950">
                  Demo Kullanıcı
                </p>
                <p className="truncate text-xs text-blue-700">Ön izleme modu</p>
              </div>
            </div>

            <p className="mt-3 text-xs leading-5 text-blue-800">
              Supabase ve Airtable bağlantısı sonraki aşamada eklenecektir.
            </p>
          </div>

          <div className="space-y-7">
            <MenuSection
              title="Öğretmen Menüsü"
              items={teacherMenuItems}
              activePage={activePage}
            />

            <MenuSection
              title="Öğrenci Menüsü"
              items={studentMenuItems}
              activePage={activePage}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 p-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
          >
            <BsBoxArrowRight className="shrink-0 text-base" />
            <span>Ana Sayfaya Dön</span>
          </Link>
        </div>
      </aside>

      <section className="min-w-0 flex-1">
        <header className="border-b border-slate-200 bg-white">
          <div className="flex min-h-[92px] items-center justify-between gap-6 px-8 py-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">
                {title}
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>

            <div className="hidden rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800 md:block">
              AkıllıSınıf AI v0.1
            </div>
          </div>
        </header>

        <div className="px-8 py-8">{children}</div>
      </section>
    </main>
  );
}