export type StudentProgressGrade = {
  id: string;
  title: string;
  classId: string;
  className: string;
  courseName: string;
  gradeType: string;
  score: number | null;
  maxPoints: number | null;
  percentage: number | null;
  date: string;
  description: string;
};

export type StudentProgressAssignment = {
  id: string;
  title: string;
  classId: string;
  className: string;
  courseName: string;
  dueDate: string;
  maxPoints: number;
  assignmentType: string;
  difficulty: string;
  status: string;
  submission: null | {
    id: string;
    status: string;
    text: string;
    submittedAt: string;
    score: number | null;
    feedback: string;
    late: boolean;
  };
};

export type StudentClassProgress = {
  id: string;
  className: string;
  courseName: string;
  gradeAverage: number | null;
  assignmentCount: number;
  submittedAssignmentCount: number;
  submissionRate: number | null;
  attendanceSessionCount: number;
  presentAttendanceCount: number;
  attendanceRate: number | null;
};

export type StudentProgressData = {
  student: {
    id: string;
    name: string;
    email: string;
    schoolNumber: string;
  };
  summary: {
    activeClassCount: number;
    gradeAverage: number | null;
    gradeRecordCount: number;
    assignmentCount: number;
    submittedAssignmentCount: number;
    missingAssignmentCount: number;
    assignmentSubmissionRate: number | null;
    attendanceSessionCount: number;
    presentAttendanceCount: number;
    attendanceRate: number | null;
  };
  classes: StudentClassProgress[];
  grades: StudentProgressGrade[];
  assignments: StudentProgressAssignment[];
};

export async function getStudentProgress(studentAuthId: string) {
  const response = await fetch(
    `/api/airtable/student/progress?studentAuthId=${encodeURIComponent(
      studentAuthId,
    )}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Öğrenci performans verileri yüklenemedi.",
    );
  }

  return {
    student: result.student,
    summary: result.summary,
    classes: result.classes,
    grades: result.grades,
    assignments: result.assignments,
  } as StudentProgressData;
}
