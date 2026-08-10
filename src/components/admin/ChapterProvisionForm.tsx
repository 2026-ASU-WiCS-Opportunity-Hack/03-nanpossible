"use client";

import { useMemo, useState, useTransition } from "react";
import { chapterLanguages, chapterRegions } from "@/lib/chapter-options";
import { CountryInputField } from "@/components/country-input-field";
import { PhoneInputField } from "@/components/phone-input-field";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getProvisionNotice(url: string, warning?: string | null) {
  switch (warning) {
    case "welcome-email-skipped":
      return `Affiliate created at ${url}. Email delivery is not configured yet.`;
    case "welcome-email-failed":
      return `Affiliate created at ${url}. Welcome email could not be sent. Check RESEND_API_KEY and sender-domain configuration.`;
    default:
      return `Affiliate created at ${url}.`;
  }
}

export function ChapterProvisionForm() {
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [subdomainTouched, setSubdomainTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const slugPreview = useMemo(
    () => slugify(subdomain || name || "chapter"),
    [name, subdomain],
  );

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        setNotice(null);

        const form = event.currentTarget;
        const formData = new FormData(form);
        formData.set("subdomain", slugify(String(formData.get("subdomain") || name)));

        startTransition(async () => {
          const response = await fetch("/api/chapters/provision", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: formData.get("name"),
              subdomain: formData.get("subdomain"),
              region: formData.get("region"),
              country: formData.get("country"),
              language: formData.get("language"),
              lead_email: formData.get("leadEmail"),
              contact_email: formData.get("contactEmail"),
              contact_phone: formData.get("phone"),
              contact_phone_country_code: formData.get("phone_country_code"),
              description: formData.get("description"),
              website_url: formData.get("websiteUrl"),
            }),
          });

          const payload = (await response.json()) as {
            error?: string;
            message?: string;
            success?: boolean;
            url?: string;
            warning?: string | null;
          };

          if (!response.ok || !payload.success) {
            setError(payload.message ?? "WIAL could not provision the affiliate.");
            return;
          }

          setNotice(getProvisionNotice(payload.url ?? "the new site", payload.warning));
          form.reset();
          setName("");
          setSubdomain("");
        });
      }}
    >
      {error ? <div className="account-flash is-error">{error}</div> : null}
      {notice ? <div className="account-flash is-success">{notice}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-shell">
          <span className="field-label">Affiliate name</span>
          <input
            className="field-input"
            name="name"
            onChange={(event) => {
      const val = event.target.value;
      setName(val);
      if (!subdomainTouched) setSubdomain(slugify(val)); 
        }}
            required
            type="text"
          />
        </label>
        <label className="field-shell">
          <span className="field-label">Subdomain</span>
          <input
      className="field-input"
      name="subdomain"
        value={subdomain}
        onChange={(event) => {
    setSubdomainTouched(true);
    setSubdomain(event.target.value);
  }}
  required
  type="text"
/>
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
            Preview: {slugPreview}.{process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost:3000"}
          </span>
        </label>

        <label className="field-shell">
          <span className="field-label">Region</span>
          <select className="field-input" defaultValue={chapterRegions[0]} name="region">
            {chapterRegions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </label>

        <label className="field-shell">
          <span className="field-label">Primary language</span>
          <select className="field-input" defaultValue={chapterLanguages[0]} name="language">
            {chapterLanguages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>

        <label className="field-shell">
          <span className="field-label">Country</span>
          <CountryInputField required />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
            Pick a suggested name to show the affiliate&apos;s flag on the directory
          </span>
        </label>

        <label className="field-shell">
          <span className="field-label">Affiliate lead email</span>
          <input className="field-input" name="leadEmail" required type="email" />
        </label>

        <label className="field-shell">
          <span className="field-label">Contact email</span>
          <input className="field-input" name="contactEmail" required type="email" />
        </label>

       <label className="field-shell">
          <span className="field-label">Contact phone</span>
          <PhoneInputField defaultPhone={null} defaultCountryCode={null} />
        </label>

        <label className="field-shell md:col-span-2">
          <span className="field-label">Affiliate website (optional)</span>
          <input
            className="field-input"
            name="websiteUrl"
            placeholder="https://www.wial.sg"
            type="text"
          />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
            If the affiliate keeps its own website, the directory links there. Leave blank to use
            the hosted site at {slugPreview}.{process.env.NEXT_PUBLIC_SITE_DOMAIN ?? "localhost:3000"}
          </span>
        </label>
      </div>

      <label className="field-shell">
        <span className="field-label">Description</span>
        <textarea className="field-textarea" name="description" rows={6} />
      </label>

      <div className="flex flex-wrap gap-3">
        <button className="button-link primary" disabled={isPending} type="submit">
          {isPending ? "Creating affiliate..." : "Create affiliate"}
        </button>
      </div>
    </form>
  );
}
