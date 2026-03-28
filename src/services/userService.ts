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
