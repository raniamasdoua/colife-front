import { apiFetch } from "./api";
import type { ActivityTypeOption } from "../types/activity";

export type ActivityTypeCreatePayload = { name: string };

export async function listActivityTypes(): Promise<ActivityTypeOption[]> {
  return apiFetch<ActivityTypeOption[]>("/activity-types");
}

/** GET /activity-types/count — total en base sans charger la liste */
export async function countActivityTypes(): Promise<number> {
  const body = await apiFetch<{ count: number }>("/activity-types/count");
  return body.count;
}

export async function getActivityType(id: number): Promise<ActivityTypeOption> {
  return apiFetch<ActivityTypeOption>(`/activity-types/${id}`);
}

export async function createActivityType(
  payload: ActivityTypeCreatePayload
): Promise<ActivityTypeOption> {
  return apiFetch<ActivityTypeOption>("/activity-types", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateActivityType(
  id: number,
  payload: ActivityTypeCreatePayload
): Promise<ActivityTypeOption> {
  return apiFetch<ActivityTypeOption>(`/activity-types/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteActivityType(id: number): Promise<void> {
  return apiFetch<void>(`/activity-types/${id}`, {
    method: "DELETE",
  });
}
