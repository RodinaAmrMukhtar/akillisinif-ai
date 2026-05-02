export type WeeklyReport = {
  id: string;
  title: string;
  classId: string;
  className: string;
  weekStart: string;
  weekEnd: string;
  totalStudents: number;
  lowRiskCount: number;
  mediumRiskCount: number;
  highRiskCount: number;
  criticalRiskCount: number;
  mostCommonRiskReason: string;
  reportText: string;
  status: string;
  createdAt: string;
};

export type TeacherWeeklyReportsResponse = {
  ok: boolean;
  message?: string;
  error?: string;
  teacher?: {
    id: string;
    name: string;
    email: string;
  } | null;
  reports: WeeklyReport[];
};

export async function getTeacherWeeklyReports(params: {
  authId: string;
  email?: string;
  name?: string;
}): Promise<TeacherWeeklyReportsResponse> {
  const query = new URLSearchParams();

  if (params.authId) query.set("authId", params.authId);
  if (params.email) query.set("email", params.email);
  if (params.name) query.set("name", params.name);

  const response = await fetch(
    `/api/airtable/weekly-reports/teacher?${query.toString()}`,
    {
      method: "GET",
      cache: "no-store",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ? `${data.message} Detay: ${data.error}` : data.message,
    );
  }

  return data;
}
