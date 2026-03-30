import { apiFetch } from "./api";
import type {
  ActivityResponse,
  ActivityTypeOption,
  CreateActivityPayload,
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

export async function getMyActivities(): Promise<ActivityResponse[]> {
  return apiFetch<ActivityResponse[]>("/activities/mine");
}

