import { describe, it, expect } from "vitest";
import { getInitials } from "../../utils/userDisplay";

describe("getInitials", () => {
  it("retourne les deux initiales en majuscules", () => {
    expect(getInitials("Alice", "Martin")).toBe("AM");
  });

  it("met déjà en majuscules des lettres minuscules", () => {
    expect(getInitials("jean", "dupont")).toBe("JD");
  });

  it("retourne '?' quand les deux paramètres sont vides", () => {
    expect(getInitials("", "")).toBe("?");
  });

  it("retourne la seule initiale disponible si le prénom est vide", () => {
    expect(getInitials("", "Martin")).toBe("M");
  });

  it("retourne la seule initiale disponible si le nom est vide", () => {
    expect(getInitials("Alice", "")).toBe("A");
  });

  it("ignore les espaces en début de chaîne (trim)", () => {
    expect(getInitials("  Alice", "  Martin")).toBe("AM");
  });

  it("fonctionne avec des prénoms/noms accentués", () => {
    expect(getInitials("Élodie", "Ünlü")).toBe("ÉÜ");
  });
});
