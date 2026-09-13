import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

vi.mock("../../../components/EditActivityModal", () => ({
  EditActivityModal: ({ activity, open, onSuccess }: { activity: unknown; open: boolean; onSuccess: (a: unknown) => void }) =>
    open && activity ? (
      <div role="dialog" data-testid="edit-modal">
        <button onClick={() => onSuccess({ ...(activity as object), title: "Yoga modifié" })}>
          Enregistrer
        </button>
      </div>
    ) : null,
}));

import { AdminActivitiesPage } from "../../../pages/admin/AdminActivitiesPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminActivitiesPage />
    </MemoryRouter>
  );
}

describe("AdminActivitiesPage", () => {
  it("s'affiche sans erreur", () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it("affiche l'activité après chargement", async () => {
    renderPage();
    const items = await screen.findAllByText("Yoga du matin");
    expect(items.length).toBeGreaterThan(0);
  });

  it("affiche les mini-stats Total actives, À venir, Passées, Supprimées", async () => {
    renderPage();
    await screen.findAllByText("Yoga du matin");
    expect(screen.getByText("Total actives")).toBeInTheDocument();
    expect(screen.getAllByText("À venir").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Passées").length).toBeGreaterThan(0);
    expect(screen.getByText("Supprimées")).toBeInTheDocument();
  });

  it("filtre les activités par recherche de titre", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.type(
      screen.getByPlaceholderText("Rechercher par titre ou organisateur…"),
      "Yoga"
    );
    expect(screen.getAllByText(/yoga du matin/i).length).toBeGreaterThan(0);
  });

  it("affiche l'état vide si la recherche ne correspond à rien", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.type(
      screen.getByPlaceholderText("Rechercher par titre ou organisateur…"),
      "zzz_inexistant"
    );
    await waitFor(() => {
      expect(
        screen.getByText("Aucune activité ne correspond à votre recherche")
      ).toBeInTheDocument();
    });
  });

  it("ouvre la fiche détail via le bouton Voir le détail", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getAllByTitle("Voir le détail")[0]);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("ouvre la boîte de dialogue de suppression via le bouton Supprimer", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getAllByTitle("Supprimer")[0]);
    expect(await screen.findByText("Supprimer cette activité ?")).toBeInTheDocument();
  });

  it("confirme la suppression d'une activité", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getAllByTitle("Supprimer")[0]);
    await screen.findByText("Supprimer cette activité ?");
    const confirmBtns = screen.getAllByRole("button", { name: /^supprimer$/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);
    expect(await screen.findByText("Activité supprimée")).toBeInTheDocument();
  });

  it("annule la suppression via Annuler", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getAllByTitle("Supprimer")[0]);
    await screen.findByText("Supprimer cette activité ?");
    const cancelBtns = screen.getAllByRole("button", { name: /annuler/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText("Supprimer cette activité ?")).not.toBeInTheDocument();
    });
  });

  it("filtre par période À venir", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: "À venir" }));
    expect(screen.getAllByText(/yoga du matin/i).length).toBeGreaterThan(0);
  });

  it("filtre par période Passées → état vide", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: "Passées" }));
    await waitFor(() => {
      expect(
        screen.getByText("Aucune activité ne correspond à votre recherche")
      ).toBeInTheDocument();
    });
  });

  it("filtre par lieu Sur site", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: /sur site/i }));
    expect(screen.getAllByText(/yoga du matin/i).length).toBeGreaterThan(0);
  });

  it("filtre par lieu Hors site → état vide", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: /hors site/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Aucune activité ne correspond à votre recherche")
      ).toBeInTheDocument();
    });
  });

  it("filtre par covoiturage → état vide", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: /covoiturage/i }));
    await waitFor(() => {
      expect(
        screen.getByText("Aucune activité ne correspond à votre recherche")
      ).toBeInTheDocument();
    });
  });

  it("bascule l'affichage des activités supprimées", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    const toggle = screen.getByRole("switch");
    await user.click(toggle);
    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-checked", "true");
    });
  });

  it("affiche un message d'erreur si le chargement échoue", async () => {
    server.use(
      http.get("http://localhost:8080/api/activities", () => HttpResponse.error())
    );
    renderPage();
    expect(
      await screen.findByText("Impossible de charger les activités.")
    ).toBeInTheDocument();
  });

  it("ouvre le formulaire de modification et enregistre les changements", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getAllByTitle("Modifier")[0]);
    await screen.findByTestId("edit-modal");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    expect(await screen.findByText("Activité modifiée")).toBeInTheDocument();
  });

  it("réinitialise les filtres depuis l'état vide", async () => {
    const user = userEvent.setup();
    server.use(
      http.get("http://localhost:8080/api/activities", () =>
        HttpResponse.json([{ ...FUTURE_ACTIVITY, deleted: false }])
      )
    );
    renderPage();
    await screen.findAllByText("Yoga du matin");
    await user.click(screen.getByRole("button", { name: "Passées" }));
    await screen.findByText("Aucune activité ne correspond à votre recherche");
    await user.click(screen.getByRole("button", { name: /réinitialiser les filtres/i }));
    expect(await screen.findAllByText("Yoga du matin")).not.toHaveLength(0);
  });
});
