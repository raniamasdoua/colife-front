import type { RegisterRequest, LoginRequest, LoginResponse } from "../types/auth";

const API_URL = import.meta.env.VITE_API_BASE_URL;

export async function register(data: RegisterRequest): Promise<void> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error("Cet email est déjà utilisé");
    }
    if (response.status === 400) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? "Données invalides. Vérifiez le format de l'email (@entreprise.com) et les critères du mot de passe.");
    }
    throw new Error("Une erreur serveur est survenue. Réessayez plus tard.");
  }
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Email ou mot de passe incorrect.");
    }
    if (response.status === 400) {
      throw new Error("Veuillez vérifier vos informations de connexion.");
    }
    throw new Error("Une erreur serveur est survenue. Réessayez plus tard.");
  }

  const body: LoginResponse = await response.json();
  localStorage.setItem("token", body.token);
  return body;
}