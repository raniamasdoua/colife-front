import { describe, it, expect } from "vitest";
import { getTypeConfig } from "../../utils/activityDisplay";

describe("getTypeConfig", () => {
  it("retourne la config correcte pour 'Piscine'", () => {
    const cfg = getTypeConfig("Piscine");
    expect(cfg.badge).toBe("bg-blue-100 text-blue-800");
    expect(cfg.gradient).toBe("from-blue-400 to-cyan-500");
    expect(cfg.icon).toBeDefined();
  });

  it("retourne la config correcte pour 'Yoga'", () => {
    const cfg = getTypeConfig("Yoga");
    expect(cfg.badge).toBe("bg-violet-100 text-violet-800");
  });

  it("retourne la config par défaut pour un type inconnu", () => {
    const cfg = getTypeConfig("ActivitéInconnue");
    expect(cfg.badge).toBe("bg-slate-100 text-slate-700");
    expect(cfg.gradient).toBe("from-blue-500 to-purple-600");
    expect(cfg.icon).toBeDefined();
  });

  it("retourne la config par défaut pour une chaîne vide", () => {
    const cfg = getTypeConfig("");
    expect(cfg.badge).toBe("bg-slate-100 text-slate-700");
  });

  it("est sensible à la casse ('piscine' ≠ 'Piscine')", () => {
    const cfg = getTypeConfig("piscine");
    expect(cfg.badge).toBe("bg-slate-100 text-slate-700");
  });

  it("retourne la config correcte pour 'Football'", () => {
    const cfg = getTypeConfig("Football");
    expect(cfg.badge).toBe("bg-emerald-100 text-emerald-800");
  });

  it("retourne la config correcte pour 'Course à pied'", () => {
    const cfg = getTypeConfig("Course à pied");
    expect(cfg.badge).toBe("bg-red-100 text-red-800");
  });
});
