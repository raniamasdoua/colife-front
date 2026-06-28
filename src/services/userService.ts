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

/** GET /user — liste complète des utilisateurs (admin uniquement) */
export async function getAllUsers(): Promise<UserProfile[]> {
  return apiFetch<UserProfile[]>("/user");
}

/** GET /user/count — nombre total d'utilisateurs (admin uniquement) */
export async function countUsers(): Promise<number> {
  const body = await apiFetch<{ count: number }>("/user/count");
  return body.count;
}
