import { describe, it, expect } from "vitest";
import { isActivityNoLongerEditable } from "../../utils/activitySchedule";
import type { ActivityResponse } from "../../types/activity";

function makeActivity(date: string, startTime: string): ActivityResponse {
  return {
    id: 1,
    title: "Test",
    description: null,
    capacity: 10,
    participantCount: 0,
    location: { room: null, street: null, complement: null, postalCode: null, city: null },
    activityType: { id: 1, name: "Sport" },
    date,
    startTime,
    endTime: "18:00:00",
    organizerName: "Organisateur",
    locationType: "ON_SITE",
    carpool: null,
  };
}

const NOW = new Date("2026-07-10T12:00:00");

describe("isActivityNoLongerEditable", () => {
  it("retourne true pour une activité passée (autre année)", () => {
    const a = makeActivity("2024-01-15", "09:00:00");
    expect(isActivityNoLongerEditable(a, NOW)).toBe(true);
  });

  it("retourne true pour une activité hier", () => {
    const a = makeActivity("2026-07-09", "09:00:00");
    expect(isActivityNoLongerEditable(a, NOW)).toBe(true);
  });

  it("retourne false pour une activité demain", () => {
    const a = makeActivity("2026-07-11", "09:00:00");
    expect(isActivityNoLongerEditable(a, NOW)).toBe(false);
  });

  it("retourne false pour une activité dans le futur (autre mois)", () => {
    const a = makeActivity("2026-09-01", "09:00:00");
    expect(isActivityNoLongerEditable(a, NOW)).toBe(false);
  });

  it("retourne false aujourd'hui avant l'heure de début", () => {
    const a = makeActivity("2026-07-10", "14:00:00");
    expect(isActivityNoLongerEditable(a, NOW)).toBe(false);
  });

  it("retourne true aujourd'hui exactement à l'heure de début", () => {
    const a = makeActivity("2026-07-10", "12:00:00");
    expect(isActivityNoLongerEditable(a, NOW)).toBe(true);
  });

  it("retourne true aujourd'hui après l'heure de début", () => {
    const a = makeActivity("2026-07-10", "09:00:00");
    expect(isActivityNoLongerEditable(a, NOW)).toBe(true);
  });

  it("utilise new Date() par défaut si now n'est pas fourni", () => {
    const pastDate = "2020-01-01";
    const a = makeActivity(pastDate, "09:00:00");
    expect(isActivityNoLongerEditable(a)).toBe(true);
  });
});
