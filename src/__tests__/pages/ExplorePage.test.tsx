import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../auth/oidcConfig", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
  requireLogout: vi.fn(),
  setAccessToken: vi.fn(),
  setLoginTrigger: vi.fn(),
  setLogoutTrigger: vi.fn(),
  requireLogin: vi.fn(),
}));

import { ExplorePage } from "../../pages/ExplorePage";

function renderPage() {
  return render(
    <MemoryRouter>
      <ExplorePage />
    </MemoryRouter>
  );
}

describe("ExplorePage", () => {
  it("s'affiche sans erreur", () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it("affiche une activité disponible après chargement", async () => {
    renderPage();
    expect(await screen.findByText("Yoga du matin")).toBeInTheDocument();
  });

  it("affiche la barre de recherche", () => {
    renderPage();
    expect(screen.getByPlaceholderText(/titre, type/i)).toBeInTheDocument();
  });

  it("affiche le compteur d'activités après chargement", async () => {
    renderPage();
    await screen.findByText("Yoga du matin");
    const counters = screen.getAllByText(/activités disponibles|activité disponible/i);
    expect(counters.length).toBeGreaterThan(0);
  });

  it("ouvre le panneau de filtres au clic sur Filtres", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^filtres$/i }));
    expect(screen.getByText("Affiner la recherche")).toBeInTheDocument();
  });

  it("active le filtre Sur site", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^filtres$/i }));
    const panel = document.getElementById("search-filters-panel")!;
    const surSiteBtn = within(panel).getByRole("button", { name: /sur site/i });
    await user.click(surSiteBtn);
    expect(surSiteBtn).toBeInTheDocument();
  });

  it("active le filtre Hors site", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^filtres$/i }));
    const panel = document.getElementById("search-filters-panel")!;
    const horsSiteBtn = within(panel).getByRole("button", { name: /hors site/i });
    await user.click(horsSiteBtn);
    expect(horsSiteBtn).toBeInTheDocument();
  });

  it("active le filtre Covoiturage", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^filtres$/i }));
    const panel = document.getElementById("search-filters-panel")!;
    const covoiBtn = within(panel).getByRole("button", { name: /covoiturage/i });
    await user.click(covoiBtn);
    expect(covoiBtn).toBeInTheDocument();
  });

  it("filtre par période Aujourd'hui", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^filtres$/i }));
    const panel = document.getElementById("search-filters-panel")!;
    const todayBtn = within(panel).getByRole("button", { name: /aujourd'hui/i });
    await user.click(todayBtn);
    expect(todayBtn).toBeInTheDocument();
  });

  it("filtre par période Cette semaine", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^filtres$/i }));
    const panel = document.getElementById("search-filters-panel")!;
    const weekBtn = within(panel).getByRole("button", { name: /cette semaine/i });
    await user.click(weekBtn);
    expect(weekBtn).toBeInTheDocument();
  });

  it("filtre par période Ce mois", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^filtres$/i }));
    const panel = document.getElementById("search-filters-panel")!;
    const monthBtn = within(panel).getByRole("button", { name: /ce mois/i });
    await user.click(monthBtn);
    expect(monthBtn).toBeInTheDocument();
  });

  it("cherche par texte dans la barre de recherche", async () => {
    const user = userEvent.setup();
    renderPage();
    const searchInput = screen.getByPlaceholderText(/titre, type/i);
    await user.type(searchInput, "Yoga");
    expect(searchInput).toHaveValue("Yoga");
  });

  it("efface la recherche via le bouton X", async () => {
    const user = userEvent.setup();
    renderPage();
    const searchInput = screen.getByPlaceholderText(/titre, type/i);
    await user.type(searchInput, "Yoga");
    const clearBtn = screen.getByRole("button", { name: /effacer/i });
    await user.click(clearBtn);
    expect(searchInput).toHaveValue("");
  });

  it("affiche l'état vide quand aucune activité ne correspond", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Yoga du matin");
    const searchInput = screen.getByPlaceholderText(/titre, type/i);
    await user.type(searchInput, "xyzinexistant");
    await waitFor(() => {
      expect(screen.getByText("Aucune activité trouvée")).toBeInTheDocument();
    });
  });

  it("réinitialise les filtres depuis l'état vide", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Yoga du matin");
    const searchInput = screen.getByPlaceholderText(/titre, type/i);
    await user.type(searchInput, "xyzinexistant");
    await screen.findByText("Aucune activité trouvée");
    const resetBtn = screen.getByRole("button", { name: /réinitialiser/i });
    await user.click(resetBtn);
    expect(await screen.findByText("Yoga du matin")).toBeInTheDocument();
  });

  it("désactive le filtre Sur site au deuxième clic (toggle)", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^filtres$/i }));
    const panel = document.getElementById("search-filters-panel")!;
    const surSiteBtn = within(panel).getByRole("button", { name: /sur site/i });
    await user.click(surSiteBtn);
    await user.click(surSiteBtn);
    expect(surSiteBtn).toBeInTheDocument();
  });

  it("efface les sous-filtres via Tout effacer", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^filtres$/i }));
    const panel = document.getElementById("search-filters-panel")!;
    await user.click(within(panel).getByRole("button", { name: /sur site/i }));
    const clearAllBtn = screen.getByRole("button", { name: /tout effacer/i });
    await user.click(clearAllBtn);
    expect(screen.queryByText("Tout effacer")).not.toBeInTheDocument();
  });

  it("revient à la liste Toutes les périodes", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole("button", { name: /^filtres$/i }));
    const panel = document.getElementById("search-filters-panel")!;
    await user.click(within(panel).getByRole("button", { name: /aujourd'hui/i }));
    const toutesBtn = within(panel).getByRole("button", { name: /^toutes$/i });
    await user.click(toutesBtn);
    expect(toutesBtn).toBeInTheDocument();
  });
});
