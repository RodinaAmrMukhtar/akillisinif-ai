import { NextResponse } from "next/server";
import { AIRTABLE_TABLES, airtableRequest } from "@/lib/airtableClient";

type AirtableRecord<T> = {
  id: string;
  createdTime?: string;
  fields: T;
};

type AirtableListResponse<T> = {
  records: AirtableRecord<T>[];
};

type UserFields = {
  Ad_Soyad?: string;
  Eposta?: string;
  Rol?: string;
  Auth_ID?: string;
  Okul_No?: string;
};

type ClassFields = {
  Sinif_Adi?: string;
  Ders_Adi?: string;
  Ogretmen?: string[];
};

type MembershipFields = {
  Sinif?: string[];
  Kullanici?: string[];
  Uyelik_Rolu?: string;
  Durum?: string;
};

type AssignmentFields = {
  Odev_Basligi?: string;
  Sinif?: string[];
  Ogretmen?: string[];
  Teslim_Tarihi?: string;
  Durum?: string;
  Maksimum_Puan?: number;
};

type SubmissionFields = {
  Odev?: string[];
  Ogrenci?: string[];
  Sinif?: string[];
  Durum?: string;
  Teslim_Tarihi?: string;
  Puan?: number;
  Gec_Mi?: boolean;
  Ogretmen_Geri_Bildirimi?: string;
};

type GradeFields = {
  Not_Kaydi?: string;
  Ogrenci?: string[];
  Sinif?: string[];
  Ogretmen?: string[];
  Not_Turu?: string;
  Puan?: number;
  Maksimum_Puan?: number;
  Agirlik?: number;
  Tarih?: string;
};

type AttendanceFields = {
  Ogrenci?: string[];
  Sinif?: string[];
  Ogretmen?: string[];
  Tarih?: string;
  Durum?: string;
  Ders_Saati?: number;
};

type AttendanceSessionFields = {
  Sinif?: string[];
  Ogretmen?: string[];
  Tarih?: string;
  Ders_Saati?: number;
  Durum?: string;
  Aktif_Mi?: boolean;
};

type AssistantRequestBody = {
  authId?: string;
  role?: string;
  question?: string;
};

const airtableTables = AIRTABLE_TABLES as Record<string, string>;

function table(key: string, fallback: string) {
  return airtableTables[key] || fallback;
}

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
}

function isStudentRole(role?: string) {
  return role === "Ogrenci" || role === "Öğrenci";
}

