export type AppNotification = {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: "low" | "medium" | "high";
  href: string;
  date: string;
};

export type NotificationsData = {
  user: {
    id: string;
    name: string;
    role: string;
  };
  summary: {
    total: number;
    highPriority: number;
  };
  notifications: AppNotification[];
};

export async function getNotifications(authId: string) {
  const response = await fetch(
    `/api/airtable/notifications/list?authId=${encodeURIComponent(authId)}`,
  );

  const result = await response.json();

  if (!response.ok || !result.ok) {
    throw new Error(result?.error || result?.message || "Bildirimler yüklenemedi.");
  }

  return {
    user: result.user,
    summary: result.summary,
    notifications: result.notifications,
  } as NotificationsData;
}
