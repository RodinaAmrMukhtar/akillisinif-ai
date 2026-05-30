"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ClassSectionTabsProps = {
  classId: string;
  showJoinRequests?: boolean;
};

const T = {
  overview: "Genel",
  students: "Öğrenciler",
  assignments: "Ödevler",
  attendance: "Yoklama",
  grades: "Notlar",
  predictions: "Tahminler",
  joinRequests: "Katılım İstekleri",
};

export default function ClassSectionTabs({
  classId,
  showJoinRequests = false,
}: ClassSectionTabsProps) {
  const pathname = usePathname();

  const items = [
    { label: T.overview, href: `/teacher/classes/${classId}`, exact: true },
    { label: T.students, href: `/teacher/classes/${classId}/ogrenciler` },
    { label: T.assignments, href: `/teacher/classes/${classId}/odevler` },
    { label: T.attendance, href: `/teacher/classes/${classId}/yoklama` },
    { label: T.grades, href: `/teacher/classes/${classId}/notlar` },
    { label: T.predictions, href: `/teacher/classes/${classId}/tahminler` },
    ...(showJoinRequests
      ? [{ label: T.joinRequests, href: `/teacher/classes/${classId}/katilim-istekleri` }]
      : []),
  ];

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                isActive
                  ? "bg-blue-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
              ].join(" ")}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
