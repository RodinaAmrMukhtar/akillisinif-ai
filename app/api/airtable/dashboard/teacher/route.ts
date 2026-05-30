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

type AirtableUserFields = {
  Ad_Soyad?: string;
  Eposta?: string;
  Rol?: string;
  Auth_ID?: string;
  Okul_No?: string;
};

type AirtableClassFields = {
  Sinif_Adi?: string;
  Ders_Adi?: string;
  Ogretmen?: string[];
  Durum?: string;
  Olusturma_Tarihi?: string;
};

type AirtableMembershipFields = {
  Uyelik_Adi?: string;
  Sinif?: string[];
  Kullanici?: string[];
  Uyelik_Rolu?: string;
  Durum?: string;
  Katilma_Tarihi?: string;
};

type AirtableAssignmentFields = {
  Odev_Basligi?: string;
  Sinif?: string[];
  Ogretmen?: string[];
  Teslim_Tarihi?: string;
  Durum?: string;
  Maksimum_Puan?: number;
};

type AirtableSubmissionFields = {
  Odev?: string[];
  Ogrenci?: string[];
  Sinif?: string[];
  Durum?: string;
  Teslim_Tarihi?: string;
  Puan?: number;
  Gec_Mi?: boolean;
};

type AirtableGradeFields = {
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

type AirtableAttendanceFields = {
  Ogrenci?: string[];
  Sinif?: string[];
  Ogretmen?: string[];
  Tarih?: string;
  Durum?: string;
  Ders_Saati?: number;
};

type AirtableAttendanceSessionFields = {
  Sinif?: string[];
  Ogretmen?: string[];
  Oturum_Kodu?: string;
  Tarih?: string;
  Ders_Saati?: number;
  Durum?: string;
  Aktif_Mi?: boolean;
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

function average(values: number[]) {
  if (values.length === 0) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function gradePercentage(grade: AirtableRecord<AirtableGradeFields>) {
  const score = grade.fields.Puan;
  const maxPoints = grade.fields.Maksimum_Puan;

  if (typeof score !== "number") return null;
  if (typeof maxPoints !== "number" || maxPoints <= 0) return null;

  return Math.round((score / maxPoints) * 100);
}

function normalizeWeight(raw?: number) {
  if (typeof raw !== "number") return 0;
  if (raw <= 1) return Math.round(raw * 100);
  return Math.round(raw);
}

function calculateFormulaGrade(grades: AirtableRecord<AirtableGradeFields>[]) {
  const weightedGrades = grades
    .map((grade) => {
      const percentage = gradePercentage(grade);
      const weight = normalizeWeight(grade.fields.Agirlik);

      return {
        percentage,
        weight,
      };
    })
    .filter(
      (grade): grade is { percentage: number; weight: number } =>
        grade.percentage !== null && grade.weight > 0,
    );

  if (weightedGrades.length > 0) {
    const totalWeight = weightedGrades.reduce(
      (sum, grade) => sum + grade.weight,
      0,
    );

    const weightedTotal = weightedGrades.reduce(
      (sum, grade) => sum + grade.percentage * grade.weight,
      0,
    );

    return totalWeight > 0 ? Math.round(weightedTotal / totalWeight) : null;
  }

  const simpleGrades = grades
    .map((grade) => gradePercentage(grade))
    .filter((value): value is number => value !== null);

  return average(simpleGrades);
}

function getRiskLevel(score: number) {
  if (score >= 70) return "Kritik";
  if (score >= 50) return "Yüksek";
  if (score >= 25) return "Orta";
  return "Düşük";
}

async function findTeacherByAuthId(authId: string) {
  const safeAuthId = escapeAirtableFormulaValue(authId);
  const filterFormula = `{Auth_ID}='${safeAuthId}'`;

  const result = await airtableRequest<AirtableListResponse<AirtableUserFields>>(
    `/${encodeURIComponent(
      table("kullanicilar", "Kullanicilar"),
    )}?filterByFormula=${encodeURIComponent(filterFormula)}&maxRecords=1`,
  );

  return result.records[0];
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const teacherAuthId = url.searchParams.get("teacherAuthId")?.trim();

    if (!teacherAuthId) {
      return NextResponse.json(
        {
          ok: false,
          message: "teacherAuthId parametresi gereklidir.",
        },
        { status: 400 },
      );
    }

    const teacher = await findTeacherByAuthId(teacherAuthId);

    if (!teacher) {
      return NextResponse.json(
        {
          ok: false,
          message: "Öğretmen Airtable üzerinde bulunamadı.",
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
      attendanceSessionsResponse,
    ] = await Promise.all([
      airtableRequest<AirtableListResponse<AirtableUserFields>>(
        `/${encodeURIComponent(table("kullanicilar", "Kullanicilar"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableClassFields>>(
        `/${encodeURIComponent(table("siniflar", "Siniflar"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
        `/${encodeURIComponent(table("sinifUyelikleri", "Sinif_Uyelikleri"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableAssignmentFields>>(
        `/${encodeURIComponent(table("odevler", "Odevler"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableSubmissionFields>>(
        `/${encodeURIComponent(table("odevTeslimleri", "Odev_Teslimleri"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableGradeFields>>(
        `/${encodeURIComponent(table("notlar", "Notlar"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableAttendanceFields>>(
        `/${encodeURIComponent(table("yoklamalar", "Yoklamalar"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableAttendanceSessionFields>>(
        `/${encodeURIComponent(table("yoklamaOturumlari", "Yoklama_Oturumlari"))}?maxRecords=100`,
      ),
    ]);

    const userMap = new Map(usersResponse.records.map((user) => [user.id, user]));

    const teacherClasses = classesResponse.records.filter((classRecord) => {
      const teacherLinks = classRecord.fields.Ogretmen || [];
      return teacherLinks.includes(teacher.id);
    });

    const teacherClassIds = teacherClasses.map((classRecord) => classRecord.id);

    const classMap = new Map(
      teacherClasses.map((classRecord) => [classRecord.id, classRecord]),
    );

    const activeStudentMemberships = membershipsResponse.records.filter((membership) => {
      const linkedUsers = membership.fields.Kullanici || [];
      const linkedClasses = membership.fields.Sinif || [];

      return (
        linkedUsers.length > 0 &&
        linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
        isStudentRole(membership.fields.Uyelik_Rolu) &&
        membership.fields.Durum === "Aktif"
      );
    });

    const pendingMemberships = membershipsResponse.records.filter((membership) => {
      const linkedClasses = membership.fields.Sinif || [];

      return (
        linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
        membership.fields.Durum === "Onay Bekliyor"
      );
    });

    const studentIds = Array.from(
      new Set(
        activeStudentMemberships.flatMap(
          (membership) => membership.fields.Kullanici || [],
        ),
      ),
    );

    const teacherAssignments = assignmentsResponse.records.filter((assignment) => {
      const linkedTeachers = assignment.fields.Ogretmen || [];
      const linkedClasses = assignment.fields.Sinif || [];

      return (
        linkedTeachers.includes(teacher.id) ||
        linkedClasses.some((classId) => teacherClassIds.includes(classId))
      );
    });

    const teacherAssignmentIds = teacherAssignments.map((assignment) => assignment.id);

    const teacherSubmissions = submissionsResponse.records.filter((submission) => {
      const linkedAssignments = submission.fields.Odev || [];
      const linkedClasses = submission.fields.Sinif || [];

      return (
        linkedAssignments.some((assignmentId) =>
          teacherAssignmentIds.includes(assignmentId),
        ) ||
        linkedClasses.some((classId) => teacherClassIds.includes(classId))
      );
    });

    const teacherGrades = gradesResponse.records.filter((grade) => {
      const linkedClasses = grade.fields.Sinif || [];
      const linkedTeachers = grade.fields.Ogretmen || [];

      return (
        linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
        (linkedTeachers.length === 0 || linkedTeachers.includes(teacher.id))
      );
    });

    const teacherAttendanceSessions = attendanceSessionsResponse.records.filter(
      (session) => {
        const linkedClasses = session.fields.Sinif || [];
        const linkedTeachers = session.fields.Ogretmen || [];

        return (
          linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
          (linkedTeachers.length === 0 || linkedTeachers.includes(teacher.id))
        );
      },
    );

    const teacherAttendanceRecords = attendanceResponse.records.filter((attendance) => {
      const linkedClasses = attendance.fields.Sinif || [];
      const linkedTeachers = attendance.fields.Ogretmen || [];

      return (
        linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
        (linkedTeachers.length === 0 || linkedTeachers.includes(teacher.id))
      );
    });

    const studentRiskSummaries = studentIds.map((studentId) => {
      const studentMemberships = activeStudentMemberships.filter((membership) => {
        const linkedUsers = membership.fields.Kullanici || [];
        return linkedUsers.includes(studentId);
      });

      const studentClassIds = Array.from(
        new Set(
          studentMemberships.flatMap((membership) => membership.fields.Sinif || []),
        ),
      );

      const studentAssignments = teacherAssignments.filter((assignment) => {
        const linkedClasses = assignment.fields.Sinif || [];
        return linkedClasses.some((classId) => studentClassIds.includes(classId));
      });

      const studentAssignmentIds = studentAssignments.map((assignment) => assignment.id);

      const studentSubmissions = teacherSubmissions.filter((submission) => {
        const linkedStudents = submission.fields.Ogrenci || [];
        const linkedAssignments = submission.fields.Odev || [];

        return (
          linkedStudents.includes(studentId) &&
          linkedAssignments.some((assignmentId) =>
            studentAssignmentIds.includes(assignmentId),
          )
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

      const gradeAverage = calculateFormulaGrade(studentGrades);

      const studentAttendanceSessions = teacherAttendanceSessions.filter((session) => {
        const linkedClasses = session.fields.Sinif || [];

        return (
          linkedClasses.some((classId) => studentClassIds.includes(classId)) &&
          session.fields.Durum !== "Iptal"
        );
      });

      const presentAttendanceKeys = new Set(
        teacherAttendanceRecords
          .filter((attendance) => {
            const linkedStudents = attendance.fields.Ogrenci || [];
            const linkedClasses = attendance.fields.Sinif || [];

            return (
              linkedStudents.includes(studentId) &&
              linkedClasses.some((classId) => studentClassIds.includes(classId)) &&
              attendance.fields.Durum === "Geldi"
            );
          })
          .map((attendance) => {
            const classId = attendance.fields.Sinif?.[0] || "";
            return `${classId}-${attendance.fields.Tarih || ""}-${
              attendance.fields.Ders_Saati || 1
            }`;
          }),
      );

      const attendanceRate =
        studentAttendanceSessions.length > 0
          ? Math.min(
              100,
              Math.round(
                (presentAttendanceKeys.size / studentAttendanceSessions.length) *
                  100,
              ),
            )
          : null;

      const lateSubmissions = studentSubmissions.filter(
        (submission) =>
          submission.fields.Gec_Mi === true ||
          submission.fields.Durum === "Gec Teslim",
      ).length;

      let riskScore = 0;

      if (gradeAverage !== null) {
        if (gradeAverage < 50) riskScore += 40;
        else if (gradeAverage < 60) riskScore += 32;
        else if (gradeAverage < 70) riskScore += 22;
        else if (gradeAverage < 80) riskScore += 10;
      } else {
        riskScore += 8;
      }

      if (submissionRate !== null) {
        riskScore += (100 - submissionRate) * 0.25;
      } else {
        riskScore += 5;
      }

      if (attendanceRate !== null) {
        riskScore += (100 - attendanceRate) * 0.25;
      } else {
        riskScore += 5;
      }

      riskScore += Math.min(lateSubmissions * 5, 15);

      const finalRiskScore = Math.round(Math.max(0, Math.min(100, riskScore)));

      return {
        studentId,
        riskScore: finalRiskScore,
        riskLevel: getRiskLevel(finalRiskScore),
        gradeAverage,
        submissionRate,
        attendanceRate,
      };
    });

    const riskyStudents = studentRiskSummaries.filter((student) =>
      ["Yüksek", "Kritik"].includes(student.riskLevel),
    );

    const averageGrade = average(
      studentRiskSummaries
        .map((student) => student.gradeAverage)
        .filter((value): value is number => value !== null),
    );

    const averageSubmissionRate = average(
      studentRiskSummaries
        .map((student) => student.submissionRate)
        .filter((value): value is number => value !== null),
    );

    const averageAttendanceRate = average(
      studentRiskSummaries
        .map((student) => student.attendanceRate)
        .filter((value): value is number => value !== null),
    );

    const classes = teacherClasses.map((classRecord) => {
      const classActiveStudents = activeStudentMemberships.filter((membership) => {
        const linkedClasses = membership.fields.Sinif || [];
        return linkedClasses.includes(classRecord.id);
      });

      const classPendingStudents = pendingMemberships.filter((membership) => {
        const linkedClasses = membership.fields.Sinif || [];
        return linkedClasses.includes(classRecord.id);
      });

      const classAssignments = teacherAssignments.filter((assignment) => {
        const linkedClasses = assignment.fields.Sinif || [];
        return linkedClasses.includes(classRecord.id);
      });

      const classSubmissions = teacherSubmissions.filter((submission) => {
        const linkedClasses = submission.fields.Sinif || [];
        return linkedClasses.includes(classRecord.id);
      });

      const classRiskyStudents = riskyStudents.filter((student) => {
        const memberships = activeStudentMemberships.filter((membership) => {
          const linkedUsers = membership.fields.Kullanici || [];
          const linkedClasses = membership.fields.Sinif || [];

          return (
            linkedUsers.includes(student.studentId) &&
            linkedClasses.includes(classRecord.id)
          );
        });

        return memberships.length > 0;
      });

      return {
        id: classRecord.id,
        className: classRecord.fields.Sinif_Adi || "Sınıf",
        courseName: classRecord.fields.Ders_Adi || "Ders",
        status: classRecord.fields.Durum || "Aktif",
        studentCount: classActiveStudents.length,
        pendingCount: classPendingStudents.length,
        assignmentCount: classAssignments.length,
        submissionCount: classSubmissions.length,
        riskyStudentCount: classRiskyStudents.length,
      };
    });

    const recentActivities = [
      ...teacherAssignments.map((assignment) => {
        const classId = assignment.fields.Sinif?.[0] || "";
        const classRecord = classMap.get(classId);

        return {
          id: `assignment-${assignment.id}`,
          type: "Ödev",
          title: assignment.fields.Odev_Basligi || "Yeni ödev",
          description: `${classRecord?.fields.Sinif_Adi || "Sınıf"} için yayınlandı.`,
          date: assignment.createdTime || assignment.fields.Teslim_Tarihi || "",
          href: "/teacher/assignments",
        };
      }),
      ...teacherSubmissions.map((submission) => {
        const studentId = submission.fields.Ogrenci?.[0] || "";
        const student = userMap.get(studentId);

        return {
          id: `submission-${submission.id}`,
          type: "Teslim",
          title: student?.fields.Ad_Soyad || "Öğrenci teslimi",
          description: submission.fields.Durum || "Teslim kaydı oluşturuldu.",
          date: submission.fields.Teslim_Tarihi || submission.createdTime || "",
          href: "/teacher/assignments",
        };
      }),
      ...pendingMemberships.map((membership) => {
        const studentId = membership.fields.Kullanici?.[0] || "";
        const student = userMap.get(studentId);
        const classId = membership.fields.Sinif?.[0] || "";
        const classRecord = classMap.get(classId);

        return {
          id: `pending-${membership.id}`,
          type: "Katılım",
          title: student?.fields.Ad_Soyad || "Katılım isteği",
          description: `${classRecord?.fields.Sinif_Adi || "Sınıf"} için onay bekliyor.`,
          date: membership.createdTime || membership.fields.Katilma_Tarihi || "",
          href: "/teacher/join-requests",
        };
      }),
      ...teacherAttendanceSessions.map((session) => {
        const classId = session.fields.Sinif?.[0] || "";
        const classRecord = classMap.get(classId);

        return {
          id: `attendance-${session.id}`,
          type: "Yoklama",
          title: session.fields.Oturum_Kodu || "Yoklama oturumu",
          description: `${classRecord?.fields.Sinif_Adi || "Sınıf"} için yoklama oturumu.`,
          date: session.fields.Tarih || session.createdTime || "",
          href: "/teacher/attendance",
        };
      }),
    ]
      .filter((activity) => activity.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, 8);

    return NextResponse.json({
      ok: true,
      teacher: {
        id: teacher.id,
        name: teacher.fields.Ad_Soyad || "Öğretmen",
        email: teacher.fields.Eposta || "",
      },
      summary: {
        activeClassCount: teacherClasses.length,
        totalStudentCount: studentIds.length,
        pendingJoinRequestCount: pendingMemberships.length,
        assignmentCount: teacherAssignments.length,
        submissionCount: teacherSubmissions.length,
        gradedSubmissionCount: teacherSubmissions.filter(
          (submission) => submission.fields.Durum === "Teslim Edildi",
        ).length,
        gradeRecordCount: teacherGrades.length,
        attendanceSessionCount: teacherAttendanceSessions.length,
        attendanceRecordCount: teacherAttendanceRecords.length,
        riskyStudentCount: riskyStudents.length,
        averageGrade,
        averageSubmissionRate,
        averageAttendanceRate,
      },
      classes,
      recentActivities,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Öğretmen panel verileri yüklenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
