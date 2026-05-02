export type TeacherDashboardClass = {
  id: string;
  className: string;
  courseName: string;
  status: string;
  studentCount: number;
  pendingCount: number;
  assignmentCount: number;
  submissionCount: number;
  riskyStudentCount: number;
};

export type TeacherDashboardActivity = {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  href: string;
};

export type TeacherDashboardData = {
  teacher: {
    id: string;
    name: string;
    email: string;
  };
  summary: {
    activeClassCount: number;
    totalStudentCount: number;
    pendingJoinRequestCount: number;
    assignmentCount: number;
    submissionCount: number;
    gradedSubmissionCount: number;
    gradeRecordCount: number;
    attendanceSessionCount: number;
    attendanceRecordCount: number;
    riskyStudentCount: number;
    averageGrade: number | null;
    averageSubmissionRate: number | null;
    averageAttendanceRate: number | null;
  };
  classes: TeacherDashboardClass[];
  recentActivities: TeacherDashboardActivity[];
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
      result?.error || result?.message || "Öğretmen panel verileri yüklenemedi.",
    );
  }

  return {
    teacher: result.teacher,
    summary: result.summary,
    classes: result.classes,
    recentActivities: result.recentActivities,
  } as TeacherDashboardData;
}
