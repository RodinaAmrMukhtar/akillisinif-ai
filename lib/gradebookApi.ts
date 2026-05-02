export type GradebookStudent = {
  id: string;
  name: string;
  email: string;
  schoolNumber: string;
};

export type GradebookClass = {
  id: string;
  className: string;
  courseName: string;
  students: GradebookStudent[];
};

export type TeacherManualGrade = {
  id: string;
  title: string;
  classId: string;
  className: string;
  courseName: string;
  studentId: string;
  studentName: string;
  gradeType: string;
  score: number;
  maxPoints: number;
  weight: number;
  date: string;
  description: string;
};

export type TeacherGradebookData = {
  classes: GradebookClass[];
  grades: TeacherManualGrade[];
};

export async function getTeacherGradebook(teacherAuthId: string) {
  const response = await fetch(
    `/api/airtable/grades/teacher?teacherAuthId=${encodeURIComponent(
      teacherAuthId,
    )}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Not defteri verileri yüklenemedi.",
    );
  }

  return {
    classes: result.classes,
    grades: result.grades,
  } as TeacherGradebookData;
}

export async function createManualGrade(input: {
  teacherAuthId: string;
  classId: string;
  studentId: string;
  gradeTitle: string;
  gradeType: string;
  score: number;
  maxPoints: number;
  weight: number;
  date: string;
  description: string;
}) {
  const response = await fetch("/api/airtable/grades/teacher", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Not kaydı oluşturulamadı.",
    );
  }

  return result;
}
