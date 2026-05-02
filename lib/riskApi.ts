export type RiskStudent = {
  studentId: string;
  studentName: string;
  studentEmail: string;
  schoolNumber: string;
  classIds: string[];
  classNames: string[];
  riskScore: number;
  riskLevel: "Düşük" | "Orta" | "Yüksek" | "Kritik";
  recommendation: string;
  signals: string[];
  metrics: {
    gradeAverage: number | null;
    gradeRecordCount: number;
    formulaMode: "weighted" | "simple";
    formulaWeightTotal: number;
    weightedGradeCount: number;
    assignmentCount: number;
    submittedAssignmentCount: number;
    missingAssignmentCount: number;
    submissionRate: number | null;
    lateSubmissionCount: number;
    attendanceSessionCount: number;
    presentAttendanceCount: number;
    attendanceRate: number | null;
    dataCompleteness: number;
  };
};

export type RiskClassSummary = {
  id: string;
  className: string;
  courseName: string;
  studentCount: number;
  riskyStudentCount: number;
};

export type TeacherRiskAnalysis = {
  summary: {
    totalStudents: number;
    criticalRiskCount: number;
    highRiskCount: number;
    mediumRiskCount: number;
    lowRiskCount: number;
    averageGrade: number | null;
    averageAttendance: number | null;
    averageSubmissionRate: number | null;
  };
  classes: RiskClassSummary[];
  students: RiskStudent[];
};

export async function getTeacherRiskAnalysis(teacherAuthId: string) {
  const response = await fetch(
    `/api/airtable/risk/teacher?teacherAuthId=${encodeURIComponent(
      teacherAuthId,
    )}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Risk analizi yüklenemedi.",
    );
  }

  return {
    summary: result.summary,
    classes: result.classes,
    students: result.students,
  } as TeacherRiskAnalysis;
}
