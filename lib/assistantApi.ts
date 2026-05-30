import { supabase } from "@/lib/supabaseClient";

type AssistantInput = {
  authId?: string;
  prompt?: string;
  question?: string;
  message?: string;
  role?: string;
  userEmail?: string;
  userName?: string;
  classId?: string;
  pageContext?: string;
};

function getString(value: unknown) {
  return String(value || "").trim();
}

function getUserName(user: any) {
  return (
    getString(user?.user_metadata?.ad_soyad) ||
    getString(user?.user_metadata?.full_name) ||
    getString(user?.email)
  );
}

function getUserRole(user: any, fallbackRole?: string) {
  return (
    getString(user?.user_metadata?.rol) ||
    getString(user?.user_metadata?.role) ||
    getString(fallbackRole)
  );
}

export async function askAcademicAssistant(input: AssistantInput) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const message =
    getString(input.message) ||
    getString(input.prompt) ||
    getString(input.question);

  const response = await fetch("/api/ai/academic-assistant", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      authId: getString(input.authId) || getString(user?.id),
      message,
      prompt: message,
      question: message,
      role: getUserRole(user, input.role),
      userEmail: getString(input.userEmail) || getString(user?.email),
      userName: getString(input.userName) || getUserName(user),
      classId: getString(input.classId),
      pageContext: getString(input.pageContext),
    }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Akademik asistan yan?t? olu?turulamad?.",
    );
  }

  return result.answer as string;
}
