export type TeacherAssignmentSubmission = {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  schoolNumber: string;
  submissionText: string;
  submittedAt: string;
  status: string;
  score: number | null;
  feedback: string;
  late: boolean;
};

export type TeacherAssignment = {
  id: string;
  title: string;
  classId: string;
  className: string;
  courseName: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  assignmentType: string;
  difficulty: string;
  resourceLink: string;
  status: string;
  submittedCount: number;
  gradedCount: number;
  submissions: TeacherAssignmentSubmission[];
};

export type StudentAssignment = {
  id: string;
  title: string;
  classId: string;
  className: string;
  courseName: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  assignmentType: string;
  difficulty: string;
  resourceLink: string;
  status: string;
  submission: null | {
    id: string;
    text: string;
    submittedAt: string;
    status: string;
    points: number | null;
    feedback: string;
  };
};

export async function createAssignment(input: {
  teacherAuthId: string;
  classId: string;
  title: string;
  description: string;
  dueDate: string;
  maxPoints: number;
  assignmentType: string;
  difficulty: string;
  resourceLink: string;
}) {
  const response = await fetch("/api/airtable/assignments/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Ödev oluşturma işlemi başarısız.",
    );
  }

  return result;
}

export async function listTeacherAssignments(teacherAuthId: string) {
  const response = await fetch(
    `/api/airtable/assignments/list?teacherAuthId=${encodeURIComponent(
      teacherAuthId,
    )}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Ödevler listelenemedi.",
    );
  }

  return result.assignments as TeacherAssignment[];
}

export async function gradeAssignmentSubmission(input: {
  teacherAuthId: string;
  submissionId: string;
  score: number;
  feedback: string;
}) {
  const response = await fetch("/api/airtable/assignments/grade", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Teslim değerlendirilemedi.",
    );
  }

  return result;
}

export async function listStudentAssignments(studentAuthId: string) {
  const response = await fetch(
    `/api/airtable/student/assignments/list?studentAuthId=${encodeURIComponent(
      studentAuthId,
    )}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Öğrenci ödevleri listelenemedi.",
    );
  }

  return result.assignments as StudentAssignment[];
}

export async function submitAssignment(input: {
  studentAuthId: string;
  assignmentId: string;
  submissionText: string;
}) {
  const response = await fetch("/api/airtable/student/assignments/submit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Ödev teslim edilemedi.",
    );
  }

  return result;
}
