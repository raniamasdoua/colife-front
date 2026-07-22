import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import { MOCK_USER } from "../../test/msw/handlers";
import { getMe, updateProfile, getAllUsers, countUsers } from "../../services/userService";

vi.mock("../../auth/oidcConfig", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
  requireLogout: vi.fn(),
  setAccessToken: vi.fn(),
  setLoginTrigger: vi.fn(),
  setLogoutTrigger: vi.fn(),
  requireLogin: vi.fn(),
}));

const BASE = "http://localhost:8080/api";

describe("getMe", () => {
  it("retourne le profil de l'utilisateur connecté", async () => {
    const result = await getMe();
    expect(result.id).toBe(MOCK_USER.id);
    expect(result.firstName).toBe("Alice");
    expect(result.email).toBe("alice.martin@test.fr");
  });
});

describe("updateProfile", () => {
  it("envoie un PATCH et retourne le profil mis à jour", async () => {
    let sentBody: unknown;
    server.use(
      http.patch(`${BASE}/user/${MOCK_USER.id}/profile`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json({ ...MOCK_USER, bio: "Passionnée de yoga" });
      })
    );
    const result = await updateProfile(MOCK_USER.id, { bio: "Passionnée de yoga" });
    expect((sentBody as Record<string, unknown>).bio).toBe("Passionnée de yoga");
    expect(result.bio).toBe("Passionnée de yoga");
  });
});

describe("getAllUsers", () => {
  it("retourne la liste de tous les utilisateurs", async () => {
    const result = await getAllUsers();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(MOCK_USER.id);
  });
});

describe("countUsers", () => {
  it("extrait le nombre depuis la réponse { count: N }", async () => {
    const result = await countUsers();
    expect(result).toBe(42);
  });

  it("retourne 0 si count vaut 0", async () => {
    server.use(
      http.get(`${BASE}/user/count`, () => HttpResponse.json({ count: 0 }))
    );
    const result = await countUsers();
    expect(result).toBe(0);
  });
});
