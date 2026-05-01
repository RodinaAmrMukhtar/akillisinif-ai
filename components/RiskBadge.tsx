type RiskBadgeProps = {
  level: "Dusuk" | "Orta" | "Yuksek" | "Kritik";
};

const styles = {
  Dusuk: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Orta: "bg-amber-50 text-amber-700 border-amber-200",
  Yuksek: "bg-red-50 text-red-700 border-red-200",
  Kritik: "bg-rose-100 text-rose-800 border-rose-200",
};

const labels = {
  Dusuk: "Düşük Risk",
  Orta: "Orta Risk",
  Yuksek: "Yüksek Risk",
  Kritik: "Kritik Risk",
};

export default function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${styles[level]}`}
    >
      {labels[level]}
    </span>
  );
}