import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import {
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import type { NotificationResponse } from "../types/notification";

const POLL_INTERVAL_MS = 30_000;

type NotificationContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => void;
  markAsRead: (notification: NotificationResponse) => Promise<NotificationResponse>;
  markAllAsRead: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

/**
 * Source unique du compteur de notifications non lues, partagée par la cloche
 * de la topbar, la sidebar et la page /notifications : évite que chacun tienne
 * son propre état et se désynchronise (cf. double getMe() côté profil).
 */
export function NotificationProvider({ children }: { readonly children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(() => {
    getUnreadNotificationCount()
      .then(setUnreadCount)
      .catch(() => {
        // Échec silencieux : le badge reste à sa dernière valeur connue.
      });
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  const markAsRead = useCallback(async (notification: NotificationResponse) => {
    if (notification.read) return notification;
    const updated = await markNotificationAsRead(notification.id);
    setUnreadCount((prev) => Math.max(0, prev - 1));
    return updated;
  }, []);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsAsRead();
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{ unreadCount, refreshUnreadCount, markAsRead, markAllAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationCount(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotificationCount doit être utilisé dans un NotificationProvider");
  }
  return ctx;
}
