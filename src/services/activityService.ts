import { apiFetch } from "./api";
import type {
  ActivityResponse,
  ActivityTypeOption,
  CreateActivityPayload,
  UpdateActivityPayload,
} from "../types/activity";

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

export async function getMyActivities(): Promise<ActivityResponse[]> {
  return apiFetch<ActivityResponse[]>("/activities/mine");
}

export async function getAvailableActivities(): Promise<ActivityResponse[]> {
  return apiFetch<ActivityResponse[]>("/activities/available");
}

