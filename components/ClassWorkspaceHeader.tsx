"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import ClassSectionTabs from "@/components/ClassSectionTabs";
import { BsDoorOpen, BsShieldCheck } from "react-icons/bs";

type ClassInfo = {
  id: string;
  name: string;
  courseName: string;
  description: string;
  inviteCode: string;
  status: string;
  requiresApproval: boolean;
};

const T = {
  defaultTitle: "Sınıf Çalışma Alanı",
  defaultDescription:
    "Bu sınıfa ait öğrenciler, ödevler, yoklama, notlar ve tahminler burada yönetilir.",
  joinCode: "Sınıf Katılım Kodu",
  approvalRequired: "Bu sınıfta katılım için öğretmen onayı gereklidir.",
  approvalNotRequired: "Öğrenciler bu kod ile sınıfa katılabilir.",
  active: "Aktif",
};

function extractClassId(pathname: string) {
  const marker = "/teacher/classes/";
  const index = pathname.indexOf(marker);

  if (index === -1) return "";

  const after = pathname.slice(index + marker.length);
  return decodeURIComponent(after.split("/")[0] || "");
}

export default function ClassWorkspaceHeader() {
  const pathname = usePathname();
  const classId = useMemo(() => extractClassId(pathname), [pathname]);

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);

  useEffect(() => {
    async function loadClassInfo() {
      if (!classId) return;

      try {
        const response = await fetch(
          `/api/airtable/classes/section-info?classId=${encodeURIComponent(classId)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (response.ok && data.class) {
          setClassInfo(data.class);
        }
      } catch {
        setClassInfo(null);
      }
    }

    loadClassInfo();
  }, [classId]);

  const title = classInfo?.name || T.defaultTitle;
  const description =
    classInfo?.description ||
    classInfo?.courseName ||
    T.defaultDescription;

  return (
    <section className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-[1.6fr,1fr]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 inline-flex rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700">
            {classInfo?.status || T.active}
          </div>

          <h1 className="text-3xl font-bold text-slate-950">
            {title}
          </h1>

          <p className="mt-3 max-w-3xl text-slate-600">
            {description}
          </p>
        </div>

        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-700">
            <BsDoorOpen />
            {T.joinCode}
          </div>

          <div className="mt-3 text-4xl font-extrabold tracking-widest text-slate-950">
            {classInfo?.inviteCode || "-"}
          </div>

          <div className="mt-4 flex items-start gap-2 text-sm text-slate-700">
            <BsShieldCheck className="mt-0.5 shrink-0" />
            <span>
              {classInfo?.requiresApproval
                ? T.approvalRequired
                : T.approvalNotRequired}
            </span>
          </div>
        </div>
      </div>

      <ClassSectionTabs
        classId={classId}
        showJoinRequests={Boolean(classInfo?.requiresApproval)}
      />
    </section>
  );
}
