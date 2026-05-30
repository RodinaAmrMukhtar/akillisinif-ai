import { NextResponse } from "next/server";

type AirtableRecord = {
  id: string;
  createdTime?: string;
  fields: Record<string, any>;
};

const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const GRADE_TYPES = ["Vize", "Final", "Laboratuvar", "Ortalama"];

function getString(value: unknown) {
  return String(value || "").trim();
}

function normalize(value: unknown) {
  return getString(value)
    .toLowerCase()
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/\s+/g, " ")
    .trim();
}

function asLinks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function getNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function getAirtableToken() {
  const token = process.env.AIRTABLE_TOKEN?.trim();
  if (!token) throw new Error("AIRTABLE_TOKEN eksik.");
  return token;
}

function getAirtableBaseId() {
  const baseId = process.env.AIRTABLE_BASE_ID?.trim();
  if (!baseId) throw new Error("AIRTABLE_BASE_ID eksik.");
  return baseId;
}

async function airtableFetch<T>(
  tableName: string,
  options: {
    method?: "GET" | "POST" | "PATCH";
    recordId?: string;
    body?: unknown;
  } = {},
): Promise<T> {
  const token = getAirtableToken();
  const baseId = getAirtableBaseId();

  const url = options.recordId
    ? `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}/${options.recordId}`
    : `${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`;

  const response = await fetch(url, {
    method: options.method || "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Airtable işlem hatası. Tablo: ${tableName}. Durum: ${response.status}. Detay: ${details}`,
    );
  }

  return response.json() as Promise<T>;
}

