import { NextResponse } from "next/server";
import { AIRTABLE_TABLES, airtableRequest } from "@/lib/airtableClient";

type AirtableRecord<T> = {
  id: string;
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

type AirtableMembershipFields = {
  Sinif?: string[];
  Kullanici?: string[];
  Uyelik_Rolu?: string;
  Durum?: string;
};

type AirtableClassFields = {
  Sinif_Adi?: string;
  Ders_Adi?: string;
  Ogretmen?: string[];
};

type AirtableAssignmentFields = {
  Odev_Basligi?: string;
  Sinif?: string[];
  Teslim_Tarihi?: string;
  Maksimum_Puan?: number;
  Odev_Turu?: string;
  Zorluk_Seviyesi?: string;
  Durum?: string;
};

type AirtableSubmissionFields = {
  Odev?: string[];
  Ogrenci?: string[];
  Sinif?: string[];
  Teslim_Metni?: string;
  Teslim_Tarihi?: string;
  Durum?: string;
  Puan?: number;
  Ogretmen_Geri_Bildirimi?: string;
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
  Tarih?: string;
  Aciklama?: string;
};

type AirtableAttendanceFields = {
  Ogrenci?: string[];
  Sinif?: string[];
  Tarih?: string;
  Durum?: string;
  Ders_Saati?: number;
};

type AirtableAttendanceSessionFields = {
  Sinif?: string[];
  Tarih?: string;
  Ders_Saati?: number;
  Aktif_Mi?: boolean;
  Durum?: string;
};

const airtableTables = AIRTABLE_TABLES as Record<string, string>;

function table(key: string, fallback: string) {
  return airtableTables[key] || fallback;
}

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
}

function average(values: number[]) {
  if (values.length === 0) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  return Math.round(total / values.length);
}

function percent(score?: number, max?: number) {
  if (typeof score !== "number") return null;
  if (typeof max !== "number" || max <= 0) return null;

  return Math.round((score / max) * 100);
}

function isStudentRole(role?: string) {
  return role === "Ogrenci" || role === "Öğrenci";
}

