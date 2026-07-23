import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";

vi.mock("react-oidc-context", () => ({
  useAuth: vi.fn().mockReturnValue({
    isAuthenticated: true,
    isLoading: false,
    signoutRedirect: vi.fn(),
    signinRedirect: vi.fn(),
  }),
}));

vi.mock("../../auth/oidcConfig", () => ({
  getAccessToken: vi.fn().mockReturnValue("test-token"),
  requireLogout: vi.fn(),
  setAccessToken: vi.fn(),
  setLoginTrigger: vi.fn(),
  setLogoutTrigger: vi.fn(),
  requireLogin: vi.fn(),
  keycloakAccountUrl: vi.fn().mockReturnValue("http://localhost:8081/account"),
}));

vi.mock("../../components/layout/CollaboratorLayout", () => ({
  CollaboratorLayout: ({ children }: { children: ReactNode }) => (
    <div data-testid="layout">{children}</div>
  ),
}));

import { ProfilePage } from "../../pages/ProfilePage";

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  );
}

describe("ProfilePage", () => {
  it("s'affiche sans erreur", () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it("affiche le nom complet de l'utilisateur après chargement", async () => {
    renderPage();
    expect(await screen.findByText("Alice Martin")).toBeInTheDocument();
  });

  it("affiche l'email de l'utilisateur", async () => {
    renderPage();
    const items = await screen.findAllByText("alice.martin@test.fr");
    expect(items.length).toBeGreaterThan(0);
  });

  it("affiche les sections Informations personnelles et Sécurité", async () => {
    renderPage();
    await screen.findByText("Alice Martin");
    expect(screen.getByText("Informations personnelles")).toBeInTheDocument();
    expect(screen.getByText("Sécurité")).toBeInTheDocument();
  });

  it("affiche les statistiques (Activités organisées, Participations)", async () => {
    renderPage();
    expect(await screen.findByText("Activités organisées")).toBeInTheDocument();
    expect(screen.getByText("Participations")).toBeInTheDocument();
  });

  it("passe en mode édition au clic sur Modifier", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /modifier/i }));
    expect(screen.getByRole("button", { name: /enregistrer/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /annuler/i })).toBeInTheDocument();
  });

  it("quitte le mode édition au clic sur Annuler", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /modifier/i }));
    await user.click(screen.getByRole("button", { name: /annuler/i }));
    expect(screen.getByRole("button", { name: /modifier/i })).toBeInTheDocument();
  });

  it("sauvegarde le profil au clic sur Enregistrer", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /modifier/i }));
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /enregistrer/i })).not.toBeInTheDocument();
    });
  });

  it("ouvre la boîte de dialogue de déconnexion", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /se déconnecter/i }));
    expect(screen.getByText(/confirmer la déconnexion/i)).toBeInTheDocument();
  });

  it("ferme la boîte de dialogue de déconnexion via Annuler", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /se déconnecter/i }));
    await screen.findByText(/confirmer la déconnexion/i);
    const cancelBtns = screen.getAllByRole("button", { name: /annuler/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText(/confirmer la déconnexion/i)).not.toBeInTheDocument();
    });
  });

  it("confirme la déconnexion via Se déconnecter dans la boîte de dialogue", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /se déconnecter/i }));
    await screen.findByText(/confirmer la déconnexion/i);
    const confirmBtns = screen.getAllByRole("button", { name: /se déconnecter/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText(/confirmer la déconnexion/i)).not.toBeInTheDocument();
    });
  });

  it("ouvre la boîte de dialogue de suppression de compte", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /supprimer mon compte/i }));
    expect(screen.getAllByText(/supprimer définitivement/i).length).toBeGreaterThan(0);
  });

  it("ferme le dialogue de suppression via Annuler", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /supprimer mon compte/i }));
    await screen.findByText(/supprimer définitivement votre compte/i);
    const cancelBtns = screen.getAllByRole("button", { name: /annuler/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText(/supprimer définitivement votre compte/i)).not.toBeInTheDocument();
    });
  });

  it("supprime le compte après saisie de SUPPRIMER", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /supprimer mon compte/i }));
    await screen.findByText(/supprimer définitivement votre compte/i);
    await user.type(screen.getByPlaceholderText("SUPPRIMER"), "SUPPRIMER");
    const deleteConfirmBtns = screen.getAllByRole("button", { name: /supprimer définitivement/i });
    await user.click(deleteConfirmBtns[deleteConfirmBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText(/supprimer définitivement votre compte/i)).not.toBeInTheDocument();
    });
  });

  it("ouvre l'URL Keycloak au clic sur Changer le mot de passe", async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    renderPage();
    await screen.findByText("Alice Martin");
    await user.click(screen.getByRole("button", { name: /changer le mot de passe/i }));
    expect(openSpy).toHaveBeenCalledWith(
      "http://localhost:8081/account",
      "_blank",
      "noopener,noreferrer"
    );
    openSpy.mockRestore();
  });
});
