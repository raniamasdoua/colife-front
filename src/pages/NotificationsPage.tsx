import { useEffect, useState } from "react";
import { Bell, CalendarClock, CalendarX, Car, Loader2 } from "lucide-react";

import { CollaboratorLayout } from "../components/layout/CollaboratorLayout";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../services/notificationService";
import { ApiRequestError } from "../services/api";
import type { NotificationResponse, NotificationType } from "../types/notification";

const TYPE_ICON: Record<NotificationType, typeof CalendarClock> = {
  ACTIVITY_UPDATED: CalendarClock,
  ACTIVITY_CANCELLED: CalendarX,
  CARPOOL_CANCELLED: Car,
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getNotifications()
      .then((data) => {
        if (!cancelled) setNotifications(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof ApiRequestError ? e.message : "Impossible de charger les notifications.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleMarkAsRead = async (notification: NotificationResponse) => {
    if (notification.read) return;
    try {
      const updated = await markNotificationAsRead(notification.id);
      setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch {
      // Échec silencieux : la notification reste non lue, l'utilisateur peut réessayer.
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      // Échec silencieux.
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <CollaboratorLayout>
      <div className="space-y-4 pb-6">
        <section>
          <div className="rounded-2xl bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-200/80 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" aria-hidden />
            <div className="flex items-center justify-between gap-3 p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-md">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900">Notifications</h1>
                  <p className="text-sm text-slate-500">
                    {loading
                      ? "Chargement…"
                      : unreadCount > 0
                        ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                        : "Tout est à jour"}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="shrink-0 rounded-xl px-3 py-2 text-sm font-semibold text-violet-600 hover:bg-violet-50"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>
        </section>

        <section>
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-10 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-10 text-center">
              <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Impossible de charger les notifications</p>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-10 text-center">
              <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Aucune notification</p>
              <p className="mt-1 text-sm text-slate-500">Vous serez prévenu ici en cas de changement sur vos activités.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {notifications.map((n) => {
                const Icon = TYPE_ICON[n.type];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(n)}
                      className={`flex w-full items-start gap-3 rounded-2xl bg-white p-4 text-left shadow-md ring-1 transition hover:ring-purple-200 ${
                        n.read ? "ring-slate-100" : "ring-violet-200 bg-violet-50/40"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600">
                        <Icon className="h-4.5 w-4.5" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm ${n.read ? "text-gray-700" : "font-semibold text-gray-900"}`}>
                          {n.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{n.message}</p>
                        <p className="mt-1.5 text-xs text-gray-400">{formatDate(n.createdAt)}</p>
                      </div>
                      {!n.read && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-violet-500" aria-hidden />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </CollaboratorLayout>
  );
}
