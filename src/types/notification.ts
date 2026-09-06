export type NotificationType = "ACTIVITY_UPDATED" | "ACTIVITY_CANCELLED" | "CARPOOL_CANCELLED";

/** Réponse GET /notifications */
export interface NotificationResponse {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  activityId: number | null;
  read: boolean;
  createdAt: string;
}
