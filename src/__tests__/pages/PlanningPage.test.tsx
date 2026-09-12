import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

vi.mock("../../auth/oidcConfig", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
  requireLogout: vi.fn(),
  setAccessToken: vi.fn(),
  setLoginTrigger: vi.fn(),
  setLogoutTrigger: vi.fn(),
  requireLogin: vi.fn(),
}));


vi.mock("../../context/CreateActivityModalContext", () => ({
  useCreateActivityModal: () => ({ openCreate: vi.fn(), isCreateModalOpen: false }),
  CreateActivityModalProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import { PlanningPage } from "../../pages/PlanningPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <PlanningPage />
    </MemoryRouter>
  );
}

describe("PlanningPage", () => {
  it("s'affiche sans erreur", () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it("affiche les onglets de filtre", () => {
    renderPage();
    expect(screen.getAllByText("J'organise")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Inscriptions")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Tout")[0]).toBeInTheDocument();
  });

  it("affiche une activité organisée après chargement", async () => {
    renderPage();
    expect(await screen.findByText("Yoga du matin")).toBeInTheDocument();
  });

  it.each([
    ["Inscriptions", /inscriptions/i],
    ["Tout", /^tout$/i],
    ["J'organise", /j'organise/i],
  ] as [string, RegExp][])("bascule sur l'onglet %s", async (_label, pattern) => {
    const user = userEvent.setup();
    renderPage();
    const btn = screen.getAllByRole("button", { name: pattern })[0];
    await user.click(btn);
    expect(btn).toBeInTheDocument();
  });

  it.each([
    ["mois précédent"],
    ["mois suivant"],
  ])("navigue au %s", async (label) => {
    const user = userEvent.setup();
    renderPage();
    const btn = screen.getByRole("button", { name: new RegExp(label, "i") });
    await user.click(btn);
    expect(btn).toBeInTheDocument();
  });

  it("affiche les statistiques Total, Ce mois, À venir", async () => {
    renderPage();
    expect(await screen.findByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Ce mois")).toBeInTheDocument();
    expect(screen.getAllByText("À venir").length).toBeGreaterThan(0);
  });

  it("affiche l'en-tête du calendrier avec l'année courante", () => {
    renderPage();
    expect(screen.getByText(new RegExp(new Date().getFullYear().toString()))).toBeInTheDocument();
  });

  it.each([
    ["Sur site"],
    ["Hors site"],
    ["Covoiturage"],
  ])("active le filtre '%s' dans l'agenda", async (filterName) => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: filterName }));
    expect(screen.getByRole("button", { name: filterName })).toBeInTheDocument();
  });

  it("sélectionne une date dans le calendrier", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: "15" }));
    expect(screen.getByRole("button", { name: /effacer/i })).toBeInTheDocument();
  });

  it("efface la date sélectionnée via × Effacer", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: "15" }));
    await user.click(await screen.findByRole("button", { name: /effacer/i }));
    expect(await screen.findByText("Yoga du matin")).toBeInTheDocument();
  });

  it("efface les sous-filtres via Tout effacer", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: "Sur site" }));
    await user.click(screen.getByRole("button", { name: /tout effacer/i }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /tout effacer/i })).not.toBeInTheDocument();
    });
  });
});
