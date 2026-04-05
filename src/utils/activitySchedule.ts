import type { ActivityResponse } from "../types/activity";

/**
 * Indique si l’activité ne peut plus être modifiée ni supprimée côté API
 * (même règles que {@code ActivityUpdatePolicy.validateActivityIsModifiable}) :
 * - date strictement avant aujourd’hui, ou
 * - aujourd’hui et l’heure actuelle est au ou après l’heure de début (en cours / terminée le jour même).
 */
export function isActivityNoLongerEditable(
  activity: ActivityResponse,
  now: Date = new Date()
): boolean {
  const [y, m, d] = activity.date.split("-").map(Number);
  const actDay = new Date(y, m - 1, d);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (actDay.getTime() < todayStart.getTime()) {
    return true;
  }
  if (actDay.getTime() > todayStart.getTime()) {
    return false;
  }

  const startStr = activity.startTime.slice(0, 5);
  const [sh, sm] = startStr.split(":").map(Number);
  const startToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    sh,
    sm,
    0,
    0
  );
  return now.getTime() >= startToday.getTime();
}
