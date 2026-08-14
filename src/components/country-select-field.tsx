import { countries } from "@/lib/countries";

type CountrySelectFieldProps = {
  defaultValue?: string | null;
  required?: boolean;
  takenCountries?: string[];
};

// Dropdown of canonical country names (each shows a flag in the directory).
// Countries already claimed by another affiliate are hidden to prevent
// duplicate affiliate sites; the current value always stays selectable, even
// if it is a legacy free-text name outside the canonical list.
export function CountrySelectField({
  defaultValue,
  required,
  takenCountries = [],
}: CountrySelectFieldProps) {
  const current = (defaultValue ?? "").trim();
  const currentKey = current.toLowerCase();
  const taken = new Set(takenCountries.map((name) => name.trim().toLowerCase()));
  const options = countries.filter(
    (country) =>
      country.name.toLowerCase() === currentKey ||
      !taken.has(country.name.toLowerCase()),
  );
  const canonical = countries.find((country) => country.name.toLowerCase() === currentKey);

  return (
    <select
      className="field-input"
      defaultValue={canonical?.name ?? current}
      name="country"
      required={required}
    >
      <option disabled={required} value="">
        {required ? "Select a country" : "No country"}
      </option>
      {current && !canonical ? <option value={current}>{current}</option> : null}
      {options.map((country) => (
        <option key={country.code} value={country.name}>
          {country.name}
        </option>
      ))}
    </select>
  );
}
