export type TeacherClassDetail = {
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
  activeStudentCount: number;
  pendingRequestCount: number;
  riskyStudentCount: number;
};

export type TeacherClassStudent = {
  membershipId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  schoolNumber: string;
  status: string;
  joinedAt: string;
};

export type TeacherClassDetailResult = {
  class: TeacherClassDetail;
  activeStudents: TeacherClassStudent[];
  pendingRequests: TeacherClassStudent[];
};

export type StudentClassDetailResult = {
  class: {
    id: string;
    className: string;
    courseName: string;
    academicYear: string;
    term: string;
    level: string;
    description: string;
    classCode: string;
    status: string;
  };
  membership: {
    id: string;
    status: string;
    joinedAt: string;
  };
};

export async function getTeacherClassDetail(input: {
  teacherAuthId: string;
  classId: string;
}) {
  const response = await fetch(
    `/api/airtable/classes/detail?teacherAuthId=${encodeURIComponent(
      input.teacherAuthId,
    )}&classId=${encodeURIComponent(input.classId)}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Sınıf detay verisi alınamadı.",
    );
  }

  return {
    class: result.class,
    activeStudents: result.activeStudents,
    pendingRequests: result.pendingRequests,
  } as TeacherClassDetailResult;
}

export async function getStudentClassDetail(input: {
  studentAuthId: string;
  classId: string;
}) {
  const response = await fetch(
    `/api/airtable/student/classes/detail?studentAuthId=${encodeURIComponent(
      input.studentAuthId,
    )}&classId=${encodeURIComponent(input.classId)}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Öğrenci sınıf detay verisi alınamadı.",
    );
  }

  return {
    class: result.class,
    membership: result.membership,
  } as StudentClassDetailResult;
}
