export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  importance: string;
  channel: string;
  classId: string;
  className: string;
  isRead: boolean;
  sent: boolean;
  createdAt: string;
  readAt: string;
};

export type NotificationsResponse = {
  ok: boolean;
  message?: string;
  error?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
  unreadCount: number;
  notifications: AppNotification[];
};

export type NotificationIdentity = {
  authId: string;
  email?: string;
  name?: string;
};

function buildQuery(identity: NotificationIdentity) {
  const query = new URLSearchParams();

  if (identity.authId) query.set("authId", identity.authId);
  if (identity.email) query.set("email", identity.email);
  if (identity.name) query.set("name", identity.name);

  return query;
}

export async function getNotifications(
  identity: NotificationIdentity,
): Promise<NotificationsResponse> {
  const query = buildQuery(identity);

  const response = await fetch(`/api/airtable/notifications/list?${query.toString()}`, {
    method: "GET",
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ? `${data.message} Detay: ${data.error}` : data.message);
  }

  return data;
}

export async function markNotificationRead(params: NotificationIdentity & {
  notificationId: string;
}) {
  const response = await fetch("/api/airtable/notifications/mark-read", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ? `${data.message} Detay: ${data.error}` : data.message);
  }

  return data;
}

export async function markAllNotificationsRead(identity: NotificationIdentity) {
  const response = await fetch("/api/airtable/notifications/mark-read", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...identity,
      markAll: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ? `${data.message} Detay: ${data.error}` : data.message);
  }

  return data;
}