async function findStudentByAuthId(authId: string) {
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
    const studentAuthId = url.searchParams.get("studentAuthId")?.trim();

    if (!studentAuthId) {
      return NextResponse.json(
        {
          ok: false,
          message: "studentAuthId parametresi gereklidir.",
        },
        { status: 400 },
      );
    }

    const student = await findStudentByAuthId(studentAuthId);

    if (!student) {
      return NextResponse.json(
        {
          ok: false,
          message: "Öğrenci Airtable üzerinde bulunamadı.",
        },
        { status: 404 },
      );
    }

    const [
      membershipsResponse,
      classesResponse,
      assignmentsResponse,
      submissionsResponse,
      gradesResponse,
      attendanceResponse,
      attendanceSessionsResponse,
    ] = await Promise.all([
      airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
        `/${encodeURIComponent(table("sinifUyelikleri", "Sinif_Uyelikleri"))}?maxRecords=100`,
      ),
      airtableRequest<AirtableListResponse<AirtableClassFields>>(
        `/${encodeURIComponent(table("siniflar", "Siniflar"))}?maxRecords=100`,
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

    const activeMemberships = membershipsResponse.records.filter((membership) => {
      const linkedUsers = membership.fields.Kullanici || [];

      return (
        linkedUsers.includes(student.id) &&
        isStudentRole(membership.fields.Uyelik_Rolu) &&
        membership.fields.Durum === "Aktif"
      );
    });

    const activeClassIds = Array.from(
      new Set(activeMemberships.flatMap((membership) => membership.fields.Sinif || [])),
    );

    const classMap = new Map(
      classesResponse.records.map((classRecord) => [classRecord.id, classRecord]),
    );

    const visibleAssignments = assignmentsResponse.records.filter((assignment) => {
      const linkedClasses = assignment.fields.Sinif || [];
      const status = assignment.fields.Durum || "";

      return (
        linkedClasses.some((classId) => activeClassIds.includes(classId)) &&
        !["Taslak", "Arsivlendi"].includes(status)
      );
    });

    const visibleAssignmentIds = visibleAssignments.map((assignment) => assignment.id);

    const studentSubmissions = submissionsResponse.records.filter((submission) => {
      const linkedStudents = submission.fields.Ogrenci || [];
      const linkedAssignments = submission.fields.Odev || [];

      return (
        linkedStudents.includes(student.id) &&
        linkedAssignments.some((assignmentId) =>
          visibleAssignmentIds.includes(assignmentId),
        )
      );
    });

    const studentGrades = gradesResponse.records.filter((grade) => {
      const linkedStudents = grade.fields.Ogrenci || [];
      const linkedClasses = grade.fields.Sinif || [];

      return (
        linkedStudents.includes(student.id) &&
        linkedClasses.some((classId) => activeClassIds.includes(classId))
      );
    });

    const gradePercentages = studentGrades
      .map((grade) => percent(grade.fields.Puan, grade.fields.Maksimum_Puan))
      .filter((value): value is number => value !== null);

    const submittedAssignmentIds = new Set(
      studentSubmissions.flatMap((submission) => submission.fields.Odev || []),
    );

    const submittedAssignmentCount = visibleAssignments.filter((assignment) =>
      submittedAssignmentIds.has(assignment.id),
    ).length;

    const assignmentSubmissionRate =
      visibleAssignments.length > 0
        ? Math.round((submittedAssignmentCount / visibleAssignments.length) * 100)
        : null;

    const attendanceSessions = attendanceSessionsResponse.records.filter((session) => {
      const linkedClasses = session.fields.Sinif || [];
      const status = session.fields.Durum || "";

      return (
        linkedClasses.some((classId) => activeClassIds.includes(classId)) &&
        status !== "Iptal"
      );
    });

    const attendanceRecords = attendanceResponse.records.filter((attendance) => {
      const linkedStudents = attendance.fields.Ogrenci || [];
      const linkedClasses = attendance.fields.Sinif || [];

      return (
        linkedStudents.includes(student.id) &&
        linkedClasses.some((classId) => activeClassIds.includes(classId))
      );
    });

    const presentKeys = new Set(
      attendanceRecords
        .filter((attendance) => attendance.fields.Durum === "Geldi")
        .map((attendance) => {
          const classId = attendance.fields.Sinif?.[0] || "";
          return `${classId}-${attendance.fields.Tarih || ""}-${
            attendance.fields.Ders_Saati || 1
          }`;
        }),
    );

    const attendanceRate =
      attendanceSessions.length > 0
        ? Math.min(
            100,
            Math.round((presentKeys.size / attendanceSessions.length) * 100),
          )
        : null;

    const assignmentProgress = visibleAssignments.map((assignment) => {
      const assignmentId = assignment.id;
      const classId = assignment.fields.Sinif?.[0] || "";
      const classRecord = classMap.get(classId);

      const submission = studentSubmissions.find((submissionRecord) => {
        const linkedAssignments = submissionRecord.fields.Odev || [];
        return linkedAssignments.includes(assignmentId);
      });

      return {
        id: assignment.id,
        title: assignment.fields.Odev_Basligi || "İsimsiz Ödev",
        classId,
        className: classRecord?.fields.Sinif_Adi || "Sınıf",
        courseName: classRecord?.fields.Ders_Adi || "Ders",
        dueDate: assignment.fields.Teslim_Tarihi || "",
        maxPoints: assignment.fields.Maksimum_Puan || 100,
        assignmentType: assignment.fields.Odev_Turu || "Odev",
        difficulty: assignment.fields.Zorluk_Seviyesi || "Orta",
        status: assignment.fields.Durum || "Yayinda",
        submission: submission
          ? {
              id: submission.id,
              status: submission.fields.Durum || "Teslim Edildi",
              text: submission.fields.Teslim_Metni || "",
              submittedAt: submission.fields.Teslim_Tarihi || "",
              score: submission.fields.Puan ?? null,
              feedback: submission.fields.Ogretmen_Geri_Bildirimi || "",
              late: submission.fields.Gec_Mi ?? false,
            }
          : null,
      };
    });

    const grades = studentGrades.map((grade) => {
      const classId = grade.fields.Sinif?.[0] || "";
      const classRecord = classMap.get(classId);

      return {
        id: grade.id,
        title: grade.fields.Not_Kaydi || "Not Kaydı",
        classId,
        className: classRecord?.fields.Sinif_Adi || "Sınıf",
        courseName: classRecord?.fields.Ders_Adi || "Ders",
        gradeType: grade.fields.Not_Turu || "Not",
        score: grade.fields.Puan ?? null,
        maxPoints: grade.fields.Maksimum_Puan ?? null,
        percentage: percent(grade.fields.Puan, grade.fields.Maksimum_Puan),
        date: grade.fields.Tarih || "",
        description: grade.fields.Aciklama || "",
      };
    });

    const classProgress = activeClassIds.map((classId) => {
      const classRecord = classMap.get(classId);

      const classAssignments = visibleAssignments.filter((assignment) => {
        const linkedClasses = assignment.fields.Sinif || [];
        return linkedClasses.includes(classId);
      });

      const classAssignmentIds = classAssignments.map((assignment) => assignment.id);

      const classSubmissions = studentSubmissions.filter((submission) => {
        const linkedAssignments = submission.fields.Odev || [];
        return linkedAssignments.some((assignmentId) =>
          classAssignmentIds.includes(assignmentId),
        );
      });

      const classSubmittedAssignmentIds = new Set(
        classSubmissions.flatMap((submission) => submission.fields.Odev || []),
      );

      const classGrades = studentGrades.filter((grade) => {
        const linkedClasses = grade.fields.Sinif || [];
        return linkedClasses.includes(classId);
      });

      const classGradePercentages = classGrades
        .map((grade) => percent(grade.fields.Puan, grade.fields.Maksimum_Puan))
        .filter((value): value is number => value !== null);

      const classAttendanceSessions = attendanceSessions.filter((session) => {
        const linkedClasses = session.fields.Sinif || [];
        return linkedClasses.includes(classId);
      });

      const classPresentKeys = new Set(
        attendanceRecords
          .filter((attendance) => {
            const linkedClasses = attendance.fields.Sinif || [];
            return linkedClasses.includes(classId) && attendance.fields.Durum === "Geldi";
          })
          .map(
            (attendance) =>
              `${classId}-${attendance.fields.Tarih || ""}-${
                attendance.fields.Ders_Saati || 1
              }`,
          ),
      );

      return {
        id: classId,
        className: classRecord?.fields.Sinif_Adi || "Sınıf",
        courseName: classRecord?.fields.Ders_Adi || "Ders",
        gradeAverage: average(classGradePercentages),
        assignmentCount: classAssignments.length,
        submittedAssignmentCount: classAssignments.filter((assignment) =>
          classSubmittedAssignmentIds.has(assignment.id),
        ).length,
        submissionRate:
          classAssignments.length > 0
            ? Math.round(
                (classAssignments.filter((assignment) =>
                  classSubmittedAssignmentIds.has(assignment.id),
                ).length /
                  classAssignments.length) *
                  100,
              )
            : null,
        attendanceSessionCount: classAttendanceSessions.length,
        presentAttendanceCount: classPresentKeys.size,
        attendanceRate:
          classAttendanceSessions.length > 0
            ? Math.min(
                100,
                Math.round(
                  (classPresentKeys.size / classAttendanceSessions.length) * 100,
                ),
              )
            : null,
      };
    });

    return NextResponse.json({
      ok: true,
      student: {
        id: student.id,
        name: student.fields.Ad_Soyad || "Öğrenci",
        email: student.fields.Eposta || "",
        schoolNumber: student.fields.Okul_No || "Tanımlanmadı",
      },
      summary: {
        activeClassCount: activeClassIds.length,
        gradeAverage: average(gradePercentages),
        gradeRecordCount: studentGrades.length,
        assignmentCount: visibleAssignments.length,
        submittedAssignmentCount,
        missingAssignmentCount: Math.max(
          0,
          visibleAssignments.length - submittedAssignmentCount,
        ),
        assignmentSubmissionRate,
        attendanceSessionCount: attendanceSessions.length,
        presentAttendanceCount: presentKeys.size,
        attendanceRate,
      },
      classes: classProgress,
      grades,
      assignments: assignmentProgress,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Öğrenci performans verileri yüklenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
