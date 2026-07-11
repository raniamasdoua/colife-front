import { describe, it, expect, vi } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../test/msw/server";
import { FUTURE_ACTIVITY, PAST_ACTIVITY, MOCK_CARPOOL, MOCK_PARTICIPANT } from "../../test/msw/handlers";
import {
  getMyActivities,
  getAvailableActivities,
  getRegisteredActivities,
  getActivityTypes,
  createActivity,
  updateActivity,
  deleteActivity,
  subscribeToActivity,
  unsubscribeFromActivity,
  getActivityParticipants,
  getAllActivitiesAdmin,
  getActivityCarpools,
  createCarpoolAsSubscriber,
  joinCarpool,
  leaveCarpool,
  updateCarpool,
  cancelCarpoolByDriver,
} from "../../services/activityService";
import type { CreateActivityPayload, CarpoolRequest } from "../../types/activity";

vi.mock("../../auth/oidcConfig", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
  requireLogout: vi.fn(),
  setAccessToken: vi.fn(),
  setLoginTrigger: vi.fn(),
  setLogoutTrigger: vi.fn(),
  requireLogin: vi.fn(),
}));

const BASE = "http://localhost:8080/api";

describe("getMyActivities", () => {
  it("retourne la liste des activités de l'organisateur", async () => {
    const result = await getMyActivities();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(FUTURE_ACTIVITY.id);
    expect(result[0].title).toBe(FUTURE_ACTIVITY.title);
  });
});

describe("getRegisteredActivities", () => {
  it("retourne la liste des inscriptions", async () => {
    const result = await getRegisteredActivities();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(FUTURE_ACTIVITY.id);
  });
});

describe("getAvailableActivities", () => {
  it("retourne uniquement les activités futures", async () => {
    const result = await getAvailableActivities();
    expect(result.some((a) => a.id === FUTURE_ACTIVITY.id)).toBe(true);
  });

  it("filtre les activités dont la date est passée", async () => {
    const result = await getAvailableActivities();
    expect(result.some((a) => a.id === PAST_ACTIVITY.id)).toBe(false);
  });

  it("retourne moins d'éléments que la réponse brute (filtrage côté client)", async () => {
    const raw = [FUTURE_ACTIVITY, PAST_ACTIVITY];
    server.use(
      http.get(`${BASE}/activities/available`, () => HttpResponse.json(raw))
    );
    const result = await getAvailableActivities();
    expect(result.length).toBeLessThan(raw.length);
  });
});

describe("getActivityTypes", () => {
  it("retourne les types d'activités disponibles", async () => {
    const result = await getActivityTypes();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("name");
  });
});

describe("createActivity", () => {
  it("envoie le payload et retourne l'activité créée", async () => {
    let sentBody: unknown;
    server.use(
      http.post(`${BASE}/activities`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(FUTURE_ACTIVITY, { status: 201 });
      })
    );
    const payload: CreateActivityPayload = {
      title: "Yoga test",
      activityTypeId: 1,
      date: "2099-06-15",
      startTime: "09:00:00",
      endTime: "10:00:00",
      capacity: 10,
      location: { room: "Salle A" },
      locationType: "ON_SITE",
    };
    const result = await createActivity(payload);
    expect((sentBody as Record<string, unknown>).title).toBe("Yoga test");
    expect((sentBody as Record<string, unknown>).capacity).toBe(10);
    expect(result.id).toBe(FUTURE_ACTIVITY.id);
  });
});

describe("updateActivity", () => {
  it("fait un PUT et retourne l'activité mise à jour", async () => {
    let method: string | undefined;
    server.use(
      http.put(`${BASE}/activities/1`, ({ request }) => {
        method = request.method;
        return HttpResponse.json({ ...FUTURE_ACTIVITY, title: "Yoga modifié" });
      })
    );
    const result = await updateActivity(1, {
      title: "Yoga modifié",
      activityTypeId: 1,
      date: "2099-06-15",
      startTime: "09:00:00",
      endTime: "10:00:00",
      capacity: 10,
      location: { room: "Salle A" },
    });
    expect(method).toBe("PUT");
    expect(result.title).toBe("Yoga modifié");
  });
});

