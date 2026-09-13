import { createContext, useContext } from "react";
import type { UserProfile } from "../types/auth";

/**
 * Profil de l'utilisateur admin, déjà récupéré par <AdminRoute/> pour vérifier
 * le rôle : évite à <AdminLayout/> de refaire le même appel getMe().
 */
const AdminUserContext = createContext<UserProfile | null>(null);

export const AdminUserProvider = AdminUserContext.Provider;

export function useAdminUser(): UserProfile | null {
  return useContext(AdminUserContext);
}
