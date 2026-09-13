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

import { AdminActivityTypesPage } from "../../../pages/admin/AdminActivityTypesPage";

function renderPage() {
  return render(
    <MemoryRouter>
      <AdminActivityTypesPage />
    </MemoryRouter>
  );
}

describe("AdminActivityTypesPage", () => {
  it("s'affiche sans erreur", () => {
    const { container } = renderPage();
    expect(container.firstChild).not.toBeNull();
  });

  it("affiche les types d'activités après chargement", async () => {
    renderPage();
    expect((await screen.findAllByText("Yoga")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Sport").length).toBeGreaterThan(0);
  });

  it("affiche le bouton Nouveau type", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: /nouveau type/i })).toBeInTheDocument();
  });

  it("ouvre le formulaire de création au clic sur Nouveau type", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: /nouveau type/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Nouveau type d'activité")).toBeInTheDocument();
  });

  it("valide que le nom est obligatoire dans le formulaire", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: /nouveau type/i }));
    await screen.findByRole("dialog");
    await user.click(screen.getByRole("button", { name: /^créer$/i }));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("crée un nouveau type d'activité", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: /nouveau type/i }));
    await screen.findByRole("dialog");
    await user.type(screen.getByLabelText(/nom du type/i), "Pilates");
    await user.click(screen.getByRole("button", { name: /^créer$/i }));
    expect(await screen.findByText("Type créé")).toBeInTheDocument();
  });

  it("ouvre le formulaire de modification au clic sur Modifier", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga");
    const editBtns = screen.getAllByRole("button", { name: /^modifier$/i });
    await user.click(editBtns[0]);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Modifier le type")).toBeInTheDocument();
  });

  it("modifie un type d'activité existant", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga");
    const editBtns = screen.getAllByRole("button", { name: /^modifier$/i });
    await user.click(editBtns[0]);
    await screen.findByRole("dialog");
    const input = screen.getByLabelText(/nom du type/i);
    await user.clear(input);
    await user.type(input, "Yoga modifié");
    await user.click(screen.getByRole("button", { name: /enregistrer/i }));
    expect(await screen.findByText("Type modifié")).toBeInTheDocument();
  });

  it("ouvre la boîte de dialogue de suppression", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga");
    const deleteBtns = screen.getAllByRole("button", { name: /^supprimer$/i });
    await user.click(deleteBtns[0]);
    expect(await screen.findByText("Supprimer ce type ?")).toBeInTheDocument();
  });

  it("supprime un type d'activité après confirmation", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga");
    const deleteBtns = screen.getAllByRole("button", { name: /^supprimer$/i });
    await user.click(deleteBtns[0]);
    await screen.findByText("Supprimer ce type ?");
    const confirmBtns = screen.getAllByRole("button", { name: /^supprimer$/i });
    await user.click(confirmBtns[confirmBtns.length - 1]);
    expect(await screen.findByText("Type supprimé")).toBeInTheDocument();
  });

  it("annule la suppression via Annuler", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findAllByText("Yoga");
    const deleteBtns = screen.getAllByRole("button", { name: /^supprimer$/i });
    await user.click(deleteBtns[0]);
    await screen.findByText("Supprimer ce type ?");
    const cancelBtns = screen.getAllByRole("button", { name: /annuler/i });
    await user.click(cancelBtns[cancelBtns.length - 1]);
    await waitFor(() => {
      expect(screen.queryByText("Supprimer ce type ?")).not.toBeInTheDocument();
    });
  });
});
