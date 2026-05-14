import { apiFetch } from "./api";
import type {
  ActivityParticipant,
  ActivityResponse,
  ActivityTypeOption,
  CreateActivityPayload,
  UpdateActivityPayload,
} from "../types/activity";
import { isActivityNoLongerEditable } from "../utils/activitySchedule";

export async function getActivityTypes(): Promise<ActivityTypeOption[]> {
  return apiFetch<ActivityTypeOption[]>("/activity-types");
}

export async function createActivity(
  payload: CreateActivityPayload
): Promise<ActivityResponse> {
  return apiFetch<ActivityResponse>("/activities", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateActivity(
  activityId: number,
  payload: UpdateActivityPayload
): Promise<ActivityResponse> {
  return apiFetch<ActivityResponse>(`/activities/${activityId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** DELETE /activities/{id} — 204 No Content */
export async function deleteActivity(activityId: number): Promise<void> {
  return apiFetch<void>(`/activities/${activityId}`, {
    method: "DELETE",
  });
}

/** GET /activities/{id}/participants — liste des membres inscrits (admin uniquement) */
export async function getActivityParticipants(activityId: number): Promise<ActivityParticipant[]> {
  return apiFetch<ActivityParticipant[]>(`/activities/${activityId}/participants`);
}

/** GET /activities — liste toutes les activités (admin uniquement). Passer includeDeleted=true pour inclure les supprimées. */
export async function getAllActivitiesAdmin(includeDeleted = false): Promise<ActivityResponse[]> {
  const qs = includeDeleted ? "?includeDeleted=true" : "";
  return apiFetch<ActivityResponse[]>(`/activities${qs}`);
}

export async function getMyActivities(): Promise<ActivityResponse[]> {
  return apiFetch<ActivityResponse[]>("/activities/mine");
}

/** GET /activities/registered — inscriptions où vous n'êtes pas l'organisateur */
export async function getRegisteredActivities(): Promise<ActivityResponse[]> {
  return apiFetch<ActivityResponse[]>("/activities/registered");
}

export async function getAvailableActivities(): Promise<ActivityResponse[]> {
  const data = await apiFetch<ActivityResponse[]>("/activities/available");
  // On n'affiche pas les activités déjà passées / en cours (même logique que backend).
  const now = new Date();
  return data.filter((a) => !isActivityNoLongerEditable(a, now));
}

/** POST /activities/{id}/subscribe — 201 Created */
export async function subscribeToActivity(activityId: number): Promise<ActivityResponse> {
  return apiFetch<ActivityResponse>(`/activities/${activityId}/subscribe`, {
    method: "POST",
  });
}

/** DELETE /activities/{id}/subscribe — 200 OK, effectif à jour */
export async function unsubscribeFromActivity(activityId: number): Promise<ActivityResponse> {
  return apiFetch<ActivityResponse>(`/activities/${activityId}/subscribe`, {
    method: "DELETE",
  });
}

