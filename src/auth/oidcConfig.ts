import { WebStorageStateStore, OidcClient } from "oidc-client-ts";
import type { AuthProviderProps } from "react-oidc-context";

const authority = import.meta.env.VITE_KEYCLOAK_AUTHORITY;
const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID;
const redirectUri =
  import.meta.env.VITE_KEYCLOAK_REDIRECT_URI ?? window.location.origin;
const scope = "openid profile email";

// Stores partagés (localStorage) entre l'AuthProvider et le client d'inscription
// ci-dessous, pour que le state/PKCE généré soit retrouvé au retour du callback.
const stateStore = new WebStorageStateStore({ store: window.localStorage });
const userStore = new WebStorageStateStore({ store: window.localStorage });

/**
 * Configuration du client OIDC (Keycloak) — flow Authorization Code + PKCE.
 * Les tokens (access + refresh) sont gérés et rafraîchis automatiquement par la lib.
 */
export const oidcConfig: AuthProviderProps = {
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  // Après déconnexion Keycloak, on revient sur la page d'accueil de l'appli
  // (pas sur un écran Keycloak).
  post_logout_redirect_uri: `${redirectUri}/welcome`,
  scope,
  userStore,
  stateStore,
  // Nettoie le code/state de l'URL après le retour du flow d'autorisation.
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

/**
 * Redirige directement vers le FORMULAIRE D'INSCRIPTION de Keycloak.
 *
 * Keycloak n'expose pas l'inscription via un simple paramètre sur l'endpoint
 * d'autorisation ; on génère donc un vrai signin request (state + PKCE, stockés
 * dans le même {@link stateStore} que l'AuthProvider) puis on bascule l'URL de
 * `/protocol/openid-connect/auth` vers `/protocol/openid-connect/registrations`.
 * Au retour, react-oidc-context retrouve le state et échange le code normalement.
 */
const registerClient = new OidcClient({
  authority,
  client_id: clientId,
  redirect_uri: redirectUri,
  scope,
  stateStore,
});

export async function registerRedirect(): Promise<void> {
  // request_type "si:r" = signin via redirect : indispensable pour que
  // react-oidc-context reconnaisse et traite le state au retour du callback.
  const request = await registerClient.createSigninRequest({ request_type: "si:r" });
  const url = request.url.replace(
    "/protocol/openid-connect/auth",
    "/protocol/openid-connect/registrations"
  );
  window.location.assign(url);
}

/* ── Pont OIDC ↔ couche fetch (modules non-React) ────────────────────────────
 * api.ts n'est pas un composant React : il ne peut pas utiliser useAuth().
 * Le composant <AuthBridge/> (dans App.tsx) pousse ici le token courant et le
 * déclencheur de login, que le wrapper fetch consomme. */

let currentAccessToken: string | null = null;
let loginTrigger: () => void = () => {};

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setLoginTrigger(fn: () => void): void {
  loginTrigger = fn;
}

/** Déclenche une (re)connexion via Keycloak (utilisé sur 401). */
export function requireLogin(): void {
  loginTrigger();
}
