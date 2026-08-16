import api from "./api.js";

const normalizeNotification = (item = {}) => ({
  id: item.id ?? item.notificationId ?? null,
  eventType: item.eventType ?? item.event_type ?? item.type ?? "SYSTEM",
  title: item.title ?? "Notification",
  message: item.message ?? item.body ?? "",
  aggregateType: item.aggregateType ?? item.aggregate_type ?? null,
  aggregateId: item.aggregateId ?? item.aggregate_id ?? null,
  metadata: item.metadata ?? {},
  read: Boolean(item.read ?? item.isRead ?? false),
  createdAt: item.createdAt ?? item.created_at ?? new Date().toISOString(),
  sourceUserId: item.sourceUserId ?? item.source_user_id ?? null,
});

const normalizeCollection = (payload = []) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.content)) return payload.content;
  return [];
};

export async function getNotifications(page = 0, size = 20) {
  const response = await api.get("/notifications", { params: { page, size } });
  const content = normalizeCollection(response?.data).map(normalizeNotification);

  return {
    content,
    page: response?.data?.page ?? page,
    size: response?.data?.size ?? size,
    totalElements: response?.data?.totalElements ?? content.length,
    totalPages: response?.data?.totalPages ?? 1,
  };
}

export async function getUnreadCount() {
  const response = await api.get("/notifications/unread-count");
  return Number(response?.data?.unreadCount ?? response?.data?.count ?? 0);
}

export async function markNotificationRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data;
}

export async function markAllNotificationsRead() {
  const response = await api.patch("/notifications/read-all");
  return response.data;
}

export async function deleteNotification(id) {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
}

export default {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
};
