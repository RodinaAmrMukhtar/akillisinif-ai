export type AttendanceSession = {
  id: string;
  code: string;
  classId: string;
  className: string;
  courseName: string;
  date: string;
  lessonHour: number;
  startsAt: string;
  endsAt: string;
  active: boolean;
  status: string;
  presentCount?: number;
};

export async function createAttendanceSession(input: {
  teacherAuthId: string;
  classId: string;
  lessonHour: number;
}) {
  const response = await fetch("/api/airtable/attendance/sessions/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Yoklama oturumu oluşturulamadı.",
    );
  }

  return result.session as AttendanceSession;
}

export async function listTeacherAttendanceSessions(teacherAuthId: string) {
  const response = await fetch(
    `/api/airtable/attendance/sessions/list?teacherAuthId=${encodeURIComponent(
      teacherAuthId,
    )}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Yoklama oturumları listelenemedi.",
    );
  }

  return result.sessions as AttendanceSession[];
}

export async function lookupAttendanceSession(code: string) {
  const response = await fetch(
    `/api/airtable/attendance/session/lookup?code=${encodeURIComponent(code)}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Yoklama oturumu bulunamadı.",
    );
  }

  return result.session as AttendanceSession;
}

export async function markAttendance(input: {
  studentAuthId: string;
  code: string;
}) {
  const response = await fetch("/api/airtable/attendance/mark", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Yoklama kaydı oluşturulamadı.",
    );
  }

  return result;
}
