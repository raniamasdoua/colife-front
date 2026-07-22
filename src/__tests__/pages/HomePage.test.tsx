import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { MemoryRouter } from "react-router-dom";
import type { ReactNode } from "react";
import { server } from "../../test/msw/server";

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

vi.mock("../../components/home/ActivityDetailModal", () => ({
  ActivityDetailModal: ({
    activity,
    open,
    onEdit,
    onDeleted,
    onUnsubscribed,
  }: {
    activity: { id: number } | null;
    open: boolean;
    onEdit: (a: unknown) => void;
    onDeleted: (id: number) => void;
    onUnsubscribed: (a: unknown) => void;
  }) =>
    open && activity ? (
      <div role="dialog">
        <button onClick={() => onEdit(activity)}>Modifier</button>
        <button onClick={() => onDeleted(activity.id)}>Supprimer l&apos;activité</button>
        <button onClick={() => onUnsubscribed(activity)}>Se désinscrire</button>
      </div>
    ) : null,
}));

vi.mock("../../components/EditActivityModal", () => ({
  EditActivityModal: ({
    activity,
    open,
    onSuccess,
  }: {
    activity: unknown;
    open: boolean;
    onSuccess: (a: unknown) => void;
  }) =>
    open && activity ? (
      <div role="dialog" data-testid="edit-modal">
        <button onClick={() => onSuccess({ ...(activity as object), title: "Yoga modifié" })}>
          Enregistrer
        </button>
      </div>
    ) : null,
}));

import { HomePage } from "../../pages/HomePage";

function renderPage() {
  return render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>
  );
}

describe("HomePage", () => {
  it("s'affiche sans erreur", () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it("affiche une activité disponible après chargement", async () => {
    renderPage();
    const items = await screen.findAllByText("Yoga du matin");
    expect(items.length).toBeGreaterThan(0);
  });

  it("affiche le prénom de l'utilisateur connecté", async () => {
    renderPage();
    const items = await screen.findAllByText(/alice/i);
    expect(items.length).toBeGreaterThan(0);
  });

  it("affiche la section Mes événements", async () => {
    renderPage();
    expect(await screen.findByText("Mes événements")).toBeInTheDocument();
  });

  it("affiche la section Disponibles", async () => {
    renderPage();
    const items = await screen.findAllByText("Disponibles");
    expect(items.length).toBeGreaterThan(0);
  });

  it("affiche le bouton S'inscrire sur les activités disponibles", async () => {
    renderPage();
    const btns = await screen.findAllByRole("button", { name: "S'inscrire" });
    expect(btns.length).toBeGreaterThan(0);
  });

  it("affiche la modale de succès après inscription", async () => {
    const user = userEvent.setup();
    renderPage();
    const btns = await screen.findAllByRole("button", { name: "S'inscrire" });
    await user.click(btns[0]);
    expect(await screen.findByText("Inscription réussie")).toBeInTheDocument();
  });

  it("affiche la section À venir avec des activités inscrites", async () => {
    renderPage();
    await screen.findAllByText("Yoga du matin");
    const avenir = screen.getAllByText(/à venir/i);
    expect(avenir.length).toBeGreaterThan(0);
  });

  it("affiche les compteurs dans la section d'accueil", async () => {
    renderPage();
    await screen.findAllByText(/alice/i);
    expect(screen.getByText("J'organise")).toBeInTheDocument();
    const inscritItems = screen.getAllByText("Inscrit");
    expect(inscritItems.length).toBeGreaterThan(0);
  });

  it("ouvre la fiche détail de l'activité organisée", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: /organisateur/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("affiche une erreur si l'inscription échoue", async () => {
    server.use(
      http.post("http://localhost:8080/api/activities/:id/subscribe", () =>
        HttpResponse.json({ message: "Capacité atteinte" }, { status: 400 })
      )
    );
    const user = userEvent.setup();
    renderPage();
    const btns = await screen.findAllByRole("button", { name: "S'inscrire" });
    await user.click(btns[0]);
    expect(await screen.findByText("Inscription impossible")).toBeInTheDocument();
  });

  it("traite la suppression d'une activité depuis la fiche détail", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: /organisateur/i }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /supprimer l'activité/i }));
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("traite la désinscription depuis la fiche détail", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: /organisateur/i }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /se désinscrire/i }));
    expect(await screen.findByText("Désinscription réussie")).toBeInTheDocument();
  });

  it("ouvre le formulaire de modification depuis la fiche détail", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: /organisateur/i }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /^modifier$/i }));
    expect(await screen.findByTestId("edit-modal")).toBeInTheDocument();
  });

  it("met à jour l'activité organisée après modification", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: /organisateur/i }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /^modifier$/i }));
    await screen.findByTestId("edit-modal");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    await waitFor(() => {
      expect(screen.queryAllByText("Yoga modifié").length).toBeGreaterThan(0);
    });
  });
});
