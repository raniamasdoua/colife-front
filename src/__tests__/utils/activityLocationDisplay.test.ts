import { describe, it, expect } from "vitest";
import {
  formatActivityLocationShort,
  formatActivityLocationMeta,
} from "../../utils/activityLocationDisplay";
import type { ActivityResponse } from "../../types/activity";

function makeActivity(
  locationType: ActivityResponse["locationType"],
  location: Partial<ActivityResponse["location"]>
): ActivityResponse {
  return {
    id: 1,
    title: "Test",
    description: null,
    capacity: 10,
    participantCount: 0,
    location: {
      room: null,
      street: null,
      complement: null,
      postalCode: null,
      city: null,
      ...location,
    },
    activityType: { id: 1, name: "Sport" },
    date: "2026-07-10",
    startTime: "09:00:00",
    endTime: "11:00:00",
    organizerName: "Organisateur",
    locationType,
    carpool: null,
  };
}

describe("formatActivityLocationShort", () => {
  it("retourne le nom de la salle pour ON_SITE avec salle", () => {
    const a = makeActivity("ON_SITE", { room: "Salle A" });
    expect(formatActivityLocationShort(a)).toBe("Salle A");
  });

  it("retourne 'Sur site' pour ON_SITE sans salle", () => {
    const a = makeActivity("ON_SITE", {});
    expect(formatActivityLocationShort(a)).toBe("Sur site");
  });

  it("retourne 'ville, rue' pour OFF_SITE avec les deux champs", () => {
    const a = makeActivity("OFF_SITE", { city: "Paris", street: "Rue de la Paix" });
    expect(formatActivityLocationShort(a)).toBe("Paris, Rue de la Paix");
  });

  it("retourne seulement la ville pour OFF_SITE sans rue", () => {
    const a = makeActivity("OFF_SITE", { city: "Lyon" });
    expect(formatActivityLocationShort(a)).toBe("Lyon");
  });

  it("retourne seulement la rue pour OFF_SITE sans ville", () => {
    const a = makeActivity("OFF_SITE", { street: "Rue Victor Hugo" });
    expect(formatActivityLocationShort(a)).toBe("Rue Victor Hugo");
  });

  it("retourne '—' pour OFF_SITE sans données de localisation", () => {
    const a = makeActivity("OFF_SITE", {});
    expect(formatActivityLocationShort(a)).toBe("—");
  });
});

describe("formatActivityLocationMeta", () => {
  it("retourne null pour ON_SITE", () => {
    const a = makeActivity("ON_SITE", { room: "Salle B" });
    expect(formatActivityLocationMeta(a)).toBeNull();
  });

  it("retourne le code postal pour OFF_SITE", () => {
    const a = makeActivity("OFF_SITE", { city: "Paris", postalCode: "75001" });
    expect(formatActivityLocationMeta(a)).toBe("75001");
  });

  it("retourne null pour OFF_SITE sans code postal", () => {
    const a = makeActivity("OFF_SITE", { city: "Lyon" });
    expect(formatActivityLocationMeta(a)).toBeNull();
  });
});
