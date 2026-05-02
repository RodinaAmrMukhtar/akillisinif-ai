import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
};

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

const TABLES = {
  kullanicilar: "Kullanicilar",
  siniflar: "Siniflar",
  sinifUyelikleri: "Sinif_Uyelikleri",
  odevler: "Odevler",
  odevTeslimleri: "Odev_Teslimleri",
  notlar: "Notlar",
  yoklamalar: "Yoklamalar",
  yoklamaOturumlari: "Yoklama_Oturumlari",
};

function getAutomationSecret() {
  return process.env.AUTOMATION_SECRET?.trim() || "";
}

function getAirtableToken() {
  return process.env.AIRTABLE_TOKEN?.trim() || "";
}

function getAirtableBaseId() {
  return process.env.AIRTABLE_BASE_ID?.trim() || "";
}

function isAuthorized(request: Request) {
  const expectedSecret = getAutomationSecret();

  if (!expectedSecret) {
    return false;
  }

  const requestSecret = request.headers.get("x-automation-secret")?.trim() || "";
  return requestSecret === expectedSecret;
}

function asLinks(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function hasAnyLink(value: unknown, ids: string[]) {
  const links = asLinks(value);
  return links.some((id) => ids.includes(id));
}

function getString(value: unknown) {
  return String(value || "").trim();
}

function getNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function isTeacher(user: AirtableRecord) {
  const role = getString(user.fields.Rol).toLowerCase();
  return role === "ogretmen" || role === "öğretmen";
}

function isActiveClass(classRecord: AirtableRecord) {
  const status = getString(classRecord.fields.Durum).toLowerCase();
  return status !== "pasif" && status !== "arsivlendi";
}

function isActiveStudentMembership(membership: AirtableRecord) {
  const role = getString(membership.fields.Uyelik_Rolu).toLowerCase();
  const status = getString(membership.fields.Durum).toLowerCase();

  const isStudent = role === "ogrenci" || role === "öğrenci";
  const isActive = status === "aktif";

  return isStudent && isActive;
}

function isPendingMembership(membership: AirtableRecord) {
  const status = getString(membership.fields.Durum).toLowerCase();
  return status === "onay bekliyor";
}

function isPublishedAssignment(assignment: AirtableRecord) {
  const status = getString(assignment.fields.Durum).toLowerCase();
  return status !== "taslak" && status !== "arsivlendi";
}

function isSubmissionGraded(submission: AirtableRecord) {
  const status = getString(submission.fields.Durum).toLowerCase();
  const score = getNumber(submission.fields.Puan);

  return (
    status === "degerlendirildi" ||
    status === "değerlendirildi" ||
    score !== null
  );
}

function isPresentAttendance(attendance: AirtableRecord) {
  const status = getString(attendance.fields.Durum).toLowerCase();

  return status === "geldi" || status === "gec geldi" || status === "geç geldi";
}

async function listAll(tableName: string): Promise<AirtableRecord[]> {
  const token = getAirtableToken();
  const baseId = getAirtableBaseId();

  if (!token || token === "PASTE_YOUR_AIRTABLE_PAT_TOKEN_HERE") {
    throw new Error("AIRTABLE_TOKEN Vercel environment variable içinde eksik.");
  }

  if (!baseId) {
    throw new Error("AIRTABLE_BASE_ID Vercel environment variable içinde eksik.");
  }

  let offset = "";
  const records: AirtableRecord[] = [];

  do {
    const url = new URL(
      `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`,
    );

    url.searchParams.set("pageSize", "100");

    if (offset) {
      url.searchParams.set("offset", offset);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();

      throw new Error(
        `Airtable tablo okuma hatası. Tablo: ${tableName}. Durum: ${response.status}. Detay: ${details}`,
      );
    }

    const result = (await response.json()) as {
      records?: AirtableRecord[];
      offset?: string;
    };

    records.push(...(result.records || []));
    offset = result.offset || "";
  } while (offset);

  return records;
}

function calculateGradeAverage(grades: AirtableRecord[]) {
  const percentages = grades
    .map((grade) => {
      const score = getNumber(grade.fields.Puan);
      const maxScore = getNumber(grade.fields.Maksimum_Puan) || 100;

      if (score === null || maxScore <= 0) {
        return null;
      }

      return (score / maxScore) * 100;
    })
    .filter((value): value is number => value !== null);

  if (percentages.length === 0) {
    return null;
  }

  return round(
    percentages.reduce((total, value) => total + value, 0) / percentages.length,
  );
}

function calculateRiskScore(params: {
  gradeAverage: number | null;
  submissionRate: number | null;
  attendanceRate: number | null;
}) {
  let score = 0;

  if (params.gradeAverage === null) {
    score += 15;
  } else if (params.gradeAverage < 50) {
    score += 40;
  } else if (params.gradeAverage < 60) {
    score += 32;
  } else if (params.gradeAverage < 70) {
    score += 22;
  } else if (params.gradeAverage < 80) {
    score += 10;
  }

  if (params.submissionRate === null) {
    score += 5;
  } else {
    score += (100 - params.submissionRate) * 0.25;
  }

  if (params.attendanceRate === null) {
    score += 5;
  } else {
    score += (100 - params.attendanceRate) * 0.25;
  }

  return Math.max(0, Math.min(100, round(score)));
}

function getRiskLevel(score: number) {
  if (score >= 75) {
    return "Yüksek";
  }

  if (score >= 50) {
    return "Orta";
  }

  return "Düşük";
}

function buildReportText(params: {
  teacherName: string;
  summary: {
    activeClassCount: number;
    activeStudentCount: number;
    pendingJoinRequestCount: number;
    assignmentCount: number;
    submissionCount: number;
    ungradedSubmissionCount: number;
    attendanceSessionCount: number;
    attendanceRecordCount: number;
    riskyStudentCount: number;
  };
  riskyStudents: {
    studentName: string;
    gradeAverage: number | null;
    submissionRate: number | null;
    attendanceRate: number | null;
    riskScore: number;
    riskLevel: string;
  }[];
}) {
  const lines = [
    "AkıllıSınıf AI Haftalık Sistem Raporu",
    "",
    `Öğretmen: ${params.teacherName}`,
    "",
    "Genel Özet:",
    `- Aktif sınıf sayısı: ${params.summary.activeClassCount}`,
    `- Aktif öğrenci sayısı: ${params.summary.activeStudentCount}`,
    `- Onay bekleyen katılım isteği: ${params.summary.pendingJoinRequestCount}`,
    `- Toplam ödev sayısı: ${params.summary.assignmentCount}`,
    `- Toplam teslim sayısı: ${params.summary.submissionCount}`,
    `- Değerlendirme bekleyen teslim sayısı: ${params.summary.ungradedSubmissionCount}`,
    `- Yoklama oturumu sayısı: ${params.summary.attendanceSessionCount}`,
    `- Yoklama kaydı sayısı: ${params.summary.attendanceRecordCount}`,
    `- Riskli öğrenci sayısı: ${params.summary.riskyStudentCount}`,
    "",
    "Riskli Öğrenciler:",
  ];

  if (params.riskyStudents.length === 0) {
    lines.push("- Bu hafta belirgin riskli öğrenci tespit edilmedi.");
  } else {
    for (const student of params.riskyStudents.slice(0, 10)) {
      lines.push(
        `- ${student.studentName}: Risk ${student.riskScore}/100 (${student.riskLevel}), Not ortalaması: ${
          student.gradeAverage ?? "veri yok"
        }, Ödev teslim oranı: ${
          student.submissionRate ?? "veri yok"
        }, Yoklama oranı: ${student.attendanceRate ?? "veri yok"}`,
      );
    }
  }

  return lines.join("\n");
}

export async function GET(request: Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Yetkisiz otomasyon isteği.",
        },
        { status: 401 },
      );
    }

    const [
      users,
      classes,
      memberships,
      assignments,
      submissions,
      grades,
      attendanceRecords,
      attendanceSessions,
    ] = await Promise.all([
      listAll(TABLES.kullanicilar),
      listAll(TABLES.siniflar),
      listAll(TABLES.sinifUyelikleri),
      listAll(TABLES.odevler),
      listAll(TABLES.odevTeslimleri),
      listAll(TABLES.notlar),
      listAll(TABLES.yoklamalar),
      listAll(TABLES.yoklamaOturumlari),
    ]);

    const teachers = users.filter(isTeacher);

    const reports = teachers.map((teacher) => {
      const teacherId = teacher.id;
      const teacherName = getString(teacher.fields.Ad_Soyad) || "Öğretmen";
      const teacherEmail = getString(teacher.fields.Eposta);

      const teacherClasses = classes.filter((classRecord) => {
        return (
          isActiveClass(classRecord) &&
          hasAnyLink(classRecord.fields.Ogretmen, [teacherId])
        );
      });

      const classIds = teacherClasses.map((classRecord) => classRecord.id);

      const classMemberships = memberships.filter((membership) =>
        hasAnyLink(membership.fields.Sinif, classIds),
      );

      const activeStudentMemberships = classMemberships.filter(
        isActiveStudentMembership,
      );

      const pendingMemberships = classMemberships.filter(isPendingMembership);

      const activeStudentIds = Array.from(
        new Set(
          activeStudentMemberships.flatMap((membership) =>
            asLinks(membership.fields.Kullanici),
          ),
        ),
      );

      const teacherAssignments = assignments.filter((assignment) => {
        return (
          isPublishedAssignment(assignment) &&
          (hasAnyLink(assignment.fields.Ogretmen, [teacherId]) ||
            hasAnyLink(assignment.fields.Sinif, classIds))
        );
      });

      const assignmentIds = teacherAssignments.map((assignment) => assignment.id);

      const teacherSubmissions = submissions.filter((submission) =>
        hasAnyLink(submission.fields.Odev, assignmentIds),
      );

      const ungradedSubmissions = teacherSubmissions.filter(
        (submission) => !isSubmissionGraded(submission),
      );

      const teacherAttendanceSessions = attendanceSessions.filter((session) =>
        hasAnyLink(session.fields.Sinif, classIds),
      );

      const teacherAttendanceRecords = attendanceRecords.filter((attendance) =>
        hasAnyLink(attendance.fields.Sinif, classIds),
      );

      const teacherGrades = grades.filter((grade) => {
        return (
          hasAnyLink(grade.fields.Ogretmen, [teacherId]) ||
          hasAnyLink(grade.fields.Sinif, classIds)
        );
      });

      const studentSummaries = activeStudentIds.map((studentId) => {
        const student = users.find((user) => user.id === studentId);
        const studentName = getString(student?.fields?.Ad_Soyad) || "Öğrenci";

        const studentMemberships = activeStudentMemberships.filter(
          (membership) => hasAnyLink(membership.fields.Kullanici, [studentId]),
        );

        const studentClassIds = Array.from(
          new Set(
            studentMemberships.flatMap((membership) =>
              asLinks(membership.fields.Sinif),
            ),
          ),
        );

        const studentAssignments = teacherAssignments.filter((assignment) =>
          hasAnyLink(assignment.fields.Sinif, studentClassIds),
        );

        const studentAssignmentIds = studentAssignments.map(
          (assignment) => assignment.id,
        );

        const studentSubmissions = teacherSubmissions.filter((submission) => {
          return (
            hasAnyLink(submission.fields.Ogrenci, [studentId]) &&
            hasAnyLink(submission.fields.Odev, studentAssignmentIds)
          );
        });

        const submissionRate =
          studentAssignments.length > 0
            ? round((studentSubmissions.length / studentAssignments.length) * 100)
            : null;

        const studentGrades = teacherGrades.filter((grade) =>
          hasAnyLink(grade.fields.Ogrenci, [studentId]),
        );

        const gradeAverage = calculateGradeAverage(studentGrades);

        const studentAttendanceSessions = teacherAttendanceSessions.filter(
          (session) => hasAnyLink(session.fields.Sinif, studentClassIds),
        );

        const studentAttendanceRecords = teacherAttendanceRecords.filter(
          (attendance) => hasAnyLink(attendance.fields.Ogrenci, [studentId]),
        );

        const presentAttendanceCount =
          studentAttendanceRecords.filter(isPresentAttendance).length;

        const attendanceRate =
          studentAttendanceSessions.length > 0
            ? round(
                (presentAttendanceCount / studentAttendanceSessions.length) *
                  100,
              )
            : null;

        const riskScore = calculateRiskScore({
          gradeAverage,
          submissionRate,
          attendanceRate,
        });

        return {
          studentId,
          studentName,
          gradeAverage,
          submissionRate,
          attendanceRate,
          riskScore,
          riskLevel: getRiskLevel(riskScore),
        };
      });

      const riskyStudents = studentSummaries
        .filter((student) => {
          return (
            student.riskScore >= 50 ||
            (student.gradeAverage !== null && student.gradeAverage < 60) ||
            (student.submissionRate !== null && student.submissionRate < 70) ||
            (student.attendanceRate !== null && student.attendanceRate < 70)
          );
        })
        .sort((a, b) => b.riskScore - a.riskScore);

      const summary = {
        activeClassCount: teacherClasses.length,
        activeStudentCount: activeStudentIds.length,
        pendingJoinRequestCount: pendingMemberships.length,
        assignmentCount: teacherAssignments.length,
        submissionCount: teacherSubmissions.length,
        ungradedSubmissionCount: ungradedSubmissions.length,
        attendanceSessionCount: teacherAttendanceSessions.length,
        attendanceRecordCount: teacherAttendanceRecords.length,
        riskyStudentCount: riskyStudents.length,
      };

      const reportText = buildReportText({
        teacherName,
        summary,
        riskyStudents,
      });

      return {
        teacherId,
        teacherName,
        teacherEmail,
        summary,
        riskyStudents,
        reportText,
      };
    });

    return NextResponse.json({
      ok: true,
      mode: "weekly_airtable_report",
      generatedAt: new Date().toISOString(),
      reportCount: reports.length,
      reports,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Haftalık otomasyon raporu oluşturulamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
