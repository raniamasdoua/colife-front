import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { HomeWelcomeSection } from "../../components/home/HomeWelcomeSection";

function renderSection(overrides?: Partial<Parameters<typeof HomeWelcomeSection>[0]>) {
  const props = {
    firstName: "Alice",
    organizedCount: 3,
    registeredCount: 5,
    availableCount: 12,
    ...overrides,
  };
  return render(<HomeWelcomeSection {...props} />);
}

describe("HomeWelcomeSection", () => {
  it("s'affiche sans erreur", () => {
    const { container } = renderSection();
    expect(container.firstChild).not.toBeNull();
  });

  it("affiche le prénom dans le message d'accueil", () => {
    renderSection({ firstName: "Alice" });
    expect(screen.getByText(/hey alice/i)).toBeInTheDocument();
  });

  it("affiche le nombre d'activités organisées", () => {
    renderSection({ organizedCount: 7 });
    expect(screen.getByText("7")).toBeInTheDocument();
  });

  it("affiche le nombre d'inscriptions", () => {
    renderSection({ registeredCount: 4 });
    expect(screen.getByText("4")).toBeInTheDocument();
  });

  it("affiche le nombre d'activités disponibles", () => {
    renderSection({ availableCount: 9 });
    expect(screen.getByText("9")).toBeInTheDocument();
  });

  it("affiche les libellés des compteurs", () => {
    renderSection();
    expect(screen.getByText("J'organise")).toBeInTheDocument();
    expect(screen.getByText("Inscrit")).toBeInTheDocument();
    expect(screen.getByText("Disponibles")).toBeInTheDocument();
  });

  it("affiche zéro quand les compteurs sont à 0", () => {
    renderSection({ organizedCount: 0, registeredCount: 0, availableCount: 0 });
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(3);
  });

  it("affiche le slogan d'encouragement", () => {
    renderSection();
    expect(screen.getByText(/prêt pour de nouvelles aventures/i)).toBeInTheDocument();
  });
});
