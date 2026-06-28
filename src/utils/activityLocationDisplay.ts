import type { ActivityResponse } from "../types/activity";

/** Libellé court pour les listes / tableaux admin */
export function formatActivityLocationShort(activity: ActivityResponse): string {
  if (activity.locationType === "ON_SITE") {
    return activity.location.room ?? "Sur site";
  }
  const parts = [activity.location.city, activity.location.street].filter(Boolean);
  return parts.join(", ") || "—";
}

/** Sous-ligne optionnelle (code postal hors site) */
export function formatActivityLocationMeta(activity: ActivityResponse): string | null {
  if (activity.locationType === "ON_SITE") return null;
  return activity.location.postalCode ?? null;
}
