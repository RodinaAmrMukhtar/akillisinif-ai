type SyncAirtableUserInput = {
  authId: string;
  email: string;
  fullName: string;
  role: string;
  schoolNumber?: string;
};

export async function syncAirtableUser(input: SyncAirtableUserInput) {
  const response = await fetch("/api/airtable/users/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Airtable kullanıcı eşitlemesi başarısız.",
    );
  }

  return result;
}