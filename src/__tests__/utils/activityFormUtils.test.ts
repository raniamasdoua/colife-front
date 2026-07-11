import { describe, expect, it } from "vitest";
import {
  FORM_LABEL_CLASS,
  MAX_CITY,
  MAX_COMPLEMENT,
  MAX_DESCRIPTION,
  MAX_ROOM,
  MAX_STREET,
  MAX_TITLE,
  toBackendTime,
  todayIso,
} from "../../components/activity/activityFormUtils";

describe("constantes", () => {
  it("FORM_LABEL_CLASS contient les classes attendues", () => {
    expect(FORM_LABEL_CLASS).toContain("text-xs");
    expect(FORM_LABEL_CLASS).toContain("font-semibold");
  });

  it("MAX_TITLE vaut 200", () => expect(MAX_TITLE).toBe(200));
  it("MAX_DESCRIPTION vaut 5000", () => expect(MAX_DESCRIPTION).toBe(5000));
  it("MAX_STREET vaut 255", () => expect(MAX_STREET).toBe(255));
  it("MAX_COMPLEMENT vaut 255", () => expect(MAX_COMPLEMENT).toBe(255));
  it("MAX_CITY vaut 120", () => expect(MAX_CITY).toBe(120));
  it("MAX_ROOM vaut 255", () => expect(MAX_ROOM).toBe(255));
});

describe("todayIso", () => {
  it("retourne une date au format YYYY-MM-DD", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("correspond à la date du jour", () => {
    const d = new Date();
    const expected = [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, "0"),
      String(d.getDate()).padStart(2, "0"),
    ].join("-");
    expect(todayIso()).toBe(expected);
  });
});

describe("toBackendTime", () => {
  it("complète les secondes manquantes", () => {
    expect(toBackendTime("9:5")).toBe("09:05:00");
  });

  it("conserve les secondes si présentes", () => {
    expect(toBackendTime("14:30:45")).toBe("14:30:45");
  });

  it("retourne la valeur vide inchangée", () => {
    expect(toBackendTime("")).toBe("");
  });

  it("padde les heures et minutes sur 2 chiffres", () => {
    expect(toBackendTime("8:0")).toBe("08:00:00");
  });
});
