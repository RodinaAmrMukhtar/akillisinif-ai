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

type AirtableClassFields = {
  Sinif_Adi?: string;
  Ders_Adi?: string;
  Ogretmen?: string[];
};

type AirtableMembershipFields = {
  Sinif?: string[];
  Kullanici?: string[];
  Uyelik_Rolu?: string;
  Durum?: string;
};

type AirtableAssignmentFields = {
  Odev_Basligi?: string;
  Sinif?: string[];
  Ogretmen?: string[];
  Teslim_Tarihi?: string;
  Maksimum_Puan?: number;
  Durum?: string;
};

type AirtableSubmissionFields = {
  Odev?: string[];
  Ogrenci?: string[];
  Sinif?: string[];
  Durum?: string;
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeWeight(raw?: number) {
  if (typeof raw !== "number") return 0;
  if (raw <= 1) return Math.round(raw * 100);
  return Math.round(raw);
}

function gradePercentage(grade: AirtableRecord<AirtableGradeFields>) {
  const score = grade.fields.Puan;
  const maxPoints = grade.fields.Maksimum_Puan;

  if (typeof score !== "number") return null;
  if (typeof maxPoints !== "number" || maxPoints <= 0) return null;

  return Math.round((score / maxPoints) * 100);
}

function calculateFormulaGrade(grades: AirtableRecord<AirtableGradeFields>[]) {
  const gradePercentages = grades
    .map((grade) => gradePercentage(grade))
    .filter((value): value is number => value !== null);

  const weightedGrades = grades
    .map((grade) => {
      const percentage = gradePercentage(grade);
      const weight = normalizeWeight(grade.fields.Agirlik);

      return {
        percentage,
        weight,
        type: grade.fields.Not_Turu || "Not",
      };
    })
    .filter(
      (grade): grade is { percentage: number; weight: number; type: string } =>
        grade.percentage !== null && grade.weight > 0,
    );

  if (weightedGrades.length > 0) {
    const totalWeight = weightedGrades.reduce(
      (sum, grade) => sum + grade.weight,
      0,
    );

    const weightedTotal = weightedGrades.reduce((sum, grade) => {
      return sum + grade.percentage * grade.weight;
    }, 0);

    return {
      average:
        totalWeight > 0 ? Math.round(weightedTotal / totalWeight) : null,
      formulaMode: "weighted",
      formulaWeightTotal: totalWeight,
      weightedGradeCount: weightedGrades.length,
      gradeRecordCount: grades.length,
    };
  }

  return {
    average: average(gradePercentages),
    formulaMode: "simple",
    formulaWeightTotal: 0,
    weightedGradeCount: 0,
    gradeRecordCount: grades.length,
  };
}

function getRiskLevel(score: number) {
  if (score >= 70) return "Kritik";
  if (score >= 50) return "Yüksek";
  if (score >= 25) return "Orta";
  return "Düşük";
}

function getRecommendation(level: string) {
  if (level === "Kritik") {
    return "Öğrenci için acil birebir görüşme, veli bilgilendirmesi ve haftalık takip planı önerilir.";
  }

  if (level === "Yüksek") {
    return "Öğrencinin ödev, yoklama ve sınav performansı yakından izlenmeli; kısa vadeli destek planı hazırlanmalıdır.";
  }

  if (level === "Orta") {
    return "Öğrencinin performansı takip edilmeli, eksik ödev, düşük not ve devamsızlık sinyalleri düzenli kontrol edilmelidir.";
  }

  return "Belirgin risk sinyali düşük. Mevcut akademik takip sürdürülebilir.";
}

function isStudentRole(role?: string) {
  return role === "Ogrenci" || role === "Öğrenci";
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
      const linkedClasses = membership.fields.Sinif || [];
      const linkedUsers = membership.fields.Kullanici || [];

      return (
        linkedUsers.length > 0 &&
        linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
        isStudentRole(membership.fields.Uyelik_Rolu) &&
        membership.fields.Durum === "Aktif"
      );
    });

    const studentIds = Array.from(
      new Set(
        activeStudentMemberships.flatMap(
          (membership) => membership.fields.Kullanici || [],
        ),
      ),
    );

    const students = studentIds.map((studentId) => {
      const student = userMap.get(studentId);

      const studentMemberships = activeStudentMemberships.filter((membership) => {
        const linkedUsers = membership.fields.Kullanici || [];
        return linkedUsers.includes(studentId);
      });

      const studentClassIds = Array.from(
        new Set(
          studentMemberships.flatMap((membership) => membership.fields.Sinif || []),
        ),
      );

      const studentClassNames = studentClassIds.map((classId) => {
        const classRecord = classMap.get(classId);
        return classRecord?.fields.Sinif_Adi || "Sınıf";
      });

      const studentAssignments = assignmentsResponse.records.filter((assignment) => {
        const assignmentClasses = assignment.fields.Sinif || [];
        const assignmentTeachers = assignment.fields.Ogretmen || [];
        const inStudentClass = assignmentClasses.some((classId) =>
          studentClassIds.includes(classId),
        );

        return (
          inStudentClass &&
          (assignmentTeachers.length === 0 || assignmentTeachers.includes(teacher.id))
        );
      });

      const studentAssignmentIds = studentAssignments.map((assignment) => assignment.id);

      const studentSubmissions = submissionsResponse.records.filter((submission) => {
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

      const submittedCount = studentAssignments.filter((assignment) =>
        submittedAssignmentIds.has(assignment.id),
      ).length;

      const missingAssignments = Math.max(
        0,
        studentAssignments.length - submittedCount,
      );

      const submissionRate =
        studentAssignments.length > 0
          ? Math.round((submittedCount / studentAssignments.length) * 100)
          : null;

      const lateSubmissions = studentSubmissions.filter(
        (submission) =>
          submission.fields.Gec_Mi === true ||
          submission.fields.Durum === "Gec Teslim",
      ).length;

      const studentGrades = gradesResponse.records.filter((grade) => {
        const linkedStudents = grade.fields.Ogrenci || [];
        const linkedClasses = grade.fields.Sinif || [];
        const linkedTeachers = grade.fields.Ogretmen || [];

        return (
          linkedStudents.includes(studentId) &&
          linkedClasses.some((classId) => studentClassIds.includes(classId)) &&
          (linkedTeachers.length === 0 || linkedTeachers.includes(teacher.id))
        );
      });

      const formulaGrade = calculateFormulaGrade(studentGrades);
      const gradeAverage = formulaGrade.average;

      const studentAttendanceSessions = attendanceSessionsResponse.records.filter(
        (session) => {
          const linkedClasses = session.fields.Sinif || [];
          const linkedTeachers = session.fields.Ogretmen || [];

          return (
            linkedClasses.some((classId) => studentClassIds.includes(classId)) &&
            (linkedTeachers.length === 0 || linkedTeachers.includes(teacher.id)) &&
            session.fields.Durum !== "Iptal"
          );
        },
      );

      const studentAttendanceRecords = attendanceResponse.records.filter((attendance) => {
        const linkedStudents = attendance.fields.Ogrenci || [];
        const linkedClasses = attendance.fields.Sinif || [];

        return (
          linkedStudents.includes(studentId) &&
          linkedClasses.some((classId) => studentClassIds.includes(classId))
        );
      });

      const presentAttendanceKeys = new Set(
        studentAttendanceRecords
          .filter((attendance) => attendance.fields.Durum === "Geldi")
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

      if (
        studentAssignments.length === 0 &&
        studentAttendanceSessions.length === 0 &&
        studentGrades.length === 0
      ) {
        riskScore = 10;
      }

      const finalRiskScore = Math.round(clamp(riskScore, 0, 100));
      const riskLevel = getRiskLevel(finalRiskScore);

      const signals: string[] = [];

      if (formulaGrade.formulaMode === "weighted") {
        signals.push(
          `Not ortalaması öğretmen ağırlık formülüne göre hesaplandı. Formül ağırlığı: ${formulaGrade.formulaWeightTotal}%.`,
        );

        if (formulaGrade.formulaWeightTotal !== 100) {
          signals.push(
            "Ağırlık toplamı 100 değil; sistem mevcut ağırlıkları normalize ederek risk hesabı yaptı.",
          );
        }
      } else if (studentGrades.length > 0) {
        signals.push(
          "Ağırlıklı formül bulunmadı; not ortalaması basit ortalama ile hesaplandı.",
        );
      }

      if (gradeAverage !== null && gradeAverage < 60) {
        signals.push("Not ortalaması kritik eşiğin altında.");
      }

      if (missingAssignments > 0) {
        signals.push(`${missingAssignments} ödev teslim edilmemiş görünüyor.`);
      }

      if (attendanceRate !== null && attendanceRate < 75) {
        signals.push("Yoklama katılım oranı düşük.");
      }

      if (lateSubmissions > 0) {
        signals.push(`${lateSubmissions} geç teslim kaydı var.`);
      }

      if (studentGrades.length === 0) {
        signals.push("Henüz yeterli not verisi yok.");
      }

      if (signals.length === 0) {
        signals.push("Belirgin risk sinyali bulunmuyor.");
      }

      const dataCategories = [
        studentAssignments.length > 0,
        studentAttendanceSessions.length > 0,
        studentGrades.length > 0,
      ];

      const dataCompleteness = Math.round(
        (dataCategories.filter(Boolean).length / dataCategories.length) * 100,
      );

      return {
        studentId,
        studentName: student?.fields.Ad_Soyad || "Öğrenci",
        studentEmail: student?.fields.Eposta || "",
        schoolNumber: student?.fields.Okul_No || "Tanımlanmadı",
        classIds: studentClassIds,
        classNames: studentClassNames,
        riskScore: finalRiskScore,
        riskLevel,
        recommendation: getRecommendation(riskLevel),
        signals,
        metrics: {
          gradeAverage,
          gradeRecordCount: studentGrades.length,
          formulaMode: formulaGrade.formulaMode,
          formulaWeightTotal: formulaGrade.formulaWeightTotal,
          weightedGradeCount: formulaGrade.weightedGradeCount,
          assignmentCount: studentAssignments.length,
          submittedAssignmentCount: submittedCount,
          missingAssignmentCount: missingAssignments,
          submissionRate,
          lateSubmissionCount: lateSubmissions,
          attendanceSessionCount: studentAttendanceSessions.length,
          presentAttendanceCount: presentAttendanceKeys.size,
          attendanceRate,
          dataCompleteness,
        },
      };
    });

    const sortedStudents = students.sort((a, b) => b.riskScore - a.riskScore);

    const gradeAverages = sortedStudents
      .map((student) => student.metrics.gradeAverage)
      .filter((value): value is number => value !== null);

    const attendanceRates = sortedStudents
      .map((student) => student.metrics.attendanceRate)
      .filter((value): value is number => value !== null);

    const submissionRates = sortedStudents
      .map((student) => student.metrics.submissionRate)
      .filter((value): value is number => value !== null);

    const classes = teacherClasses.map((classRecord) => {
      const classStudentCount = sortedStudents.filter((student) =>
        student.classIds.includes(classRecord.id),
      ).length;

      const riskyStudentCount = sortedStudents.filter(
        (student) =>
          student.classIds.includes(classRecord.id) &&
          ["Yüksek", "Kritik"].includes(student.riskLevel),
      ).length;

      return {
        id: classRecord.id,
        className: classRecord.fields.Sinif_Adi || "Sınıf",
        courseName: classRecord.fields.Ders_Adi || "Ders",
        studentCount: classStudentCount,
        riskyStudentCount,
      };
    });

    return NextResponse.json({
      ok: true,
      summary: {
        totalStudents: sortedStudents.length,
        criticalRiskCount: sortedStudents.filter(
          (student) => student.riskLevel === "Kritik",
        ).length,
        highRiskCount: sortedStudents.filter(
          (student) => student.riskLevel === "Yüksek",
        ).length,
        mediumRiskCount: sortedStudents.filter(
          (student) => student.riskLevel === "Orta",
        ).length,
        lowRiskCount: sortedStudents.filter(
          (student) => student.riskLevel === "Düşük",
        ).length,
        averageGrade: average(gradeAverages),
        averageAttendance: average(attendanceRates),
        averageSubmissionRate: average(submissionRates),
      },
      classes,
      students: sortedStudents,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Risk analizi oluşturulamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
