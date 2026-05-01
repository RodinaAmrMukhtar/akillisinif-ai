export type TeacherJoinRequest = {
  id: string;
  studentName: string;
  studentEmail: string;
  schoolNumber: string;
  className: string;
  courseName: string;
  classCode: string;
  requestedAt: string;
  status: string;
};

export type StudentClassMembership = {
  membershipId: string;
  classId: string;
  className: string;
  courseName: string;
  academicYear: string;
  term: string;
  level: string;
  description: string;
  classCode: string;
  status: string;
  joinedAt: string;
};

export async function createStudentJoinRequest(input: {
  studentAuthId: string;
  classCode: string;
}) {
  const response = await fetch("/api/airtable/join-requests/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Sınıf katılım isteği oluşturulamadı.",
    );
  }

  return result as {
    ok: boolean;
    action: string;
    message: string;
    membership: {
      id: string;
      status: string;
    };
    class?: {
      id: string;
      className: string;
      courseName: string;
      classCode: string;
    };
  };
}

export async function listTeacherJoinRequests(teacherAuthId: string) {
  const response = await fetch(
    `/api/airtable/join-requests/list?teacherAuthId=${encodeURIComponent(
      teacherAuthId,
    )}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Katılım istekleri listelenemedi.",
    );
  }

  return result.requests as TeacherJoinRequest[];
}

export async function approveJoinRequest(input: {
  teacherAuthId: string;
  membershipId: string;
}) {
  const response = await fetch("/api/airtable/join-requests/approve", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Katılım isteği onaylanamadı.",
    );
  }

  return result as {
    ok: boolean;
    message: string;
    membership: {
      id: string;
      status: string;
    };
  };
}

export async function listStudentClasses(studentAuthId: string) {
  const response = await fetch(
    `/api/airtable/student/classes/list?studentAuthId=${encodeURIComponent(
      studentAuthId,
    )}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Öğrenci sınıfları listelenemedi.",
    );
  }

  return result.classes as StudentClassMembership[];
}