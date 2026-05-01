import Link from "next/link";
import RiskBadge from "./RiskBadge";

type ClassCardProps = {
  title: string;
  lesson: string;
  code: string;
  students: number;
  pending: number;
  riskLevel: "Dusuk" | "Orta" | "Yuksek" | "Kritik";
  href: string;
};

export default function ClassCard({
  title,
  lesson,
  code,
  students,
  pending,
  riskLevel,
  href,
}: ClassCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{lesson}</p>
          <h3 className="mt-1 text-xl font-bold text-slate-950">{title}</h3>
        </div>
        <RiskBadge level={riskLevel} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Kod</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{code}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Öğrenci</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{students}</p>
        </div>

        <div className="rounded-xl bg-slate-50 p-3">
          <p className="text-xs text-slate-500">Bekleyen</p>
          <p className="mt-1 text-sm font-bold text-slate-900">{pending}</p>
        </div>
      </div>
    </Link>
  );
}