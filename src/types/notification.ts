export type NotificationType =
  | "ACTIVITY_UPDATED"
  | "ACTIVITY_CANCELLED"
  | "CARPOOL_CANCELLED"
  | "CARPOOL_UPDATED"
  | "NEW_SUBSCRIBER"
  | "ACTIVITY_FULL";

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
