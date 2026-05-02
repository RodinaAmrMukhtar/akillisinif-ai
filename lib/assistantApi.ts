export async function askAcademicAssistant(input: {
  authId: string;
  role: "Ogretmen" | "Ogrenci";
  question: string;
}) {
  const response = await fetch("/api/ai/academic-assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error || result?.message || "Akademik asistan yanıtı oluşturulamadı.",
    );
  }

  return result.answer as string;
}
