export type TeacherClass = {
  id: string;
  className: string;
  courseName: string;
  academicYear: string;
  term: string;
  level: string;
  description: string;
  classCode: string;
  joinApprovalRequired: boolean;
  status: string;
  studentCount: number;
  riskyStudentCount: number;
};

export type CreateTeacherClassInput = {
  teacherAuthId: string;
  className: string;
  courseName: string;
  academicYear: string;
  term: string;
  level: string;
  description: string;
  maxUsage: number;
  joinApprovalRequired: boolean;
};

export type CreateTeacherClassResult = {
  ok: boolean;
  message: string;
  class: {
    id: string;
    className: string;
    courseName: string;
    academicYear: string;
    term: string;
    level: string;
    description: string;
    classCode: string;
  };
  inviteCode: {
    id: string;
    code: string;
  };
};

export async function createTeacherClass(input: CreateTeacherClassInput) {
  const response = await fetch("/api/airtable/classes/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Sınıf oluşturma işlemi başarısız.",
    );
  }

  return result as CreateTeacherClassResult;
}

export async function listTeacherClasses(teacherAuthId: string) {
  const response = await fetch(
    `/api/airtable/classes/list?teacherAuthId=${encodeURIComponent(
      teacherAuthId,
    )}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Sınıf listeleme işlemi başarısız.",
    );
  }

  return result.classes as TeacherClass[];
}