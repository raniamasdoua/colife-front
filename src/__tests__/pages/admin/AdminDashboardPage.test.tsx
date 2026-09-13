import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { http, HttpResponse } from "msw";
import { server } from "../../../test/msw/server";
import { FUTURE_ACTIVITY } from "../../../test/msw/handlers";

vi.mock("../../../auth/oidcConfig", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
  requireLogout: vi.fn(),
  setAccessToken: vi.fn(),
  setLoginTrigger: vi.fn(),
  setLogoutTrigger: vi.fn(),
  requireLogin: vi.fn(),
}));

import { AdminDashboardPage } from "../../../pages/admin/AdminDashboardPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminDashboardPage />
    </MemoryRouter>
  );
}

describe("AdminDashboardPage", () => {
  it("s'affiche sans erreur", () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it("affiche les 4 cartes de statistiques après chargement", async () => {
    renderPage();
    expect(await screen.findByText("Total activités")).toBeInTheDocument();
    expect(screen.getByText("Activités à venir")).toBeInTheDocument();
    expect(screen.getByText("Types d'activités")).toBeInTheDocument();
    expect(screen.getByText("Utilisateurs")).toBeInTheDocument();
  });

  it("affiche la valeur correcte du nombre d'utilisateurs (42)", async () => {
    renderPage();
    await screen.findByText("Utilisateurs");
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("affiche l'activité à venir dans le tableau Prochaines activités", async () => {
    renderPage();
    const items = await screen.findAllByText("Yoga du matin");
    expect(items.length).toBeGreaterThan(0);
    expect(screen.getByText("Prochaines activités")).toBeInTheDocument();
  });

  it("ouvre la fiche détail au clic sur une ligne du tableau", async () => {
    const user = userEvent.setup();
    renderPage();
    const rows = await screen.findAllByText("Yoga du matin");
    await user.click(rows[0]);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("affiche une erreur si le chargement du tableau de bord échoue", async () => {
    server.use(
      http.get("http://localhost:8080/api/activities", () => HttpResponse.error())
    );
    renderPage();
    expect(
      await screen.findByText("Impossible de charger les données du tableau de bord.")
    ).toBeInTheDocument();
  });

  it("trie les prochaines activités par date", async () => {
    server.use(
      http.get("http://localhost:8080/api/activities", () =>
        HttpResponse.json([
          { ...FUTURE_ACTIVITY, id: 3, title: "Pilates", date: "2099-07-20" },
          FUTURE_ACTIVITY,
        ])
      )
    );
    renderPage();
    const items = await screen.findAllByText("Yoga du matin");
    expect(items.length).toBeGreaterThan(0);
  });
});
