import type { RegisterRequest, RegisterResponse } from "../types/auth";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function register(
  data: RegisterRequest
): Promise<RegisterResponse> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Email déjà utilisé");
    }
    if (response.status === 400) {
      throw new Error("Données invalides");
    }
    throw new Error("Erreur serveur");
  }

  return response.json();
}