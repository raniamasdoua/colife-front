import { describe, expect, it } from "vitest";
import {
  formatDateLong,
  formatDateShort,
  formatTime,
  toActivityInitials,
} from "../../utils/activityFormatters";

describe("formatTime", () => {
  it("retourne les 5 premiers caractères HH:MM", () => {
    expect(formatTime("09:30:00")).toBe("09:30");
  });

  it("fonctionne quand le temps est déjà HH:MM", () => {
    expect(formatTime("14:00")).toBe("14:00");
  });
});

describe("formatDateLong", () => {
  it("formate une date ISO en français (long)", () => {
    const result = formatDateLong("2025-12-25");
    expect(result).toContain("25");
    expect(result).toContain("2025");
  });

  it("inclut le nom du jour", () => {
    const result = formatDateLong("2025-01-06");
    expect(result.toLowerCase()).toContain("lundi");
  });
});

describe("formatDateShort", () => {
  it("formate une date ISO en français (court)", () => {
    const result = formatDateShort("2025-06-15");
    expect(result).toContain("15");
    expect(result).toContain("2025");
  });

  it("inclut le mois abrégé", () => {
    const result = formatDateShort("2025-03-10");
    expect(result.toLowerCase()).toMatch(/mars|mar/);
  });
});

describe("toActivityInitials", () => {
  it("retourne les initiales de deux mots", () => {
    expect(toActivityInitials("Jean Dupont")).toBe("JD");
  });

  it("prend au plus 2 caractères", () => {
    expect(toActivityInitials("Marie Anne Claire")).toBe("MA");
  });

  it("gère un seul prénom", () => {
    expect(toActivityInitials("Alice")).toBe("A");
  });

  it("ignore les espaces multiples", () => {
    expect(toActivityInitials("  Bob  Martin  ")).toBe("BM");
  });
});
