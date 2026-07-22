import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityTimeSelect } from "../../components/activity/ActivityTimeSelect";

describe("ActivityTimeSelect", () => {
  describe("affichage initial", () => {
    it("affiche les heures et minutes du value fourni", () => {
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={vi.fn()} />);
      expect(screen.getByText("08")).toBeInTheDocument();
      expect(screen.getByText("30")).toBeInTheDocument();
    });

    it("affiche '--' pour les heures et minutes quand le value est vide", () => {
      render(<ActivityTimeSelect idPrefix="test" value="" onChange={vi.fn()} />);
      const dashes = screen.getAllByText("--");
      expect(dashes).toHaveLength(2);
    });

    it("rend 4 boutons (−h, +h, −m, +m)", () => {
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={vi.fn()} />);
      expect(screen.getAllByRole("button")).toHaveLength(4);
    });
  });

  describe("stepper heures", () => {
    it("incrémente l'heure au clic sur '+'", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Augmenter les heures" }));
      expect(onChange).toHaveBeenCalledWith("09:30");
    });

    it("décrémente l'heure au clic sur '−'", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Diminuer les heures" }));
      expect(onChange).toHaveBeenCalledWith("07:30");
    });

    it("effectue un wrap 23 → 00", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="23:30" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Augmenter les heures" }));
      expect(onChange).toHaveBeenCalledWith("00:30");
    });

    it("effectue un wrap 00 → 23", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="00:30" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Diminuer les heures" }));
      expect(onChange).toHaveBeenCalledWith("23:30");
    });
  });

  describe("stepper minutes", () => {
    it("incrémente les minutes par palier de 5", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Augmenter les minutes" }));
      expect(onChange).toHaveBeenCalledWith("08:35");
    });

    it("décrémente les minutes par palier de 5", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Diminuer les minutes" }));
      expect(onChange).toHaveBeenCalledWith("08:25");
    });

    it("effectue un wrap 55 → 00", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:55" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Augmenter les minutes" }));
      expect(onChange).toHaveBeenCalledWith("08:00");
    });

    it("effectue un wrap 00 → 55", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:00" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Diminuer les minutes" }));
      expect(onChange).toHaveBeenCalledWith("08:55");
    });
  });

  describe("prop disabled", () => {
    it("désactive tous les boutons quand disabled=true", () => {
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={vi.fn()} disabled />);
      screen.getAllByRole("button").forEach((btn) => expect(btn).toBeDisabled());
    });

    it("n'appelle pas onChange quand disabled et qu'on clique", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} disabled />);
      const btn = screen.getByRole("button", { name: "Augmenter les heures" });
      await userEvent.click(btn, { pointerEventsCheck: 0 });
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