function isTeacherRole(role?: string) {
  return role === "Ogretmen" || role === "Öğretmen";
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function percentage(score?: number, max?: number) {
  if (typeof score !== "number") return null;
  if (typeof max !== "number" || max <= 0) return null;
  return Math.round((score / max) * 100);
}

function formatPercent(value: number | null) {
  if (value === null) return "veri yok";
  return `${value}%`;
}

async function findUserByAuthId(authId: string) {
  const safeAuthId = escapeAirtableFormulaValue(authId);
  const filterFormula = `{Auth_ID}='${safeAuthId}'`;

  const result = await airtableRequest<AirtableListResponse<UserFields>>(
    `/${encodeURIComponent(
      table("kullanicilar", "Kullanicilar"),
    )}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`,
  );

  return result.records[0];
}

function getRiskLevel(score: number) {
  if (score >= 70) return "Kritik";
  if (score >= 50) return "Yüksek";
  if (score >= 25) return "Orta";
  return "Düşük";
}

function buildTeacherAnswer(input: {
  question: string;
  teacher: AirtableRecord<UserFields>;
  users: AirtableRecord<UserFields>[];
  classes: AirtableRecord<ClassFields>[];
  memberships: AirtableRecord<MembershipFields>[];
  assignments: AirtableRecord<AssignmentFields>[];
  submissions: AirtableRecord<SubmissionFields>[];
  grades: AirtableRecord<GradeFields>[];
  attendance: AirtableRecord<AttendanceFields>[];
  sessions: AirtableRecord<AttendanceSessionFields>[];
}) {
  const question = input.question.toLocaleLowerCase("tr-TR");
  const userMap = new Map(input.users.map((user) => [user.id, user]));

  const teacherClasses = input.classes.filter((classRecord) =>
    (classRecord.fields.Ogretmen || []).includes(input.teacher.id),
  );

  const teacherClassIds = teacherClasses.map((classRecord) => classRecord.id);

  const activeMemberships = input.memberships.filter((membership) => {
    const linkedClasses = membership.fields.Sinif || [];
    return (
      linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
      isStudentRole(membership.fields.Uyelik_Rolu) &&
      membership.fields.Durum === "Aktif"
    );
  });

  const pendingMemberships = input.memberships.filter((membership) => {
    const linkedClasses = membership.fields.Sinif || [];
    return (
      linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
      membership.fields.Durum === "Onay Bekliyor"
    );
  });

  const studentIds = Array.from(
    new Set(activeMemberships.flatMap((membership) => membership.fields.Kullanici || [])),
  );

  const teacherAssignments = input.assignments.filter((assignment) => {
    const linkedClasses = assignment.fields.Sinif || [];
    const linkedTeachers = assignment.fields.Ogretmen || [];

    return (
      linkedTeachers.includes(input.teacher.id) ||
      linkedClasses.some((classId) => teacherClassIds.includes(classId))
    );
  });

  const assignmentIds = teacherAssignments.map((assignment) => assignment.id);

  const teacherSubmissions = input.submissions.filter((submission) => {
    const linkedAssignments = submission.fields.Odev || [];
    const linkedClasses = submission.fields.Sinif || [];

    return (
      linkedAssignments.some((assignmentId) => assignmentIds.includes(assignmentId)) ||
      linkedClasses.some((classId) => teacherClassIds.includes(classId))
    );
  });

  const ungradedSubmissions = teacherSubmissions.filter(
    (submission) => submission.fields.Durum !== "Degerlendirildi",
  );

  const teacherGrades = input.grades.filter((grade) => {
    const linkedClasses = grade.fields.Sinif || [];
    const linkedTeachers = grade.fields.Ogretmen || [];

    return (
      linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
      (linkedTeachers.length === 0 || linkedTeachers.includes(input.teacher.id))
    );
  });

  const teacherSessions = input.sessions.filter((session) => {
    const linkedClasses = session.fields.Sinif || [];
    const linkedTeachers = session.fields.Ogretmen || [];

    return (
      linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
      (linkedTeachers.length === 0 || linkedTeachers.includes(input.teacher.id))
    );
  });

  const teacherAttendance = input.attendance.filter((record) => {
    const linkedClasses = record.fields.Sinif || [];
    const linkedTeachers = record.fields.Ogretmen || [];

    return (
      linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
      (linkedTeachers.length === 0 || linkedTeachers.includes(input.teacher.id))
    );
  });

  const studentSummaries = studentIds.map((studentId) => {
    const studentMemberships = activeMemberships.filter((membership) =>
      (membership.fields.Kullanici || []).includes(studentId),
    );

    const studentClassIds = Array.from(
      new Set(studentMemberships.flatMap((membership) => membership.fields.Sinif || [])),
    );

    const studentAssignments = teacherAssignments.filter((assignment) =>
      (assignment.fields.Sinif || []).some((classId) => studentClassIds.includes(classId)),
    );

    const studentAssignmentIds = studentAssignments.map((assignment) => assignment.id);

    const studentSubmissions = teacherSubmissions.filter((submission) => {
      const linkedStudents = submission.fields.Ogrenci || [];
      const linkedAssignments = submission.fields.Odev || [];

      return (
        linkedStudents.includes(studentId) &&
        linkedAssignments.some((assignmentId) => studentAssignmentIds.includes(assignmentId))
      );
    });

    const submittedAssignmentIds = new Set(
      studentSubmissions.flatMap((submission) => submission.fields.Odev || []),
    );

    const submissionRate =
      studentAssignments.length > 0
        ? Math.round(
            (studentAssignments.filter((assignment) =>
              submittedAssignmentIds.has(assignment.id),
            ).length /
              studentAssignments.length) *
              100,
          )
        : null;

    const studentGrades = teacherGrades.filter((grade) => {
      const linkedStudents = grade.fields.Ogrenci || [];
      const linkedClasses = grade.fields.Sinif || [];

      return (
        linkedStudents.includes(studentId) &&
        linkedClasses.some((classId) => studentClassIds.includes(classId))
      );
    });

    const gradeAverage = average(
      studentGrades
        .map((grade) => percentage(grade.fields.Puan, grade.fields.Maksimum_Puan))
        .filter((value): value is number => value !== null),
    );

    const studentSessions = teacherSessions.filter((session) =>
      (session.fields.Sinif || []).some((classId) => studentClassIds.includes(classId)),
    );

    const presentKeys = new Set(
      teacherAttendance
        .filter((record) => {
          const linkedStudents = record.fields.Ogrenci || [];
          const linkedClasses = record.fields.Sinif || [];

          return (
            linkedStudents.includes(studentId) &&
            linkedClasses.some((classId) => studentClassIds.includes(classId)) &&
            record.fields.Durum === "Geldi"
          );
        })
        .map((record) => {
          const classId = record.fields.Sinif?.[0] || "";
          return `${classId}-${record.fields.Tarih || ""}-${record.fields.Ders_Saati || 1}`;
        }),
    );

    const attendanceRate =
      studentSessions.length > 0
        ? Math.round((presentKeys.size / studentSessions.length) * 100)
        : null;

    let riskScore = 0;

    if (gradeAverage !== null) {
      if (gradeAverage < 50) riskScore += 40;
      else if (gradeAverage < 60) riskScore += 32;
      else if (gradeAverage < 70) riskScore += 22;
      else if (gradeAverage < 80) riskScore += 10;
    } else {
      riskScore += 8;
    }

    if (submissionRate !== null) riskScore += (100 - submissionRate) * 0.25;
    else riskScore += 5;

    if (attendanceRate !== null) riskScore += (100 - attendanceRate) * 0.25;
    else riskScore += 5;

    const finalRiskScore = Math.round(Math.max(0, Math.min(100, riskScore)));

    return {
      studentId,
      studentName: userMap.get(studentId)?.fields.Ad_Soyad || "Öğrenci",
      gradeAverage,
      submissionRate,
      attendanceRate,
      riskScore: finalRiskScore,
      riskLevel: getRiskLevel(finalRiskScore),
    };
  });

  const riskyStudents = studentSummaries
    .filter((student) => ["Yüksek", "Kritik"].includes(student.riskLevel))
    .sort((a, b) => b.riskScore - a.riskScore);

  const lines: string[] = [];

  lines.push("Akademik analiz özeti");
  lines.push("");
  lines.push(`Aktif sınıf sayısı: ${teacherClasses.length}`);
  lines.push(`Aktif öğrenci sayısı: ${studentIds.length}`);
  lines.push(`Bekleyen katılım isteği: ${pendingMemberships.length}`);
  lines.push(`Yayınlanan ödev sayısı: ${teacherAssignments.length}`);
  lines.push(`Değerlendirme bekleyen teslim: ${ungradedSubmissions.length}`);
  lines.push(`Riskli öğrenci sayısı: ${riskyStudents.length}`);
  lines.push("");

  if (question.includes("risk")) {
    lines.push("Risk analizi");
    if (riskyStudents.length === 0) {
      lines.push("Şu anda yüksek veya kritik risk seviyesinde öğrenci görünmüyor.");
    } else {
      for (const student of riskyStudents.slice(0, 5)) {
        lines.push(
          `- ${student.studentName}: ${student.riskLevel} risk, skor ${student.riskScore}. Not: ${formatPercent(student.gradeAverage)}, ödev: ${formatPercent(student.submissionRate)}, yoklama: ${formatPercent(student.attendanceRate)}.`,
        );
      }
    }
  } else if (question.includes("ödev") || question.includes("odev") || question.includes("teslim")) {
    lines.push("Ödev ve teslim analizi");
    lines.push(`Toplam ödev: ${teacherAssignments.length}`);
    lines.push(`Toplam teslim: ${teacherSubmissions.length}`);
    lines.push(`Değerlendirme bekleyen teslim: ${ungradedSubmissions.length}`);
    if (ungradedSubmissions.length > 0) {
      lines.push("Öncelik: Öğretmen ödev sayfasından değerlendirme bekleyen teslimleri puanlamalı.");
    }
  } else if (question.includes("yoklama") || question.includes("devam")) {
    lines.push("Yoklama analizi");
    lines.push(`Yoklama oturumu: ${teacherSessions.length}`);
    lines.push(`Yoklama kaydı: ${teacherAttendance.length}`);
    lines.push("Öneri: Yoklama oranı düşük öğrenciler risk analizi ekranında takip edilmelidir.");
  } else if (question.includes("not") || question.includes("vize") || question.includes("final")) {
    lines.push("Not analizi");
    lines.push(`Toplam not kaydı: ${teacherGrades.length}`);
    lines.push("Öneri: Vize, final ve laboratuvar ağırlıkları 100 toplamına yaklaştırılırsa formül daha açıklanabilir olur.");
  } else {
    lines.push("Genel öneri");
    lines.push("Bugün öncelik sırası: bekleyen katılım istekleri, değerlendirme bekleyen teslimler, yüksek riskli öğrenciler ve eksik yoklama kayıtları.");
  }

  lines.push("");
  lines.push("Sistem önerisi");
  lines.push("Bu cevap gerçek Airtable kayıtlarından üretilen kural tabanlı akademik analizdir. Bir sonraki aşamada OpenRouter bağlantısı ile doğal dil yanıtları güçlendirilebilir.");

  return lines.join("\n");
}

function buildStudentAnswer(input: {
  question: string;
  student: AirtableRecord<UserFields>;
  classes: AirtableRecord<ClassFields>[];
  memberships: AirtableRecord<MembershipFields>[];
  assignments: AirtableRecord<AssignmentFields>[];
  submissions: AirtableRecord<SubmissionFields>[];
  grades: AirtableRecord<GradeFields>[];
  attendance: AirtableRecord<AttendanceFields>[];
  sessions: AirtableRecord<AttendanceSessionFields>[];
}) {
  const question = input.question.toLocaleLowerCase("tr-TR");

  const activeMemberships = input.memberships.filter((membership) => {
    const linkedUsers = membership.fields.Kullanici || [];

    return (
      linkedUsers.includes(input.student.id) &&
      isStudentRole(membership.fields.Uyelik_Rolu) &&
      membership.fields.Durum === "Aktif"
    );
  });

  const activeClassIds = Array.from(
    new Set(activeMemberships.flatMap((membership) => membership.fields.Sinif || [])),
  );

  const activeClasses = input.classes.filter((classRecord) =>
    activeClassIds.includes(classRecord.id),
  );

  const visibleAssignments = input.assignments.filter((assignment) => {
    const linkedClasses = assignment.fields.Sinif || [];
    return (
      linkedClasses.some((classId) => activeClassIds.includes(classId)) &&
      assignment.fields.Durum === "Yayinda"
    );
  });

  const studentSubmissions = input.submissions.filter((submission) =>
    (submission.fields.Ogrenci || []).includes(input.student.id),
  );

  const submittedAssignmentIds = new Set(
    studentSubmissions.flatMap((submission) => submission.fields.Odev || []),
  );

  const missingAssignments = visibleAssignments.filter(
    (assignment) => !submittedAssignmentIds.has(assignment.id),
  );

  const gradedSubmissions = studentSubmissions.filter(
    (submission) => submission.fields.Durum === "Degerlendirildi",
  );

  const studentGrades = input.grades.filter((grade) => {
    const linkedStudents = grade.fields.Ogrenci || [];
    const linkedClasses = grade.fields.Sinif || [];

    return (
      linkedStudents.includes(input.student.id) &&
      linkedClasses.some((classId) => activeClassIds.includes(classId))
    );
  });

  const gradeAverage = average(
    studentGrades
      .map((grade) => percentage(grade.fields.Puan, grade.fields.Maksimum_Puan))
      .filter((value): value is number => value !== null),
  );

  const studentSessions = input.sessions.filter((session) =>
    (session.fields.Sinif || []).some((classId) => activeClassIds.includes(classId)),
  );

  const presentKeys = new Set(
    input.attendance
      .filter((record) => {
        const linkedStudents = record.fields.Ogrenci || [];
        const linkedClasses = record.fields.Sinif || [];

        return (
          linkedStudents.includes(input.student.id) &&
          linkedClasses.some((classId) => activeClassIds.includes(classId)) &&
          record.fields.Durum === "Geldi"
        );
      })
      .map((record) => {
        const classId = record.fields.Sinif?.[0] || "";
        return `${classId}-${record.fields.Tarih || ""}-${record.fields.Ders_Saati || 1}`;
      }),
  );

  const attendanceRate =
    studentSessions.length > 0
      ? Math.round((presentKeys.size / studentSessions.length) * 100)
      : null;

  const submissionRate =
    visibleAssignments.length > 0
      ? Math.round(
          ((visibleAssignments.length - missingAssignments.length) /
            visibleAssignments.length) *
            100,
        )
      : null;

  const lines: string[] = [];

  lines.push("Kişisel akademik analiz");
  lines.push("");
  lines.push(`Aktif sınıf sayısı: ${activeClasses.length}`);
  lines.push(`Not ortalaması: ${formatPercent(gradeAverage)}`);
  lines.push(`Ödev teslim oranı: ${formatPercent(submissionRate)}`);
  lines.push(`Yoklama katılım oranı: ${formatPercent(attendanceRate)}`);
  lines.push(`Eksik ödev sayısı: ${missingAssignments.length}`);
  lines.push(`Değerlendirilmiş teslim sayısı: ${gradedSubmissions.length}`);
  lines.push("");

  if (question.includes("ödev") || question.includes("odev") || question.includes("eksik")) {
    lines.push("Ödev analizi");
    if (missingAssignments.length === 0) {
      lines.push("Şu anda teslim bekleyen ödev görünmüyor.");
    } else {
      for (const assignment of missingAssignments.slice(0, 5)) {
        lines.push(`- ${assignment.fields.Odev_Basligi || "Ödev"} teslim bekliyor.`);
      }
    }
  } else if (question.includes("not") || question.includes("vize") || question.includes("final")) {
    lines.push("Not analizi");
    lines.push(`Toplam not kaydı: ${studentGrades.length}`);
    lines.push(`Genel ortalama: ${formatPercent(gradeAverage)}`);
    if (gradeAverage !== null && gradeAverage < 60) {
      lines.push("Öneri: Not ortalaması düşük görünüyor. Öncelikle düşük puanlı sınav veya ödev kayıtları incelenmeli.");
    } else {
      lines.push("Öneri: Mevcut not düzeyi korunmalı ve eksik teslim oluşmamasına dikkat edilmeli.");
    }
  } else if (question.includes("yoklama") || question.includes("devam")) {
    lines.push("Yoklama analizi");
    lines.push(`Katıldığınız yoklama sayısı: ${presentKeys.size}`);
    lines.push(`Toplam yoklama oturumu: ${studentSessions.length}`);
    if (attendanceRate !== null && attendanceRate < 75) {
      lines.push("Öneri: Yoklama oranı düşük. Devamsızlık risk analizinde olumsuz sinyal oluşturabilir.");
    }
  } else {
    lines.push("Genel öneri");
    lines.push("Öncelik sırası: eksik ödevleri tamamlamak, düşük notlu değerlendirmeleri incelemek ve yoklama katılımını düzenli tutmak.");
  }

  lines.push("");
  lines.push("Sistem önerisi");
  lines.push("Bu cevap gerçek Airtable kayıtlarından üretilen kural tabanlı akademik analizdir.");

  return lines.join("\n");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssistantRequestBody;

    const authId = body.authId?.trim();
    const question = body.question?.trim() || "Genel akademik durumumu analiz et.";

    if (!authId) {
      return NextResponse.json(
        {
          ok: false,
          message: "authId gereklidir.",
        },
        { status: 400 },
      );
    }

    const user = await findUserByAuthId(authId);

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "Kullanıcı Airtable üzerinde bulunamadı.",
        },
        { status: 404 },
      );
    }

    const [
      usersResponse,
      classesResponse,
      membershipsResponse,
      assignmentsResponse,
      submissionsResponse,
      gradesResponse,
      attendanceResponse,
      sessionsResponse,
    ] = await Promise.all([
      airtableRequest<AirtableListResponse<UserFields>>(
        `/${encodeURIComponent(table("kullanicilar", "Kullanicilar"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<ClassFields>>(
        `/${encodeURIComponent(table("siniflar", "Siniflar"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<MembershipFields>>(
        `/${encodeURIComponent(table("sinifUyelikleri", "Sinif_Uyelikleri"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AssignmentFields>>(
        `/${encodeURIComponent(table("odevler", "Odevler"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<SubmissionFields>>(
        `/${encodeURIComponent(table("odevTeslimleri", "Odev_Teslimleri"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<GradeFields>>(
        `/${encodeURIComponent(table("notlar", "Notlar"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AttendanceFields>>(
        `/${encodeURIComponent(table("yoklamalar", "Yoklamalar"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AttendanceSessionFields>>(
        `/${encodeURIComponent(table("yoklamaOturumlari", "Yoklama_Oturumlari"))}?maxRecords=100`,
      ),
    ]);

    const role = body.role || user.fields.Rol || "";

    const answer = isTeacherRole(role)
      ? buildTeacherAnswer({
          question,
          teacher: user,
          users: usersResponse.records,
          classes: classesResponse.records,
          memberships: membershipsResponse.records,
          assignments: assignmentsResponse.records,
          submissions: submissionsResponse.records,
          grades: gradesResponse.records,
          attendance: attendanceResponse.records,
          sessions: sessionsResponse.records,
        })
      : buildStudentAnswer({
          question,
          student: user,
          classes: classesResponse.records,
          memberships: membershipsResponse.records,
          assignments: assignmentsResponse.records,
          submissions: submissionsResponse.records,
          grades: gradesResponse.records,
          attendance: attendanceResponse.records,
          sessions: sessionsResponse.records,
        });

    return NextResponse.json({
      ok: true,
      answer,
      mode: "rule_based_airtable_analysis",
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Akademik asistan yanıtı oluşturulamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
