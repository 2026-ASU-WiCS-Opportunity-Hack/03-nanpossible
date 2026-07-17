"use client";
import { useState } from "react";
import PhoneInput, { parsePhoneNumber } from "react-phone-number-input";
import type { E164Number, CountryCode } from "libphonenumber-js";
import "react-phone-number-input/style.css";

type PhoneInputFieldProps = {
  defaultPhone?: string | null;
  defaultCountryCode?: string | null;
};

export function PhoneInputField({
  defaultPhone,
  defaultCountryCode,
}: PhoneInputFieldProps) {
  const [value, setValue] = useState<E164Number | undefined>(
    (defaultPhone as E164Number) ?? undefined,
  );
  const [country, setCountry] = useState<CountryCode | undefined>(
    (defaultCountryCode as CountryCode) ?? undefined,
  );

  const [resetKey, setResetKey] = useState(0);

  const handleChange = (newValue?: E164Number) => {
    setValue(newValue);

    if (newValue) {
      setCountry(parsePhoneNumber(newValue)?.country ?? country);
    } else {
    
      setCountry(undefined);
      setResetKey((k) => k + 1);
    }
  };

  return (
    <div className="phone-input-wrapper">
      <PhoneInput
        key={resetKey}
        defaultCountry={country}
        international
        onChange={handleChange}
        onCountryChange={setCountry}
        placeholder="Phone (optional)"
        value={value}
        className="field-input"
      />
      <input name="phone" type="hidden" value={value ?? ""} />
      <input name="phone_country_code" type="hidden" value={country ?? ""} />
    </div>
  );
}