import { describe, it, expect } from "vitest";
import {
  shouldOfferCarpoolAfterSubscribe,
  SUBSCRIBE_SUCCESS_MESSAGE,
} from "../../utils/subscribeMessages";

describe("shouldOfferCarpoolAfterSubscribe", () => {
  it("retourne true pour une activité hors site (OFF_SITE)", () => {
    expect(shouldOfferCarpoolAfterSubscribe({ locationType: "OFF_SITE" })).toBe(true);
  });

  it("retourne false pour une activité sur site (ON_SITE)", () => {
    expect(shouldOfferCarpoolAfterSubscribe({ locationType: "ON_SITE" })).toBe(false);
  });
});

describe("SUBSCRIBE_SUCCESS_MESSAGE", () => {
  it("est une chaîne non vide", () => {
    expect(typeof SUBSCRIBE_SUCCESS_MESSAGE).toBe("string");
    expect(SUBSCRIBE_SUCCESS_MESSAGE.length).toBeGreaterThan(0);
  });

  it("mentionne le planning ou l'inscription", () => {
    expect(SUBSCRIBE_SUCCESS_MESSAGE.toLowerCase()).toMatch(/planning|inscription/);
  });
});
