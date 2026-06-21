/**
 * Profil utilisateur renvoyé par le backend (GET /auth/me, GET /user/{id}).
 * L'id correspond au sub Keycloak (UUID, sérialisé en chaîne).
 */
export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "COLLABORATOR";
  bio: string | null;
  phone: string | null;
  address: string | null;
  createdAt: string;
};
