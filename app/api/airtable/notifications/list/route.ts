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
};

type SubmissionFields = {
  Odev?: string[];
  Ogrenci?: string[];
  Sinif?: string[];
  Durum?: string;
  Teslim_Tarihi?: string;
  Puan?: number;
  Ogretmen_Geri_Bildirimi?: string;
};

type AttendanceSessionFields = {
  Sinif?: string[];
  Ogretmen?: string[];
  Oturum_Kodu?: string;
  Tarih?: string;
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

function isTeacherRole(role?: string) {
  return role === "Ogretmen" || role === "Öğretmen";
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

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const authId = url.searchParams.get("authId")?.trim();

    if (!authId) {
      return NextResponse.json(
        {
          ok: false,
          message: "authId parametresi gereklidir.",
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
      attendanceSessionsResponse,
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
      airtableRequest<AirtableListResponse<AttendanceSessionFields>>(
        `/${encodeURIComponent(table("yoklamaOturumlari", "Yoklama_Oturumlari"))}?maxRecords=100`,
      ),
    ]);

    const userMap = new Map(usersResponse.records.map((item) => [item.id, item]));
    const classMap = new Map(classesResponse.records.map((item) => [item.id, item]));
    const assignmentMap = new Map(assignmentsResponse.records.map((item) => [item.id, item]));

    const notifications: {
      id: string;
      title: string;
      description: string;
      type: string;
      priority: "low" | "medium" | "high";
      href: string;
      date: string;
    }[] = [];

    if (isTeacherRole(user.fields.Rol)) {
      const teacherClasses = classesResponse.records.filter((classRecord) => {
        const teachers = classRecord.fields.Ogretmen || [];
        return teachers.includes(user.id);
      });

      const teacherClassIds = teacherClasses.map((classRecord) => classRecord.id);

      const pendingMemberships = membershipsResponse.records.filter((membership) => {
        const linkedClasses = membership.fields.Sinif || [];

        return (
          linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
          membership.fields.Durum === "Onay Bekliyor"
        );
      });

      for (const membership of pendingMemberships) {
        const studentId = membership.fields.Kullanici?.[0] || "";
        const classId = membership.fields.Sinif?.[0] || "";
        const student = userMap.get(studentId);
        const classRecord = classMap.get(classId);

        notifications.push({
          id: `pending-${membership.id}`,
          title: "Yeni sınıf katılım isteği",
          description: `${student?.fields.Ad_Soyad || "Bir öğrenci"} ${classRecord?.fields.Sinif_Adi || "sınıf"} için onay bekliyor.`,
          type: "Katılım",
          priority: "high",
          href: "/teacher/join-requests",
          date: membership.createdTime || "",
        });
      }

      const teacherAssignments = assignmentsResponse.records.filter((assignment) => {
        const teachers = assignment.fields.Ogretmen || [];
        const classes = assignment.fields.Sinif || [];

        return (
          teachers.includes(user.id) ||
          classes.some((classId) => teacherClassIds.includes(classId))
        );
      });

      const teacherAssignmentIds = teacherAssignments.map((assignment) => assignment.id);

      const ungradedSubmissions = submissionsResponse.records.filter((submission) => {
        const linkedAssignments = submission.fields.Odev || [];
        const status = submission.fields.Durum || "";

        return (
          linkedAssignments.some((assignmentId) =>
            teacherAssignmentIds.includes(assignmentId),
          ) &&
          status !== "Degerlendirildi"
        );
      });

      for (const submission of ungradedSubmissions) {
        const studentId = submission.fields.Ogrenci?.[0] || "";
        const assignmentId = submission.fields.Odev?.[0] || "";
        const student = userMap.get(studentId);
        const assignment = assignmentMap.get(assignmentId);

        notifications.push({
          id: `ungraded-${submission.id}`,
          title: "Değerlendirme bekleyen ödev teslimi",
          description: `${student?.fields.Ad_Soyad || "Öğrenci"} tarafından ${assignment?.fields.Odev_Basligi || "ödev"} teslim edildi.`,
          type: "Ödev",
          priority: "medium",
          href: "/teacher/assignments",
          date: submission.fields.Teslim_Tarihi || submission.createdTime || "",
        });
      }

      const activeSessions = attendanceSessionsResponse.records.filter((session) => {
        const linkedClasses = session.fields.Sinif || [];
        const linkedTeachers = session.fields.Ogretmen || [];

        return (
          session.fields.Aktif_Mi === true &&
          session.fields.Durum === "Aktif" &&
          linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
          (linkedTeachers.length === 0 || linkedTeachers.includes(user.id))
        );
      });

      for (const session of activeSessions) {
        const classId = session.fields.Sinif?.[0] || "";
        const classRecord = classMap.get(classId);

        notifications.push({
          id: `session-${session.id}`,
          title: "Aktif yoklama oturumu",
          description: `${classRecord?.fields.Sinif_Adi || "Sınıf"} için ${session.fields.Oturum_Kodu || "yoklama kodu"} aktif.`,
          type: "Yoklama",
          priority: "medium",
          href: "/teacher/attendance",
          date: session.fields.Tarih || session.createdTime || "",
        });
      }
    }

    if (isStudentRole(user.fields.Rol)) {
      const activeMemberships = membershipsResponse.records.filter((membership) => {
        const linkedUsers = membership.fields.Kullanici || [];

        return (
          linkedUsers.includes(user.id) &&
          isStudentRole(membership.fields.Uyelik_Rolu) &&
          membership.fields.Durum === "Aktif"
        );
      });

      const activeClassIds = Array.from(
        new Set(activeMemberships.flatMap((membership) => membership.fields.Sinif || [])),
      );

      for (const membership of activeMemberships) {
        const classId = membership.fields.Sinif?.[0] || "";
        const classRecord = classMap.get(classId);

        notifications.push({
          id: `active-class-${membership.id}`,
          title: "Aktif sınıf üyeliği",
          description: `${classRecord?.fields.Sinif_Adi || "Sınıf"} sınıfında aktif öğrenci olarak görünüyorsunuz.`,
          type: "Sınıf",
          priority: "low",
          href: "/student/classes",
          date: membership.createdTime || "",
        });
      }

      const studentAssignments = assignmentsResponse.records.filter((assignment) => {
        const linkedClasses = assignment.fields.Sinif || [];
        const status = assignment.fields.Durum || "";

        return (
          linkedClasses.some((classId) => activeClassIds.includes(classId)) &&
          status === "Yayinda"
        );
      });

      const studentSubmissions = submissionsResponse.records.filter((submission) => {
        const linkedStudents = submission.fields.Ogrenci || [];
        return linkedStudents.includes(user.id);
      });

      const submittedAssignmentIds = new Set(
        studentSubmissions.flatMap((submission) => submission.fields.Odev || []),
      );

      const waitingAssignments = studentAssignments.filter(
        (assignment) => !submittedAssignmentIds.has(assignment.id),
      );

      for (const assignment of waitingAssignments) {
        const classId = assignment.fields.Sinif?.[0] || "";
        const classRecord = classMap.get(classId);

        notifications.push({
          id: `waiting-assignment-${assignment.id}`,
          title: "Teslim bekleyen ödev",
          description: `${assignment.fields.Odev_Basligi || "Ödev"} için teslim kaydınız bulunmuyor. Sınıf: ${classRecord?.fields.Sinif_Adi || "Sınıf"}.`,
          type: "Ödev",
          priority: "high",
          href: "/student/assignments",
          date: assignment.fields.Teslim_Tarihi || assignment.createdTime || "",
        });
      }

      const gradedSubmissions = studentSubmissions.filter(
        (submission) => submission.fields.Durum === "Degerlendirildi",
      );

      for (const submission of gradedSubmissions) {
        const assignmentId = submission.fields.Odev?.[0] || "";
        const assignment = assignmentMap.get(assignmentId);

        notifications.push({
          id: `graded-${submission.id}`,
          title: "Ödeviniz değerlendirildi",
          description: `${assignment?.fields.Odev_Basligi || "Ödev"} için puanınız: ${submission.fields.Puan ?? "girildi"}.`,
          type: "Not",
          priority: "medium",
          href: "/student/grades",
          date: submission.fields.Teslim_Tarihi || submission.createdTime || "",
        });
      }
    }

    const sortedNotifications = notifications
      .filter((notification) => notification.title)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.fields.Ad_Soyad || "Kullanıcı",
        role: user.fields.Rol || "",
      },
      summary: {
        total: sortedNotifications.length,
        highPriority: sortedNotifications.filter(
          (notification) => notification.priority === "high",
        ).length,
      },
      notifications: sortedNotifications,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Bildirimler yüklenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
