import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { subscribeLiveTopic } from "../services/liveUpdates.js";
import {
  deleteNotification as deleteNotificationApi,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notificationService.js";

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

const dedupeNotifications = (items = []) => {
  const seen = new Set();
  const unique = [];

  for (const item of [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))) {
    const normalized = normalizeNotification(item);
    const key = normalized.id ?? `${normalized.eventType}|${normalized.title}|${normalized.message}|${normalized.createdAt}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(normalized);
  }

  return unique;
};

export default function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const syncUnreadCount = useCallback((items) => {
    setUnreadCount(items.filter((item) => !item.read).length);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [{ content }, count] = await Promise.all([
        getNotifications(0, 20),
        getUnreadCount(),
      ]);

      const next = dedupeNotifications(content);
      setNotifications(next);
      syncUnreadCount(next);
    } catch (err) {
      console.error("Notification load failed", err);
      setError("Unable to load notifications. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [syncUnreadCount, user]);

  const applyRealtimeNotification = useCallback((incoming) => {
    if (!incoming) return;

    const nextNotification = normalizeNotification(incoming);
    setNotifications((prev) => {
      const merged = dedupeNotifications([nextNotification, ...prev]);
      syncUnreadCount(merged);
      return merged;
    });

    if (!nextNotification.read) {
      setToast({
        id: nextNotification.id ?? `${nextNotification.eventType}-${Date.now()}`,
        title: nextNotification.title || "New notification",
        message: nextNotification.message || "You have a new update.",
        eventType: nextNotification.eventType,
      });
    }
  }, [syncUnreadCount]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return undefined;
    }

    refreshNotifications();

    const unsubscribe = subscribeLiveTopic("/user/queue/notifications", (payload) => {
      applyRealtimeNotification(payload);
    });

    return () => {
      unsubscribe?.();
    };
  }, [applyRealtimeNotification, refreshNotifications, user]);

  const markAsRead = useCallback(async (id) => {
    if (!id) return;

    const previous = notifications;
    setNotifications((current) => {
      const updated = current.map((item) =>
        item.id === id ? { ...item, read: true } : item
      );
      syncUnreadCount(updated);
      return updated;
    });

    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error("Failed to mark notification read", err);
      setNotifications(previous);
      syncUnreadCount(previous);
      setError("Unable to update notification. Please try again.");
    }
  }, [notifications, syncUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) => {
      const updated = current.map((item) => ({ ...item, read: true }));
      syncUnreadCount(updated);
      return updated;
    });

    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error("Failed to mark all notifications read", err);
      refreshNotifications();
      setError("Unable to update notifications. Please try again.");
    }
  }, [refreshNotifications, syncUnreadCount]);

  const removeNotification = useCallback(async (id) => {
    if (!id) return;

    const previous = notifications;
    setNotifications((current) => {
      const updated = current.filter((item) => item.id !== id);
      syncUnreadCount(updated);
      return updated;
    });

    try {
      await deleteNotificationApi(id);
    } catch (err) {
      console.error("Failed to delete notification", err);
      setNotifications(previous);
      syncUnreadCount(previous);
      setError("Unable to delete notification. Please try again.");
    }
  }, [notifications, syncUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    toast,
    setToast,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
  };
}
