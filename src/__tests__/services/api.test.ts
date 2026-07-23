import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import { getAccessToken, requireLogout } from "../../auth/oidcConfig";
import { apiFetch, ApiRequestError } from "../../services/api";

vi.mock("../../auth/oidcConfig", () => ({
  getAccessToken: vi.fn().mockReturnValue(null),
  requireLogout: vi.fn(),
  setAccessToken: vi.fn(),
  setLoginTrigger: vi.fn(),
  setLogoutTrigger: vi.fn(),
  requireLogin: vi.fn(),
}));

const BASE = "http://localhost:8080/api";

describe("ApiRequestError", () => {
  it("a le bon nom, message, status et hérite de Error", () => {
    const err = new ApiRequestError("ressource introuvable", 404);
    expect(err.name).toBe("ApiRequestError");
    expect(err.message).toBe("ressource introuvable");
    expect(err.status).toBe(404);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiRequestError);
  });
});

describe("apiFetch", () => {
  beforeEach(() => {
    vi.mocked(getAccessToken).mockReturnValue(null);
    vi.mocked(requireLogout).mockReset();
  });

  it("retourne les données JSON sur une réponse 200", async () => {
    server.use(http.get(`${BASE}/ping`, () => HttpResponse.json({ ok: true })));
    const result = await apiFetch<{ ok: boolean }>("/ping");
    expect(result).toEqual({ ok: true });
  });

  it("retourne undefined sur une réponse 204", async () => {
    server.use(
      http.delete(`${BASE}/resource/1`, () => new HttpResponse(null, { status: 204 }))
    );
    const result = await apiFetch<void>("/resource/1", { method: "DELETE" });
    expect(result).toBeUndefined();
  });

  it("inclut le header Authorization Bearer quand un token est disponible", async () => {
    let capturedAuth: string | null = null;
    server.use(
      http.get(`${BASE}/secured`, ({ request }) => {
        capturedAuth = request.headers.get("Authorization");
        return HttpResponse.json({});
      })
    );
    vi.mocked(getAccessToken).mockReturnValue("my-access-token");
    await apiFetch("/secured");
    expect(capturedAuth).toBe("Bearer my-access-token");
  });

  it("n'inclut pas Authorization quand aucun token n'est disponible", async () => {
    let capturedAuth: string | null = "sentinel";
    server.use(
      http.get(`${BASE}/public`, ({ request }) => {
        capturedAuth = request.headers.get("Authorization");
        return HttpResponse.json({});
      })
    );
    vi.mocked(getAccessToken).mockReturnValue(null);
    await apiFetch("/public");
    expect(capturedAuth).toBeNull();
  });

  it("lance ApiRequestError avec le message JSON sur une réponse 404", async () => {
    server.use(
      http.get(`${BASE}/not-found`, () =>
        HttpResponse.json({ message: "Ressource introuvable" }, { status: 404 })
      )
    );
    const err = await apiFetch("/not-found").catch((e) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect((err as ApiRequestError).message).toBe("Ressource introuvable");
    expect((err as ApiRequestError).status).toBe(404);
  });

  it("lance ApiRequestError avec message générique sur erreur sans body JSON", async () => {
    server.use(
      http.get(`${BASE}/server-error`, () => new HttpResponse("Internal Server Error", { status: 500 }))
    );
    const err = await apiFetch("/server-error").catch((e) => e);
    expect(err).toBeInstanceOf(ApiRequestError);
    expect((err as ApiRequestError).status).toBe(500);
  });

  it("appelle requireLogout et lance ApiRequestError sur une réponse 401", async () => {
    server.use(
      http.get(`${BASE}/protected`, () => new HttpResponse(null, { status: 401 }))
    );
    await apiFetch("/protected").catch(() => {});
    expect(vi.mocked(requireLogout)).toHaveBeenCalledTimes(1);
  });
});
