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
  post_logout_redirect_uri: `${redirectUri}/welcome`,
  scope,
  userStore,
  stateStore,
  monitorSession: false,
  automaticSilentRenew: false,
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

/**
 * Déclenche directement le formulaire Keycloak de changement de mot de passe
 * (Application Initiated Action `kc_action=UPDATE_PASSWORD`), sans passer par
 * la console « Mon compte » (qui exposerait tout un tas d'autres réglages).
 *
 * La gestion du mot de passe est déléguée à Keycloak depuis la migration OIDC :
 * le backend n'expose plus ce flux. Le flow réutilise le client OIDC de
 * l'application (mêmes state/PKCE store que l'AuthProvider) : une fois le mot
 * de passe mis à jour, Keycloak redirige directement vers l'application,
 * plutôt que de laisser l'utilisateur dans la console Keycloak.
 */
export async function changePasswordRedirect(): Promise<void> {
  const request = await registerClient.createSigninRequest({ request_type: "si:r" });
  const url = new URL(request.url);
  url.searchParams.set("kc_action", "UPDATE_PASSWORD");
  window.location.assign(url.toString());
}

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
 * Le composant <AuthBridge/> (dans App.tsx) pousse ici le token courant et les
 * déclencheurs, que le wrapper fetch consomme. */

let currentAccessToken: string | null = null;
let loginTrigger: () => void = () => {};
let logoutTrigger: () => void = () => {};

export function setAccessToken(token: string | null): void {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

export function setLoginTrigger(fn: () => void): void {
  loginTrigger = fn;
}

export function setLogoutTrigger(fn: () => void): void {
  logoutTrigger = fn;
}

export function requireLogin(): void {
  loginTrigger();
}

export function requireLogout(): void {
  logoutTrigger();
}
