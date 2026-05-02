import { NextResponse } from "next/server";
import { AIRTABLE_TABLES, airtableRequest } from "@/lib/airtableClient";

type AirtableRecord<T> = {
  id: string;
  fields: T;
};

type AirtableListResponse<T> = {
  records: AirtableRecord<T>[];
};

type AirtableCreateResponse<T> = {
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
  Aciklama?: string;
};

type CreateGradeBody = {
  teacherAuthId?: string;
  classId?: string;
  studentId?: string;
  gradeTitle?: string;
  gradeType?: string;
  score?: number;
  maxPoints?: number;
  weight?: number;
  date?: string;
  description?: string;
};

const airtableTables = AIRTABLE_TABLES as Record<string, string>;

function table(key: string, fallback: string) {
  return airtableTables[key] || fallback;
}

function escapeAirtableFormulaValue(value: string) {
  return value.replace(/'/g, "\\'");
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function isStudentRole(role?: string) {
  return role === "Ogrenci" || role === "Öğrenci";
}

function normalizeWeight(raw?: number) {
  if (typeof raw !== "number") return 0;
  if (raw <= 1) return Math.round(raw * 100);
  return Math.round(raw);
}

function toAirtablePercent(weight: number) {
  return weight / 100;
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

    const [classesResponse, membershipsResponse, usersResponse, gradesResponse] =
      await Promise.all([
        airtableRequest<AirtableListResponse<AirtableClassFields>>(
          `/${encodeURIComponent(table("siniflar", "Siniflar"))}?maxRecords=100`,
        ),
        airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
          `/${encodeURIComponent(
            table("sinifUyelikleri", "Sinif_Uyelikleri"),
          )}?maxRecords=100`,
        ),
        airtableRequest<AirtableListResponse<AirtableUserFields>>(
          `/${encodeURIComponent(table("kullanicilar", "Kullanicilar"))}?maxRecords=100`,
        ),
        airtableRequest<AirtableListResponse<AirtableGradeFields>>(
          `/${encodeURIComponent(table("notlar", "Notlar"))}?maxRecords=100`,
        ),
      ]);

    const userMap = new Map(usersResponse.records.map((user) => [user.id, user]));

    const teacherClasses = classesResponse.records.filter((classRecord) => {
      const teacherLinks = classRecord.fields.Ogretmen || [];
      return teacherLinks.includes(teacher.id);
    });

    const teacherClassIds = teacherClasses.map((classRecord) => classRecord.id);

    const activeMemberships = membershipsResponse.records.filter((membership) => {
      const linkedClasses = membership.fields.Sinif || [];
      const linkedUsers = membership.fields.Kullanici || [];

      return (
        linkedUsers.length > 0 &&
        linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
        isStudentRole(membership.fields.Uyelik_Rolu) &&
        membership.fields.Durum === "Aktif"
      );
    });

    const classes = teacherClasses.map((classRecord) => {
      const students = activeMemberships
        .filter((membership) => {
          const linkedClasses = membership.fields.Sinif || [];
          return linkedClasses.includes(classRecord.id);
        })
        .map((membership) => {
          const studentId = membership.fields.Kullanici?.[0] || "";
          const student = userMap.get(studentId);

          return {
            id: studentId,
            name: student?.fields.Ad_Soyad || "Öğrenci",
            email: student?.fields.Eposta || "",
            schoolNumber: student?.fields.Okul_No || "Tanımlanmadı",
          };
        })
        .filter((student) => student.id);

      return {
        id: classRecord.id,
        className: classRecord.fields.Sinif_Adi || "Sınıf",
        courseName: classRecord.fields.Ders_Adi || "Ders",
        students,
      };
    });

    const grades = gradesResponse.records
      .filter((grade) => {
        const linkedClasses = grade.fields.Sinif || [];
        const linkedTeachers = grade.fields.Ogretmen || [];
        const gradeType = grade.fields.Not_Turu || "";

        return (
          gradeType !== "Odev" &&
          linkedClasses.some((classId) => teacherClassIds.includes(classId)) &&
          (linkedTeachers.length === 0 || linkedTeachers.includes(teacher.id))
        );
      })
      .map((grade) => {
        const classId = grade.fields.Sinif?.[0] || "";
        const studentId = grade.fields.Ogrenci?.[0] || "";
        const classRecord = teacherClasses.find((item) => item.id === classId);
        const student = userMap.get(studentId);

        return {
          id: grade.id,
          title: grade.fields.Not_Kaydi || "Not Kaydı",
          classId,
          className: classRecord?.fields.Sinif_Adi || "Sınıf",
          courseName: classRecord?.fields.Ders_Adi || "Ders",
          studentId,
          studentName: student?.fields.Ad_Soyad || "Öğrenci",
          gradeType: grade.fields.Not_Turu || "Not",
          score: grade.fields.Puan ?? 0,
          maxPoints: grade.fields.Maksimum_Puan ?? 100,
          weight: normalizeWeight(grade.fields.Agirlik),
          date: grade.fields.Tarih || "",
          description: grade.fields.Aciklama || "",
        };
      });

    return NextResponse.json({
      ok: true,
      classes,
      grades,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Not defteri verileri yüklenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateGradeBody;

    const teacherAuthId = body.teacherAuthId?.trim();
    const classId = body.classId?.trim();
    const studentId = body.studentId?.trim();
    const gradeType = body.gradeType?.trim() || "Vize";
    const score = Number(body.score);
    const maxPoints = Number(body.maxPoints || 100);
    const weight = Number(body.weight || 0);
    const date = body.date?.trim() || getTodayDate();
    const description = body.description?.trim() || "";

    if (!teacherAuthId || !classId || !studentId || Number.isNaN(score)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Not eklemek için öğretmen, sınıf, öğrenci ve puan bilgisi gereklidir.",
        },
        { status: 400 },
      );
    }

    if (score < 0 || maxPoints <= 0 || score > maxPoints) {
      return NextResponse.json(
        {
          ok: false,
          message: "Puan 0 ile maksimum puan arasında olmalıdır.",
        },
        { status: 400 },
      );
    }

    if (weight < 0 || weight > 100) {
      return NextResponse.json(
        {
          ok: false,
          message: "Ağırlık 0 ile 100 arasında olmalıdır.",
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

    const [classRecord, studentRecord, membershipsResponse] = await Promise.all([
      airtableRequest<AirtableRecord<AirtableClassFields>>(
        `/${encodeURIComponent(table("siniflar", "Siniflar"))}/${classId}`,
      ),
      airtableRequest<AirtableRecord<AirtableUserFields>>(
        `/${encodeURIComponent(table("kullanicilar", "Kullanicilar"))}/${studentId}`,
      ),
      airtableRequest<AirtableListResponse<AirtableMembershipFields>>(
        `/${encodeURIComponent(
          table("sinifUyelikleri", "Sinif_Uyelikleri"),
        )}?maxRecords=100`,
      ),
    ]);

    const teacherLinks = classRecord.fields.Ogretmen || [];

    if (!teacherLinks.includes(teacher.id)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Bu sınıfa not ekleme yetkiniz yok.",
        },
        { status: 403 },
      );
    }

    const activeMembership = membershipsResponse.records.find((membership) => {
      const linkedUsers = membership.fields.Kullanici || [];
      const linkedClasses = membership.fields.Sinif || [];

      return (
        linkedUsers.includes(studentId) &&
        linkedClasses.includes(classId) &&
        isStudentRole(membership.fields.Uyelik_Rolu) &&
        membership.fields.Durum === "Aktif"
      );
    });

    if (!activeMembership) {
      return NextResponse.json(
        {
          ok: false,
          message: "Seçilen öğrenci bu sınıfta aktif görünmüyor.",
        },
        { status: 403 },
      );
    }

    const title =
      body.gradeTitle?.trim() ||
      `${studentRecord.fields.Ad_Soyad || "Öğrenci"} - ${gradeType}`;

    const createdGrade = await airtableRequest<
      AirtableCreateResponse<AirtableGradeFields>
    >(`/${encodeURIComponent(table("notlar", "Notlar"))}`, {
      method: "POST",
      body: {
        typecast: true,
        records: [
          {
            fields: {
              Not_Kaydi: title,
              Ogrenci: [studentId],
              Sinif: [classId],
              Ogretmen: [teacher.id],
              Not_Turu: gradeType,
              Puan: score,
              Maksimum_Puan: maxPoints,
              Agirlik: toAirtablePercent(weight),
              Tarih: date,
              Aciklama: description,
            },
          },
        ],
      },
    });

    return NextResponse.json({
      ok: true,
      message: "Not kaydı başarıyla oluşturuldu.",
      grade: {
        id: createdGrade.records[0]?.id,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Not kaydı oluşturulamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
