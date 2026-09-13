import { apiFetch } from "./api";
import type {
  ActivityCarpoolsResponse,
  ActivityParticipant,
  ActivityResponse,
  ActivityTypeOption,
  CarpoolDetail,
  CarpoolRequest,
  CreateActivityPayload,
  MaterialRequest,
  MaterialResponse,
  UpdateActivityPayload,
  UserActivities,
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

/** GET /activities/user/{userId} — activités organisées et inscriptions d'un utilisateur (admin uniquement) */
export async function getUserActivities(userId: string): Promise<UserActivities> {
  return apiFetch<UserActivities>(`/activities/user/${userId}`);
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

/* ── Covoiturage ─────────────────────────────────────────────────────────── */

/** GET /activities/{id}/carpools — liste des covoiturages + rôle utilisateur */
export async function getActivityCarpools(activityId: number): Promise<ActivityCarpoolsResponse> {
  return apiFetch<ActivityCarpoolsResponse>(`/activities/${activityId}/carpools`);
}

/** POST /activities/{id}/carpools — proposer un covoiturage (en tant qu'inscrit) */
export async function createCarpoolAsSubscriber(
  activityId: number,
  payload: CarpoolRequest
): Promise<CarpoolDetail> {
  return apiFetch<CarpoolDetail>(`/activities/${activityId}/carpools`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /activities/{id}/carpools/{carpoolId}/join — rejoindre un covoiturage */
export async function joinCarpool(activityId: number, carpoolId: number): Promise<CarpoolDetail> {
  return apiFetch<CarpoolDetail>(`/activities/${activityId}/carpools/${carpoolId}/join`, {
    method: "POST",
  });
}

/** DELETE /activities/{id}/carpools/{carpoolId}/leave — quitter un covoiturage */
export async function leaveCarpool(activityId: number, carpoolId: number): Promise<void> {
  return apiFetch<void>(`/activities/${activityId}/carpools/${carpoolId}/leave`, {
    method: "DELETE",
  });
}

/** PUT /activities/{id}/carpools/{carpoolId} — conducteur modifie sa proposition */
export async function updateCarpool(
  activityId: number,
  carpoolId: number,
  payload: CarpoolRequest
): Promise<CarpoolDetail> {
  return apiFetch<CarpoolDetail>(`/activities/${activityId}/carpools/${carpoolId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** DELETE /activities/{id}/carpools/{carpoolId} — conducteur annule sa proposition */
export async function cancelCarpoolByDriver(
  activityId: number,
  carpoolId: number
): Promise<void> {
  return apiFetch<void>(`/activities/${activityId}/carpools/${carpoolId}`, {
    method: "DELETE",
  });
}

/** GET /activities/{id}/materials — lister le matériel proposé pour une activité */
export async function getActivityMaterials(activityId: number): Promise<MaterialResponse[]> {
  return apiFetch<MaterialResponse[]>(`/activities/${activityId}/materials`);
}

/** POST /activities/{id}/materials — proposer du matériel */
export async function proposeMaterial(
  activityId: number,
  payload: MaterialRequest
): Promise<MaterialResponse> {
  return apiFetch<MaterialResponse>(`/activities/${activityId}/materials`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** PUT /activities/{id}/materials/{materialId} — modifier sa proposition de matériel */
export async function updateMaterial(
  activityId: number,
  materialId: number,
  payload: MaterialRequest
): Promise<MaterialResponse> {
  return apiFetch<MaterialResponse>(`/activities/${activityId}/materials/${materialId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

/** DELETE /activities/{id}/materials/{materialId} — retirer sa proposition de matériel */
export async function removeMaterial(activityId: number, materialId: number): Promise<void> {
  return apiFetch<void>(`/activities/${activityId}/materials/${materialId}`, {
    method: "DELETE",
  });
}

