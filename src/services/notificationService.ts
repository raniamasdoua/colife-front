import { apiFetch } from "./api";
import type { NotificationResponse } from "../types/notification";

/** GET /notifications — mes notifications, les plus récentes en premier */
export async function getNotifications(): Promise<NotificationResponse[]> {
  return apiFetch<NotificationResponse[]>("/notifications");
}

/** GET /notifications/unread-count */
export async function getUnreadNotificationCount(): Promise<number> {
  const data = await apiFetch<{ unreadCount: number }>("/notifications/unread-count");
  return data.unreadCount;
}

/** PUT /notifications/{id}/read */
export async function markNotificationAsRead(notificationId: number): Promise<NotificationResponse> {
  return apiFetch<NotificationResponse>(`/notifications/${notificationId}/read`, {
    method: "PUT",
  });
}

/** PUT /notifications/read-all — 204 No Content */
export async function markAllNotificationsAsRead(): Promise<void> {
  return apiFetch<void>("/notifications/read-all", {
    method: "PUT",
  });
}
