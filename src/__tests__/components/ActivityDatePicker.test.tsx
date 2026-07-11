import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityDatePicker } from "../../components/activity/ActivityDatePicker";

describe("ActivityDatePicker", () => {
  describe("affichage initial", () => {
    it("affiche 'Choisir une date' quand aucune valeur n'est fournie", () => {
      render(<ActivityDatePicker id="date" value="" onChange={vi.fn()} />);
      expect(screen.getByText(/choisir une date/i)).toBeInTheDocument();
    });

    it("affiche la date formatée en français quand une valeur est fournie", () => {
      render(<ActivityDatePicker id="date" value="2026-12-25" onChange={vi.fn()} />);
      const btn = screen.getByRole("button");
      expect(btn).toHaveTextContent(/décembre/i);
      expect(btn).toHaveTextContent("25");
      expect(btn).toHaveTextContent("2026");
    });

    it("ne rend pas le calendrier par défaut", () => {
      render(<ActivityDatePicker id="date" value="" onChange={vi.fn()} />);
      expect(screen.queryByRole("dialog", { name: /calendrier/i })).not.toBeInTheDocument();
    });
  });

  describe("ouverture / fermeture du calendrier", () => {
    it("ouvre le calendrier au clic sur le bouton déclencheur", async () => {
      render(<ActivityDatePicker id="date" value="" onChange={vi.fn()} />);
      await userEvent.click(screen.getByRole("button"));
      expect(screen.getByRole("dialog", { name: /calendrier/i })).toBeInTheDocument();
    });

    it("affiche les en-têtes des jours de la semaine (Lu Ma … Di)", async () => {
      render(<ActivityDatePicker id="date" value="" onChange={vi.fn()} />);
      await userEvent.click(screen.getByRole("button"));
      const dialog = screen.getByRole("dialog", { name: /calendrier/i });
      expect(within(dialog).getByText("Lu")).toBeInTheDocument();
      expect(within(dialog).getByText("Di")).toBeInTheDocument();
    });

    it("ferme le calendrier au clic en dehors du composant", async () => {
      render(
        <div>
          <ActivityDatePicker id="date" value="" onChange={vi.fn()} />
          <div data-testid="outside">Dehors</div>
        </div>
      );
      await userEvent.click(screen.getByRole("button"));
      expect(screen.getByRole("dialog", { name: /calendrier/i })).toBeInTheDocument();
      await userEvent.click(screen.getByTestId("outside"));
      expect(screen.queryByRole("dialog", { name: /calendrier/i })).not.toBeInTheDocument();
    });
  });

  describe("navigation mensuelle", () => {
    it("affiche les boutons de navigation 'Mois précédent' et 'Mois suivant'", async () => {
      render(<ActivityDatePicker id="date" value="" onChange={vi.fn()} />);
      await userEvent.click(screen.getByRole("button"));
      const dialog = screen.getByRole("dialog", { name: /calendrier/i });
      expect(within(dialog).getByRole("button", { name: /mois précédent/i })).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: /mois suivant/i })).toBeInTheDocument();
    });

    it("change le mois affiché au clic sur 'Mois suivant'", async () => {
      render(<ActivityDatePicker id="date" value="2026-07-01" onChange={vi.fn()} />);
      await userEvent.click(screen.getByRole("button"));
      const dialog = screen.getByRole("dialog", { name: /calendrier/i });
      expect(within(dialog).getByText(/juillet/i)).toBeInTheDocument();
      await userEvent.click(within(dialog).getByRole("button", { name: /mois suivant/i }));
      expect(within(dialog).getByText(/août/i)).toBeInTheDocument();
    });

    it("change le mois affiché au clic sur 'Mois précédent'", async () => {
      render(<ActivityDatePicker id="date" value="2026-07-01" onChange={vi.fn()} />);
      await userEvent.click(screen.getByRole("button"));
      const dialog = screen.getByRole("dialog", { name: /calendrier/i });
      await userEvent.click(within(dialog).getByRole("button", { name: /mois précédent/i }));
      expect(within(dialog).getByText(/juin/i)).toBeInTheDocument();
    });

    it("passe à janvier quand on navigue avant en étant en décembre", async () => {
      render(<ActivityDatePicker id="date" value="2026-12-01" onChange={vi.fn()} />);
      await userEvent.click(screen.getByRole("button"));
      const dialog = screen.getByRole("dialog", { name: /calendrier/i });
      await userEvent.click(within(dialog).getByRole("button", { name: /mois suivant/i }));
      expect(within(dialog).getByText(/janvier/i)).toBeInTheDocument();
      expect(dialog).toHaveTextContent("2027");
    });
  });

  describe("sélection de date", () => {
    it("appelle onChange avec la date ISO au clic sur un jour futur", async () => {
      const onChange = vi.fn();
      render(<ActivityDatePicker id="date" value="2026-07-01" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button"));
      const dialog = screen.getByRole("dialog", { name: /calendrier/i });
      await userEvent.click(within(dialog).getByRole("button", { name: /mois suivant/i }));
      const dayButtons = within(dialog).getAllByRole("button").filter(
        (btn) => /^\d+$/.test(btn.textContent ?? "") && !(btn as HTMLButtonElement).disabled
      );
      await userEvent.click(dayButtons[0]);
      expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^2026-08-/));
    });
  });

  describe("prop disabled", () => {
    it("désactive le bouton déclencheur quand disabled=true", () => {
      render(<ActivityDatePicker id="date" value="" onChange={vi.fn()} disabled />);
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("n'ouvre pas le calendrier quand disabled=true", async () => {
      render(<ActivityDatePicker id="date" value="" onChange={vi.fn()} disabled />);
      await userEvent.click(screen.getByRole("button"), { pointerEventsCheck: 0 });
      expect(screen.queryByRole("dialog", { name: /calendrier/i })).not.toBeInTheDocument();
    });
  });
});
