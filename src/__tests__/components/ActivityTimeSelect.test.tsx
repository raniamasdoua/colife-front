import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivityTimeSelect } from "../../components/activity/ActivityTimeSelect";

describe("ActivityTimeSelect", () => {
  describe("affichage initial", () => {
    it("affiche les heures et minutes du value fourni", () => {
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={vi.fn()} />);
      expect(screen.getByLabelText("Heures")).toHaveValue("08");
      expect(screen.getByLabelText("Minutes")).toHaveValue("30");
    });

    it("affiche des champs vides pour les heures et minutes quand le value est vide", () => {
      render(<ActivityTimeSelect idPrefix="test" value="" onChange={vi.fn()} />);
      expect(screen.getByLabelText("Heures")).toHaveValue("");
      expect(screen.getByLabelText("Minutes")).toHaveValue("");
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
    it("incrémente les minutes une par une", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Augmenter les minutes" }));
      expect(onChange).toHaveBeenCalledWith("08:31");
    });

    it("décrémente les minutes une par une", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Diminuer les minutes" }));
      expect(onChange).toHaveBeenCalledWith("08:29");
    });

    it("effectue un wrap 59 → 00", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:59" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Augmenter les minutes" }));
      expect(onChange).toHaveBeenCalledWith("08:00");
    });

    it("effectue un wrap 00 → 59", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:00" onChange={onChange} />);
      await userEvent.click(screen.getByRole("button", { name: "Diminuer les minutes" }));
      expect(onChange).toHaveBeenCalledWith("08:59");
    });
  });

  describe("saisie au clavier", () => {
    it("met à jour l'heure quand on tape une valeur puis quitte le champ", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      const hourInput = screen.getByLabelText("Heures");
      await userEvent.clear(hourInput);
      await userEvent.type(hourInput, "14");
      await userEvent.tab();
      expect(onChange).toHaveBeenCalledWith("14:30");
    });

    it("met à jour les minutes quand on tape une valeur puis quitte le champ", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      const minuteInput = screen.getByLabelText("Minutes");
      await userEvent.clear(minuteInput);
      await userEvent.type(minuteInput, "7");
      await userEvent.tab();
      expect(onChange).toHaveBeenCalledWith("08:07");
    });

    it("plafonne l'heure saisie à 23", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      const hourInput = screen.getByLabelText("Heures");
      await userEvent.clear(hourInput);
      await userEvent.type(hourInput, "99");
      await userEvent.tab();
      expect(onChange).toHaveBeenCalledWith("23:30");
    });

    it("plafonne les minutes saisies à 59", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      const minuteInput = screen.getByLabelText("Minutes");
      await userEvent.clear(minuteInput);
      await userEvent.type(minuteInput, "99");
      await userEvent.tab();
      expect(onChange).toHaveBeenCalledWith("08:59");
    });

    it("ignore les caractères non numériques saisis", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      const hourInput = screen.getByLabelText("Heures");
      await userEvent.clear(hourInput);
      await userEvent.type(hourInput, "ab");
      expect(hourInput).toHaveValue("");
    });

    it("revient à la valeur précédente si le champ est vidé puis quitté", async () => {
      const onChange = vi.fn();
      render(<ActivityTimeSelect idPrefix="test" value="08:30" onChange={onChange} />);
      const hourInput = screen.getByLabelText("Heures");
      await userEvent.clear(hourInput);
      await userEvent.tab();
      expect(onChange).toHaveBeenCalledWith("08:30");
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
