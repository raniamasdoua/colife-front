import { apiFetch } from "./api";
import type { UserProfile } from "../types/auth";

export async function getMe(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/auth/me");
}

export interface UpdateProfileRequest {
  bio?: string;
  phone?: string;
  address?: string;
}

export async function updateProfile(
  id: string,
  data: UpdateProfileRequest
): Promise<UserProfile> {
  return apiFetch<UserProfile>(`/user/${id}/profile`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** PATCH /user/{id}/password — changer le mot de passe (utilisateur lui-même uniquement) */
export async function changePassword(
  id: string,
  data: ChangePasswordRequest
): Promise<void> {
  await apiFetch<void>(`/user/${id}/password`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** GET /user — liste complète des utilisateurs (admin uniquement) */
export async function getAllUsers(): Promise<UserProfile[]> {
  return apiFetch<UserProfile[]>("/user");
}

/** GET /user/count — nombre total d'utilisateurs (admin uniquement) */
export async function countUsers(): Promise<number> {
  const body = await apiFetch<{ count: number }>("/user/count");
  return body.count;
}
