import DashboardShell from "@/components/DashboardShell";
import ClassCard from "@/components/ClassCard";
import Link from "next/link";

export default function TeacherClassesPage() {
  return (
    <DashboardShell
      title="Sınıflar"
      description="Öğretmenin oluşturduğu sınıflar, aktif sınıf kodları ve temel risk özetleri burada görüntülenir."
      activePage="classes"
    >
      <div className="mb-6 flex justify-end">
        <Link
          href="/teacher/classes/new"
          className="rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          Yeni Sınıf Oluştur
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ClassCard
          title="10-A Matematik"
          lesson="Matematik"
          code="MAT-8F3K"
          students={28}
          pending={3}
          riskLevel="Orta"
          href="/teacher/classes/10-a-matematik"
        />

        <ClassCard
          title="9-B Fen Bilimleri"
          lesson="Fen Bilimleri"
          code="FEN-3L9Q"
          students={31}
          pending={1}
          riskLevel="Dusuk"
          href="/teacher/classes/9-b-fen"
        />

        <ClassCard
          title="11-C Türkçe"
          lesson="Türkçe"
          code="TRK-7P2A"
          students={25}
          pending={2}
          riskLevel="Yuksek"
          href="/teacher/classes/11-c-turkce"
        />
      </div>
    </DashboardShell>
  );
}