describe("deleteActivity", () => {
  it("fait un DELETE et retourne void", async () => {
    const result = await deleteActivity(1);
    expect(result).toBeUndefined();
  });
});

describe("subscribeToActivity", () => {
  it("retourne l'activité avec le compteur de participants incrémenté", async () => {
    const result = await subscribeToActivity(1);
    expect(result.participantCount).toBe(4);
  });
});

describe("unsubscribeFromActivity", () => {
  it("retourne l'activité avec le compteur de participants décrémenté", async () => {
    const result = await unsubscribeFromActivity(1);
    expect(result.participantCount).toBe(2);
  });
});

describe("getActivityParticipants", () => {
  it("retourne la liste des participants d'une activité", async () => {
    const result = await getActivityParticipants(1);
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe(MOCK_PARTICIPANT.firstName);
    expect(result[0].email).toBe(MOCK_PARTICIPANT.email);
  });
});

describe("getAllActivitiesAdmin", () => {
  it("retourne toutes les activités sans paramètre", async () => {
    const result = await getAllActivitiesAdmin();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(FUTURE_ACTIVITY.id);
  });

  it("appelle l'endpoint avec includeDeleted=true quand demandé", async () => {
    const deletedActivity = { ...FUTURE_ACTIVITY, id: 99, deleted: true };
    server.use(
      http.get(`${BASE}/activities`, ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("includeDeleted") === "true") {
          return HttpResponse.json([FUTURE_ACTIVITY, deletedActivity]);
        }
        return HttpResponse.json([FUTURE_ACTIVITY]);
      })
    );
    const result = await getAllActivitiesAdmin(true);
    expect(result).toHaveLength(2);
    expect(result.some((a) => a.deleted)).toBe(true);
  });
});

describe("getActivityCarpools", () => {
  it("retourne les covoiturages et le rôle utilisateur", async () => {
    const result = await getActivityCarpools(1);
    expect(result.carpools).toHaveLength(1);
    expect(result.carpools[0].id).toBe(MOCK_CARPOOL.id);
    expect(result.userRole).toBe("DRIVER");
    expect(result.userCarpoolId).toBe(1);
  });
});

describe("createCarpoolAsSubscriber", () => {
  it("envoie le payload et retourne le covoiturage créé", async () => {
    let sentBody: unknown;
    server.use(
      http.post(`${BASE}/activities/1/carpools`, async ({ request }) => {
        sentBody = await request.json();
        return HttpResponse.json(MOCK_CARPOOL, { status: 201 });
      })
    );
    const payload: CarpoolRequest = { departureTime: "08:30:00", maxPassengers: 3 };
    const result = await createCarpoolAsSubscriber(1, payload);
    expect((sentBody as Record<string, unknown>).departureTime).toBe("08:30:00");
    expect((sentBody as Record<string, unknown>).maxPassengers).toBe(3);
    expect(result.id).toBe(MOCK_CARPOOL.id);
  });
});

describe("joinCarpool", () => {
  it("retourne le covoiturage avec un passager de plus", async () => {
    const result = await joinCarpool(1, 1);
    expect(result.passengerCount).toBe(2);
    expect(result.availableSeats).toBe(1);
  });
});

describe("leaveCarpool", () => {
  it("quitte le covoiturage et retourne void", async () => {
    const result = await leaveCarpool(1, 1);
    expect(result).toBeUndefined();
  });
});

describe("updateCarpool", () => {
  it("envoie un PUT et retourne le covoiturage mis à jour", async () => {
    const result = await updateCarpool(1, 1, { departureTime: "08:00:00", maxPassengers: 4 });
    expect(result.maxPassengers).toBe(4);
    expect(result.availableSeats).toBe(3);
  });
});

describe("cancelCarpoolByDriver", () => {
  it("annule le covoiturage et retourne void", async () => {
    const result = await cancelCarpoolByDriver(1, 1);
    expect(result).toBeUndefined();
  });
});
