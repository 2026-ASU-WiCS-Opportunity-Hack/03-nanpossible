import { CountrySelectField } from "@/components/country-select-field";
import { PhoneInputField } from "@/components/phone-input-field";
import { chapterLanguages, chapterRegions } from "@/lib/chapter-options";
import type { ChapterRecord } from "@/lib/types";

const languageOptions = [
  { code: "en", label: chapterLanguages[0] },
  { code: "es", label: chapterLanguages[1] },
  { code: "pt", label: chapterLanguages[2] },
  { code: "fr", label: chapterLanguages[3] },
];

type ChapterSettingsFormProps = {
  chapter: ChapterRecord;
  action: (formData: FormData) => Promise<void>;
  takenCountries?: string[];
};

export function ChapterSettingsForm({ chapter, action, takenCountries }: ChapterSettingsFormProps) {
  const siteDomain = process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost:3000";
  const selectedLanguage =
    languageOptions.find((option) => option.code === chapter.language)?.label ??
    chapterLanguages[0];

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input name="chapterId" type="hidden" value={chapter.id} />

      <label className="field-shell">
        <span className="field-label">Affiliate name</span>
        <input className="field-input" defaultValue={chapter.name} name="name" required type="text" />
      </label>

      <label className="field-shell">
        <span className="field-label">Region</span>
        <select className="field-input" defaultValue={chapter.region ?? chapterRegions[0]} name="region">
          {chapterRegions.map((region) => (
            <option key={region} value={region}>
              {region}
            </option>
          ))}
        </select>
      </label>

      <label className="field-shell">
        <span className="field-label">Country</span>
        <CountrySelectField defaultValue={chapter.country} takenCountries={takenCountries} />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
          Countries that already have an affiliate are not listed
        </span>
      </label>

      <label className="field-shell">
        <span className="field-label">Language</span>
        <select className="field-input" defaultValue={selectedLanguage} name="language">
          {languageOptions.map((option) => (
            <option key={option.code} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="field-shell">
        <span className="field-label">Contact email</span>
        <input
          className="field-input"
          defaultValue={chapter.contactEmail ?? ""}
          name="contactEmail"
          type="email"
        />
      </label>

      <label className="field-shell">
        <span className="field-label">Contact phone</span>
        <PhoneInputField
          defaultPhone={chapter.contactPhone}
          defaultCountryCode={chapter.contactPhoneCountryCode}
        />
      </label>

      <label className="field-shell md:col-span-2">
        <span className="field-label">Affiliate website</span>
        <input
          className="field-input"
          defaultValue={chapter.websiteUrl ?? ""}
          name="websiteUrl"
          placeholder="https://www.wial.sg"
          type="text"
        />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
          Where the affiliates directory sends visitors. Leave blank to use the hosted site at{" "}
          {chapter.subdomain}.{siteDomain}
        </span>
      </label>

      <label className="field-shell md:col-span-2">
        <span className="field-label">Description</span>
        <textarea
          className="field-textarea"
          defaultValue={chapter.description ?? ""}
          name="description"
          rows={5}
        />
      </label>

      <label className="field-shell md:col-span-2">
        <span className="field-label">Logo URL</span>
        <input className="field-input" defaultValue={chapter.logoUrl ?? ""} name="logoUrl" type="url" />
      </label>

      <div className="md:col-span-2">
        <button className="button-link primary" type="submit">
          Save settings
        </button>
      </div>
    </form>
  );
}
