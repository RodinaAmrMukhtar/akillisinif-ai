import { NextResponse } from "next/server";

const AIRTABLE_API_URL = "https://api.airtable.com/v0";

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
  createdTime?: string;
};

function getEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is missing`);
  }

  return value;
}

function airtableHeaders() {
  return {
    Authorization: `Bearer ${getEnv("AIRTABLE_TOKEN")}`,
    "Content-Type": "application/json",
  };
}

function text(value: unknown) {
  return String(value || "").trim();
}

function getLinkedIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function numberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

async function listAirtableRecords(tableName: string) {
  const baseId = getEnv("AIRTABLE_BASE_ID");
  const records: AirtableRecord[] = [];
  let offset = "";

  do {
    const params = new URLSearchParams();
    params.set("pageSize", "100");

    if (offset) {
      params.set("offset", offset);
    }

    const url = `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}?${params.toString()}`;

    const response = await fetch(url, {
      headers: airtableHeaders(),
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: data,
        records: [] as AirtableRecord[],
      };
    }

    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return {
    ok: true,
    status: 200,
    records,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const classId = text(searchParams.get("classId"));
    const teacherEmail = text(searchParams.get("teacherEmail")).toLowerCase();

    if (!classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "classId gerekli.",
        },
        { status: 400 },
      );
    }

    const usersResult = await listAirtableRecords("Kullanicilar");
    const classesResult = await listAirtableRecords("Siniflar");
    const membershipsResult = await listAirtableRecords("Sinif_Uyelikleri");
    const gradesResult = await listAirtableRecords("Notlar");

    for (const result of [usersResult, classesResult, membershipsResult, gradesResult]) {
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            message: "Airtable not kayıtları okunamadı.",
            details: result.error,
          },
          { status: result.status },
        );
      }
    }

    const users = usersResult.records;
    const classes = classesResult.records;
    const memberships = membershipsResult.records;
    const grades = gradesResult.records;

    const classRecord = classes.find((item) => item.id === classId);

    if (!classRecord) {
      return NextResponse.json(
        {
          ok: false,
          message: "Sınıf bulunamadı.",
        },
        { status: 404 },
      );
    }

    const currentTeacher = users.find(
      (user) => text(user.fields?.Eposta).toLowerCase() === teacherEmail,
    );

    const currentTeacherId = currentTeacher?.id || "";

    const activeStudentMemberships = memberships.filter((membership) => {
      const linkedClassIds = getLinkedIds(membership.fields?.Sinif);
      const linkedUserIds = getLinkedIds(membership.fields?.Kullanici);
      const role = text(membership.fields?.Uyelik_Rolu);
      const status = text(membership.fields?.Durum);

      return (
        linkedClassIds.includes(classId) &&
        linkedUserIds.length > 0 &&
        role === "Ogrenci" &&
        status === "Aktif"
      );
    });

    const students = activeStudentMemberships
      .map((membership) => {
        const studentId = getLinkedIds(membership.fields?.Kullanici)[0] || "";
        const student = users.find((user) => user.id === studentId);

        return {
          id: studentId,
          membershipId: membership.id,
          name:
            text(student?.fields?.Ad_Soyad) ||
            text(student?.fields?.Eposta) ||
            "Öğrenci",
          email: text(student?.fields?.Eposta),
          schoolNumber: text(student?.fields?.Okul_No),
        };
      })
      .filter((student) => student.id)
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));

    const classGrades = grades
      .filter((grade) => getLinkedIds(grade.fields?.Sinif).includes(classId))
      .map((grade) => {
        const studentId = getLinkedIds(grade.fields?.Ogrenci)[0] || "";
        const student = users.find((user) => user.id === studentId);

        return {
          id: grade.id,
          title: text(grade.fields?.Not_Kaydi) || "Not Kaydı",
          studentId,
          studentName:
            text(student?.fields?.Ad_Soyad) ||
            text(student?.fields?.Eposta) ||
            "Öğrenci",
          gradeType: text(grade.fields?.Not_Turu),
          score: numberOrNull(grade.fields?.Puan),
          maxScore: numberOrNull(grade.fields?.Maksimum_Puan),
          weight: numberOrNull(grade.fields?.Agirlik),
          date: text(grade.fields?.Tarih),
          description: text(grade.fields?.Aciklama),
          publishStatus: text(grade.fields?.Yayin_Durumu),
          createdAt: text(grade.fields?.Olusturma_Tarihi),
        };
      });

    classGrades.sort((a, b) => {
      const dateA = Date.parse(a.date || a.createdAt || "");
      const dateB = Date.parse(b.date || b.createdAt || "");
      return (Number.isFinite(dateB) ? dateB : 0) - (Number.isFinite(dateA) ? dateA : 0);
    });

    return NextResponse.json({
      ok: true,
      teacherFound: Boolean(currentTeacherId),
      classInfo: {
        id: classRecord.id,
        name:
          text(classRecord.fields?.Sinif_Adi) ||
          text(classRecord.fields?.Ders_Adi) ||
          "Sınıf",
        lessonName: text(classRecord.fields?.Ders_Adi),
      },
      students,
      grades: classGrades,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Notlar alınamadı.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
