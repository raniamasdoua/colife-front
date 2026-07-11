import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OffSiteAddressFields } from "../../../components/activity/OffSiteAddressFields";

const defaultProps = {
  idPrefix: "test-",
  street: "12 rue de la Paix",
  complement: "",
  postalCode: "75001",
  city: "Paris",
  disabled: false,
  inputClass: "input",
  onStreetChange: vi.fn(),
  onComplementChange: vi.fn(),
  onPostalCodeChange: vi.fn(),
  onCityChange: vi.fn(),
};

describe("OffSiteAddressFields", () => {
  it("affiche les champs avec les valeurs fournies", () => {
    render(<OffSiteAddressFields {...defaultProps} />);
    expect(screen.getByDisplayValue("12 rue de la Paix")).toBeInTheDocument();
    expect(screen.getByDisplayValue("75001")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Paris")).toBeInTheDocument();
  });

  it("appelle onStreetChange à la saisie", async () => {
    const onStreetChange = vi.fn();
    render(<OffSiteAddressFields {...defaultProps} street="" onStreetChange={onStreetChange} />);
    await userEvent.type(screen.getByLabelText(/adresse/i), "5");
    expect(onStreetChange).toHaveBeenCalled();
  });

  it("filtre les caractères non numériques dans le code postal", async () => {
    const onPostalCodeChange = vi.fn();
    render(<OffSiteAddressFields {...defaultProps} postalCode="" onPostalCodeChange={onPostalCodeChange} />);
    await userEvent.type(screen.getByLabelText(/code postal/i), "A");
    expect(onPostalCodeChange).toHaveBeenCalledWith("");
  });

  it("désactive les champs quand disabled=true", () => {
    render(<OffSiteAddressFields {...defaultProps} disabled={true} />);
    expect(screen.getByLabelText(/adresse/i)).toBeDisabled();
  });
});
