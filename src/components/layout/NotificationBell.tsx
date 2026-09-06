import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CalendarClock, CalendarX, Car, Loader2 } from "lucide-react";

import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/notificationService";
import { ApiRequestError } from "../../services/api";
import type { NotificationResponse, NotificationType } from "../../types/notification";

const POLL_INTERVAL_MS = 30_000;
const DROPDOWN_LIMIT = 8;

const TYPE_ICON: Record<NotificationType, typeof CalendarClock> = {
  ACTIVITY_UPDATED: CalendarClock,
  ACTIVITY_CANCELLED: CalendarX,
  CARPOOL_CANCELLED: Car,
};

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationResponse[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchUnreadCount = () => {
      getUnreadNotificationCount()
        .then((count) => {
          if (!cancelled) setUnreadCount(count);
        })
        .catch(() => {
          // Échec silencieux : le badge reste simplement à sa dernière valeur connue.
        });
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && notifications === null) {
      setLoading(true);
      setError(null);
      getNotifications()
        .then(setNotifications)
        .catch((e) => setError(e instanceof ApiRequestError ? e.message : "Impossible de charger les notifications."))
        .finally(() => setLoading(false));
    }
  };

  const handleMarkAsRead = async (notification: NotificationResponse) => {
    if (notification.read) return;
    try {
      const updated = await markNotificationAsRead(notification.id);
      setNotifications((prev) => prev?.map((n) => (n.id === updated.id ? updated : n)) ?? prev);
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Échec silencieux : la notification reste non lue, l'utilisateur peut réessayer.
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev?.map((n) => ({ ...n, read: true })) ?? prev);
      setUnreadCount(0);
    } catch {
      // Échec silencieux.
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
      >
        <Bell className="h-5 w-5" aria-hidden />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-bold text-slate-900">Notifications</p>
            {notifications && notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-xs text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            )}

            {error && <p className="px-4 py-3 text-xs text-red-600">{error}</p>}

            {!loading && !error && notifications && notifications.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-gray-400 italic">
                Aucune notification pour le moment.
              </p>
            )}

            {!loading && !error && notifications && notifications.length > 0 && (
              <ul>
                {notifications.slice(0, DROPDOWN_LIMIT).map((n) => {
                  const Icon = TYPE_ICON[n.type];
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(n)}
                        className={`flex w-full items-start gap-2.5 border-b border-slate-50 px-4 py-3 text-left transition hover:bg-slate-50 ${
                          n.read ? "" : "bg-violet-50/60"
                        }`}
                      >
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" aria-hidden />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm ${n.read ? "text-gray-600" : "font-semibold text-gray-900"}`}>
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">{n.message}</p>
                          <p className="mt-1 text-[11px] text-gray-400">{formatRelativeDate(n.createdAt)}</p>
                        </div>
                        {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" aria-hidden />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {!loading && !error && notifications && notifications.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate("/notifications");
              }}
              className="w-full rounded-b-2xl border-t border-slate-100 py-2.5 text-center text-xs font-semibold text-violet-600 hover:bg-slate-50 hover:text-violet-700"
            >
              Tout voir
            </button>
          )}
        </div>
      )}
    </div>
  );
}
