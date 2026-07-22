import { FORM_LABEL_CLASS, MAX_CITY, MAX_COMPLEMENT, MAX_STREET } from "./activityFormUtils";

type Props = {
  readonly idPrefix: string;
  readonly street: string;
  readonly complement: string;
  readonly postalCode: string;
  readonly city: string;
  readonly disabled: boolean;
  readonly inputClass: string;
  readonly onStreetChange: (v: string) => void;
  readonly onComplementChange: (v: string) => void;
  readonly onPostalCodeChange: (v: string) => void;
  readonly onCityChange: (v: string) => void;
};

export function OffSiteAddressFields({
  idPrefix,
  street,
  complement,
  postalCode,
  city,
  disabled,
  inputClass,
  onStreetChange,
  onComplementChange,
  onPostalCodeChange,
  onCityChange,
}: Props) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}street`} className={FORM_LABEL_CLASS}>
          Adresse (rue, n°) *
        </label>
        <input
          id={`${idPrefix}street`}
          type="text"
          required
          maxLength={MAX_STREET}
          autoComplete="street-address"
          className={inputClass}
          value={street}
          onChange={(e) => onStreetChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div>
        <label htmlFor={`${idPrefix}complement`} className={FORM_LABEL_CLASS}>
          Complément (bâtiment, étage…)
        </label>
        <input
          id={`${idPrefix}complement`}
          type="text"
          maxLength={MAX_COMPLEMENT}
          className={inputClass}
          value={complement}
          onChange={(e) => onComplementChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}postal`} className={FORM_LABEL_CLASS}>
            Code postal *
          </label>
          <input
            id={`${idPrefix}postal`}
            type="text"
            required
            inputMode="numeric"
            maxLength={5}
            autoComplete="postal-code"
            className={inputClass}
            value={postalCode}
            onChange={(e) =>
              onPostalCodeChange(e.target.value.replace(/\D/g, "").slice(0, 5))
            }
            disabled={disabled}
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}city`} className={FORM_LABEL_CLASS}>
            Ville *
          </label>
          <input
            id={`${idPrefix}city`}
            type="text"
            required
            maxLength={MAX_CITY}
            autoComplete="address-level2"
            className={inputClass}
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      </div>
    </>
  );
}
