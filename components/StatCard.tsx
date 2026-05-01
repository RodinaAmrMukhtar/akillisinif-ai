type StatCardProps = {
  title: string;
  value: string;
  description: string;
  tone?: "blue" | "green" | "amber" | "red" | "slate";
};

const toneStyles = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-red-50 text-red-700 border-red-100",
  slate: "bg-slate-50 text-slate-700 border-slate-100",
};

export default function StatCard({
  title,
  value,
  description,
  tone = "blue",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`mb-4 inline-flex rounded-xl border px-3 py-1 text-xs font-semibold ${toneStyles[tone]}`}
      >
        {title}
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}