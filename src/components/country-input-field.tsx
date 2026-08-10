import { countries } from "@/lib/countries";

type CountryInputFieldProps = {
  defaultValue?: string | null;
  required?: boolean;
};

// Free-text country input with the canonical country names suggested.
// Matching names get a flag next to the affiliate in the public directory.
export function CountryInputField({ defaultValue, required }: CountryInputFieldProps) {
  return (
    <>
      <input
        className="field-input"
        defaultValue={defaultValue ?? ""}
        list="wial-country-options"
        name="country"
        required={required}
        type="text"
      />
      <datalist id="wial-country-options">
        {countries.map((country) => (
          <option key={country.code} value={country.name} />
        ))}
      </datalist>
    </>
  );
}
