import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MessageModal } from "../../components/ui/MessageModal";

describe("MessageModal", () => {
  describe("rendu conditionnel", () => {
    it("ne rend rien quand open est false", () => {
      const { container } = render(
        <MessageModal open={false} message="Test" onClose={vi.fn()} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("rend le dialogue quand open est true", () => {
      render(<MessageModal open={true} message="Mon message" onClose={vi.fn()} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  describe("contenu", () => {
    it("affiche le message fourni", () => {
      render(<MessageModal open={true} message="Erreur critique" onClose={vi.fn()} />);
      expect(screen.getByText("Erreur critique")).toBeInTheDocument();
    });

    it("affiche le titre fourni", () => {
      render(<MessageModal open={true} title="Mon titre" message="msg" onClose={vi.fn()} />);
      expect(screen.getByText("Mon titre")).toBeInTheDocument();
    });

    it("affiche le titre par défaut 'Inscription impossible'", () => {
      render(<MessageModal open={true} message="Erreur" onClose={vi.fn()} />);
      expect(screen.getByText("Inscription impossible")).toBeInTheDocument();
    });

    it("affiche un label de confirmation personnalisé", () => {
      render(
        <MessageModal open={true} message="msg" onClose={vi.fn()} confirmLabel="Compris" />
      );
      expect(screen.getByRole("button", { name: "Compris" })).toBeInTheDocument();
    });

    it("affiche 'OK' comme label par défaut", () => {
      render(<MessageModal open={true} message="msg" onClose={vi.fn()} />);
      expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
    });
  });

  describe("interactions", () => {
    it("appelle onClose au clic sur le bouton de confirmation", async () => {
      const onClose = vi.fn();
      render(<MessageModal open={true} message="Test" onClose={onClose} />);
      await userEvent.click(screen.getByRole("button", { name: "OK" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("appelle onClose au clic sur le bouton X", async () => {
      const onClose = vi.fn();
      render(<MessageModal open={true} message="Test" onClose={onClose} />);
      const fermerButtons = screen.getAllByRole("button", { name: "Fermer" });
      await userEvent.click(fermerButtons[fermerButtons.length - 1]);
      expect(onClose).toHaveBeenCalled();
    });

    it("appelle onClose au clic sur le fond (backdrop)", async () => {
      const onClose = vi.fn();
      render(<MessageModal open={true} message="Test" onClose={onClose} />);
      const fermerButtons = screen.getAllByRole("button", { name: "Fermer" });
      await userEvent.click(fermerButtons[0]);
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe("variant success", () => {
    it("rend le dialogue en mode succès", () => {
      render(
        <MessageModal
          open={true}
          message="Inscription réussie !"
          onClose={vi.fn()}
          variant="success"
          title="Bravo"
        />
      );
      expect(screen.getByText("Bravo")).toBeInTheDocument();
      expect(screen.getByText("Inscription réussie !")).toBeInTheDocument();
    });
  });
});
