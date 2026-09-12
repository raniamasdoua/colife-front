import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

vi.mock("../../../auth/oidcConfig", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
  requireLogout: vi.fn(),
  setAccessToken: vi.fn(),
  setLoginTrigger: vi.fn(),
  setLogoutTrigger: vi.fn(),
  requireLogin: vi.fn(),
}));

import { AdminUsersPage } from "../../../pages/admin/AdminUsersPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminUsersPage />
    </MemoryRouter>
  );
}

describe("AdminUsersPage", () => {
  it("s'affiche sans erreur", () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it("affiche Alice Martin après chargement", async () => {
    renderPage();
    const items = await screen.findAllByText("Alice Martin");
    expect(items.length).toBeGreaterThan(0);
  });

  it("affiche les statistiques Total membres, Administrateurs, Collaborateurs", async () => {
    renderPage();
    await screen.findAllByText("Alice Martin");
    expect(screen.getByText("Total membres")).toBeInTheDocument();
    expect(screen.getByText("Administrateurs")).toBeInTheDocument();
    expect(screen.getByText("Collaborateurs")).toBeInTheDocument();
  });

  it("filtre les utilisateurs par recherche de nom", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Alice Martin");
    await user.type(
      screen.getByPlaceholderText("Rechercher par nom ou email…"),
      "Alice"
    );
    expect(screen.getAllByText(/alice martin/i).length).toBeGreaterThan(0);
  });

  it("affiche l'état vide si la recherche ne correspond à personne", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Alice Martin");
    await user.type(
      screen.getByPlaceholderText("Rechercher par nom ou email…"),
      "zzz_inexistant"
    );
    await waitFor(() => {
      expect(
        screen.getByText("Aucun utilisateur ne correspond à votre recherche")
      ).toBeInTheDocument();
    });
  });

  it("ouvre le filtre rôle et sélectionne Collaborateurs", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /tous les rôles/i }));
    await user.click(await screen.findByRole("button", { name: /^collaborateurs$/i }));
    expect(screen.getAllByText(/alice martin/i).length).toBeGreaterThan(0);
  });

  it("ouvre la fiche détail au clic sur un utilisateur", async () => {
    const user = userEvent.setup();
    renderPage();
    const names = await screen.findAllByText("Alice Martin");
    await user.click(names[0]);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
