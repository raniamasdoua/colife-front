import { describe, it, expect } from "vitest";
import { validatePassword } from "../../utils/passwordValidation";

describe("validatePassword", () => {
  describe("niveau de force", () => {
    it("retourne level 0 pour une chaîne vide", () => {
      const r = validatePassword("");
      expect(r.strength.level).toBe(0);
      expect(r.strength.label).toBe("");
    });

    it("retourne level 1 (très faible) pour 1 critère respecté", () => {
      const r = validatePassword("abc");
      expect(r.strength.level).toBe(1);
      expect(r.strength.label).toBe("Très faible");
    });

    it("retourne level 2 (faible) pour 3 critères respectés", () => {
      // longueur ✓ + majuscule ✓ + minuscule ✓  (pas de chiffre, pas de spécial)
      const r = validatePassword("Abcdefghijkl");
      expect(r.strength.level).toBe(2);
      expect(r.strength.label).toBe("Faible");
    });

    it("retourne level 3 (moyen) pour 4 critères respectés", () => {
      // longueur ✓ + majuscule ✓ + minuscule ✓ + chiffre ✓ (pas de spécial)
      const r = validatePassword("Abcdefgh1234");
      expect(r.strength.level).toBe(3);
      expect(r.strength.label).toBe("Moyen");
    });

    it("retourne level 4 (fort) pour tous les critères respectés", () => {
      const r = validatePassword("Abcdefgh1234!");
      expect(r.strength.level).toBe(4);
      expect(r.strength.label).toBe("Fort");
    });
  });

  describe("isValid", () => {
    it("est valide avec tous les critères remplis", () => {
      const r = validatePassword("Abcdefgh1234!");
      expect(r.isValid).toBe(true);
      expect(r.errors).toHaveLength(0);
    });

    it("n'est pas valide si un seul critère manque", () => {
      const r = validatePassword("Abcdefgh1234");
      expect(r.isValid).toBe(false);
    });
  });

  describe("critères individuels", () => {
    it("détecte le non-respect de la longueur minimale", () => {
      const r = validatePassword("Ab1!");
      expect(r.criteria.minLength).toBe(false);
      expect(r.errors).toContain("Le mot de passe doit contenir au moins 12 caractères");
    });

    it("détecte l'absence de majuscule", () => {
      const r = validatePassword("abcdefgh1234!");
      expect(r.criteria.hasUpperCase).toBe(false);
      expect(r.errors).toContain("Le mot de passe doit contenir au moins une majuscule (A-Z)");
    });

    it("détecte l'absence de minuscule", () => {
      const r = validatePassword("ABCDEFGH1234!");
      expect(r.criteria.hasLowerCase).toBe(false);
      expect(r.errors).toContain("Le mot de passe doit contenir au moins une minuscule (a-z)");
    });

    it("détecte l'absence de chiffre", () => {
      const r = validatePassword("Abcdefghijkl!");
      expect(r.criteria.hasNumber).toBe(false);
      expect(r.errors).toContain("Le mot de passe doit contenir au moins un chiffre (0-9)");
    });

    it("détecte l'absence de caractère spécial", () => {
      const r = validatePassword("Abcdefgh1234");
      expect(r.criteria.hasSpecialChar).toBe(false);
      expect(r.errors).toContain(
        "Le mot de passe doit contenir au moins un caractère spécial (@#$%^&+=!?.)"
      );
    });

    it("accepte les caractères spéciaux valides (@, #, $, !, ?)", () => {
      for (const char of ["@", "#", "$", "!", "?"]) {
        const r = validatePassword(`Abcdefgh1234${char}`);
        expect(r.criteria.hasSpecialChar).toBe(true);
      }
    });

    it("retourne les critères en objet avec tous les booléens", () => {
      const r = validatePassword("Abcdefgh1234!");
      expect(r.criteria).toEqual({
        minLength: true,
        hasUpperCase: true,
        hasLowerCase: true,
        hasNumber: true,
        hasSpecialChar: true,
      });
    });
  });
});