async function listAll(tableName: string): Promise<AirtableRecord[]> {
  const token = getAirtableToken();
  const baseId = getAirtableBaseId();

  let offset = "";
  const records: AirtableRecord[] = [];

  do {
    const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableName)}`);
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

    const data = (await response.json()) as {
      records?: AirtableRecord[];
      offset?: string;
    };

    records.push(...(data.records || []));
    offset = data.offset || "";
  } while (offset);

  return records;
}

function findUser(users: AirtableRecord[], authId: string, email: string, name: string) {
  return users.find((user) => {
    const airtableAuthId = getString(user.fields.Auth_ID);
    const airtableEmail = normalize(user.fields.Eposta);
    const airtableName = normalize(user.fields.Ad_Soyad);

    return (
      Boolean(authId && airtableAuthId === authId) ||
      Boolean(email && airtableEmail === normalize(email)) ||
      Boolean(name && airtableName === normalize(name))
    );
  });
}

function isActiveStudentMembership(membership: AirtableRecord, classId: string) {
  const role = normalize(membership.fields.Uyelik_Rolu);
  const status = normalize(membership.fields.Durum);
  const classIds = asLinks(membership.fields.Sinif);

  return (
    classIds.includes(classId) &&
    (role === "ogrenci" || role === "öğrenci") &&
    status === "aktif"
  );
}

function getGradeForStudent(
  grades: AirtableRecord[],
  studentId: string,
  classId: string,
  type: string,
) {
  return grades.find((grade) => {
    const studentIds = asLinks(grade.fields.Ogrenci);
    const classIds = asLinks(grade.fields.Sinif);
    const gradeType = getString(grade.fields.Not_Turu);

    return (
      studentIds.includes(studentId) &&
      classIds.includes(classId) &&
      gradeType === type
    );
  });
}

function buildGradeName(studentName: string, className: string, type: string) {
  return `${studentName} - ${className} - ${type}`;
}

function calculateAverage(values: {
  vize: number | null;
  final: number | null;
  laboratuvar: number | null;
  useLab: boolean;
}) {
  if (values.useLab) {
    if (
      values.vize === null ||
      values.final === null ||
      values.laboratuvar === null
    ) {
      return null;
    }

    return Math.round((values.vize * 0.3 + values.laboratuvar * 0.2 + values.final * 0.5) * 100) / 100;
  }

  if (values.vize === null || values.final === null) {
    return null;
  }

  return Math.round((values.vize * 0.4 + values.final * 0.6) * 100) / 100;
}

async function upsertGrade(params: {
  existingGrade?: AirtableRecord;
  studentId: string;
  classId: string;
  teacherId: string;
  studentName: string;
  className: string;
  type: string;
  score: number;
  maxPoint: number;
  weight: number;
  description: string;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const fields = {
    Not_Kaydi: buildGradeName(params.studentName, params.className, params.type),
    Ogrenci: [params.studentId],
    Sinif: [params.classId],
    Ogretmen: [params.teacherId],
    Not_Turu: params.type,
    Puan: params.score,
    Maksimum_Puan: params.maxPoint,
    Agirlik: params.weight,
    Tarih: today,
    Aciklama: params.description,
    Yayin_Durumu: "Taslak",
  };

  if (params.existingGrade) {
    await airtableFetch("Notlar", {
      method: "PATCH",
      recordId: params.existingGrade.id,
      body: { fields },
    });

    return params.existingGrade.id;
  }

  const created = await airtableFetch<AirtableRecord>("Notlar", {
    method: "POST",
    body: { fields },
  });

  return created.id;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const classId = getString(searchParams.get("classId"));
    const authId = getString(searchParams.get("authId"));
    const email = getString(searchParams.get("email"));
    const name = getString(searchParams.get("name"));

    if (!classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "classId gerekli.",
        },
        { status: 400 },
      );
    }

    const [users, classes, memberships, grades] = await Promise.all([
      listAll("Kullanicilar"),
      listAll("Siniflar"),
      listAll("Sinif_Uyelikleri"),
      listAll("Notlar"),
    ]);

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

    const loggedTeacher = findUser(users, authId, email, name);
    const teacherId = loggedTeacher?.id || asLinks(classRecord.fields.Ogretmen)[0] || "";

    const activeMemberships = memberships.filter((membership) =>
      isActiveStudentMembership(membership, classId),
    );

    const studentIds = Array.from(
      new Set(activeMemberships.flatMap((membership) => asLinks(membership.fields.Kullanici))),
    );

    const students = studentIds
      .map((studentId) => users.find((user) => user.id === studentId))
      .filter(Boolean) as AirtableRecord[];

    const classGrades = grades.filter((grade) =>
      asLinks(grade.fields.Sinif).includes(classId),
    );

    const rows = students.map((student) => {
      const vize = getGradeForStudent(classGrades, student.id, classId, "Vize");
      const final = getGradeForStudent(classGrades, student.id, classId, "Final");
      const laboratuvar = getGradeForStudent(classGrades, student.id, classId, "Laboratuvar");
      const ortalama = getGradeForStudent(classGrades, student.id, classId, "Ortalama");

      return {
        studentId: student.id,
        studentName: getString(student.fields.Ad_Soyad),
        email: getString(student.fields.Eposta),
        grades: {
          vize: vize
            ? {
                id: vize.id,
                score: getNumber(vize.fields.Puan),
                status: getString(vize.fields.Yayin_Durumu) || "Taslak",
              }
            : null,
          final: final
            ? {
                id: final.id,
                score: getNumber(final.fields.Puan),
                status: getString(final.fields.Yayin_Durumu) || "Taslak",
              }
            : null,
          laboratuvar: laboratuvar
            ? {
                id: laboratuvar.id,
                score: getNumber(laboratuvar.fields.Puan),
                status: getString(laboratuvar.fields.Yayin_Durumu) || "Taslak",
              }
            : null,
          ortalama: ortalama
            ? {
                id: ortalama.id,
                score: getNumber(ortalama.fields.Puan),
                status: getString(ortalama.fields.Yayin_Durumu) || "Taslak",
              }
            : null,
        },
      };
    });

    return NextResponse.json({
      ok: true,
      class: {
        id: classRecord.id,
        name:
          getString(classRecord.fields.Sinif_Adi) ||
          getString(classRecord.fields.Ders_Adi) ||
          "Sınıf",
        courseName: getString(classRecord.fields.Ders_Adi),
        requiresApproval: Boolean(classRecord.fields.Katilim_Onayi_Gerekli_Mi),
      },
      teacher: {
        id: teacherId,
        name: getString(loggedTeacher?.fields?.Ad_Soyad),
        email: getString(loggedTeacher?.fields?.Eposta),
      },
      rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Sınıf not defteri yüklenemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const classId = getString(body.classId);
    const authId = getString(body.authId);
    const email = getString(body.email);
    const name = getString(body.name);
    const useLab = Boolean(body.useLab);
    const rows = Array.isArray(body.rows) ? body.rows : [];

    if (!classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "classId gerekli.",
        },
        { status: 400 },
      );
    }

    const [users, classes, grades] = await Promise.all([
      listAll("Kullanicilar"),
      listAll("Siniflar"),
      listAll("Notlar"),
    ]);

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

    const teacher = findUser(users, authId, email, name);
    const teacherId = teacher?.id || asLinks(classRecord.fields.Ogretmen)[0] || "";
    const className =
      getString(classRecord.fields.Sinif_Adi) ||
      getString(classRecord.fields.Ders_Adi) ||
      "Sınıf";

    if (!teacherId) {
      return NextResponse.json(
        {
          ok: false,
          message: "Öğretmen kaydı bulunamadı.",
        },
        { status: 404 },
      );
    }

    const classGrades = grades.filter((grade) =>
      asLinks(grade.fields.Sinif).includes(classId),
    );

    let savedCount = 0;

    for (const row of rows) {
      const studentId = getString(row.studentId);
      if (!studentId) continue;

      const student = users.find((user) => user.id === studentId);
      if (!student) continue;

      const studentName = getString(student.fields.Ad_Soyad) || "Öğrenci";

      const vize = getNumber(row.vize);
      const final = getNumber(row.final);
      const laboratuvar = getNumber(row.laboratuvar);
      const average = calculateAverage({
        vize,
        final,
        laboratuvar,
        useLab,
      });

      const gradeInputs = [
        {
          type: "Vize",
          score: vize,
          weight: useLab ? 0.3 : 0.4,
        },
        {
          type: "Final",
          score: final,
          weight: useLab ? 0.5 : 0.6,
        },
        {
          type: "Laboratuvar",
          score: useLab ? laboratuvar : null,
          weight: 0.2,
        },
        {
          type: "Ortalama",
          score: average,
          weight: 1,
        },
      ];

      for (const input of gradeInputs) {
        if (input.score === null) continue;

        const existingGrade = getGradeForStudent(
          classGrades,
          studentId,
          classId,
          input.type,
        );

        await upsertGrade({
          existingGrade,
          studentId,
          classId,
          teacherId,
          studentName,
          className,
          type: input.type,
          score: input.score,
          maxPoint: 100,
          weight: input.weight,
          description:
            input.type === "Ortalama"
              ? "UBYS tarzı otomatik ortalama hesabı - Taslak"
              : "UBYS tarzı not girişi - Taslak",
        });

        savedCount += 1;
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Notlar taslak olarak kaydedildi.",
      savedCount,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Notlar taslak olarak kaydedilemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const classId = getString(body.classId);

    if (!classId) {
      return NextResponse.json(
        {
          ok: false,
          message: "classId gerekli.",
        },
        { status: 400 },
      );
    }

    const grades = await listAll("Notlar");
    const today = new Date().toISOString().slice(0, 10);

    const targets = grades.filter((grade) => {
      const classIds = asLinks(grade.fields.Sinif);
      const type = getString(grade.fields.Not_Turu);
      const status = getString(grade.fields.Yayin_Durumu);

      return (
        classIds.includes(classId) &&
        GRADE_TYPES.includes(type) &&
        status !== "Yayinda" &&
        grade.fields.Puan !== undefined
      );
    });

    await Promise.all(
      targets.map((grade) =>
        airtableFetch("Notlar", {
          method: "PATCH",
          recordId: grade.id,
          body: {
            fields: {
              Yayin_Durumu: "Yayinda",
              Yayin_Tarihi: today,
            },
          },
        }),
      ),
    );

    return NextResponse.json({
      ok: true,
      message: "Notlar ilan edildi.",
      publishedCount: targets.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message: "Notlar ilan edilemedi.",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
