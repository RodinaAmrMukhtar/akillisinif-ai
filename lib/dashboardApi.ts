export type TeacherDashboardClassSummary = {
  id: string;
  className: string;
  courseName: string;
  academicYear: string;
  term: string;
  status: string;
  classCode: string;
  studentCount: number;
  pendingJoinRequestCount: number;
  riskyStudentCount: number;
};

export type TeacherDashboardData = {
  activeClassCount: number;
  totalStudentCount: number;
  pendingJoinRequestCount: number;
  highRiskStudentCount: number;
  classSummaries: TeacherDashboardClassSummary[];
  riskModuleStatus: string;
};

export async function getTeacherDashboard(teacherAuthId: string) {
  const response = await fetch(
    `/api/airtable/dashboard/teacher?teacherAuthId=${encodeURIComponent(
      teacherAuthId,
    )}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Öğretmen dashboard verisi alınamadı.",
    );
  }

  return result.dashboard as TeacherDashboardData;
}
