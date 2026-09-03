"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { SiteFooterContent } from "@/components/site-footer-content";
import {
  hasGlobalFooterContent,
  parseGlobalFooterContent,
  type GlobalFooterContent,
  type GlobalFooterState,
} from "@/lib/global-footer";
import type { SiteContext } from "@/lib/types";

type GlobalFooterEditorProps = {
  initialState: GlobalFooterState;
  pageId: string;
};

type Notice = {
  message: string;
  tone: "success" | "error";
} | null;

const previewContext: SiteContext = {
  isGlobal: true,
  tenant: null,
  host: "wial.org",
};

export function GlobalFooterEditor({
  initialState,
  pageId,
}: GlobalFooterEditorProps) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialState.draft);
  const [published, setPublished] = useState(initialState.published);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const publicStatus = published
    ? "A custom footer is live"
    : "The original footer is live";
  const statusHint = published
    ? "Publish again to replace the current custom footer."
    : "Your edits stay private until you click Publish.";
  const normalizedDraft = useMemo(
    () => parseGlobalFooterContent(draft),
    [draft],
  );

  function updateField<Key extends keyof GlobalFooterContent>(
    key: Key,
    value: GlobalFooterContent[Key],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
    setNotice(null);
  }

  function updateLink(
    index: number,
    field: "label" | "href",
    value: string,
  ) {
    updateField(
      "links",
      draft.links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link,
      ),
    );
  }

  function addLink() {
    updateField("links", [
      ...draft.links,
      {
        id: `link-${Date.now()}`,
        label: "New link",
        href: "/",
      },
    ]);
  }

  function removeLink(index: number) {
    updateField(
      "links",
      draft.links.filter((_, linkIndex) => linkIndex !== index),
    );
  }

  async function submit(endpoint: string, successMessage: string) {
    setIsSaving(true);
    setNotice(null);

    try {
      const content = parseGlobalFooterContent(draft);
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_id: pageId, content }),
      });
      const payload = (await response.json()) as {
        draft?: GlobalFooterContent;
        error?: string;
        published?: GlobalFooterContent;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "request-failed");
      }

      setDraft(payload.draft ?? payload.published ?? content);
      setIsDirty(false);

      if (endpoint.endsWith("/publish")) {
        setPublished(payload.published ?? content);
        router.refresh();
      }

      setNotice({ message: successMessage, tone: "success" });
    } catch {
      setNotice({
        message: "The footer could not be saved. Please try again.",
        tone: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="site-panel rounded-[2rem] p-6 md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Public status</p>
            <h2 className="mt-3 font-display text-3xl text-teal-deep">
              {publicStatus}
            </h2>
            <p className="mt-2 text-sm leading-7 text-foreground/68">
              {statusHint}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              className="button-link secondary"
              disabled={isSaving || !isDirty}
              onClick={() =>
                void submit(
                  "/api/admin/global/footer/save-draft",
                  "Draft saved. The public footer has not changed.",
                )
              }
              type="button"
            >
              {isSaving ? "Saving..." : "Save draft"}
            </button>
            <button
              className="button-link primary"
              disabled={isSaving}
              onClick={() =>
                void submit(
                  "/api/admin/global/footer/publish",
                  "Footer published. The public site now uses these values.",
                )
              }
              type="button"
            >
              {isSaving ? "Publishing..." : "Publish footer"}
            </button>
          </div>
        </div>

        {notice ? (
          <div
            className={`account-flash mt-5 ${
              notice.tone === "success" ? "is-success" : "is-error"
            }`}
          >
            {notice.message}
          </div>
        ) : null}
      </section>

      <div className="space-y-8">
        <section className="site-panel rounded-[2rem] p-6 md:p-8">
          <p className="eyebrow">Footer fields</p>
          <h2 className="mt-3 font-display text-3xl text-teal-deep">
            Edit content
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <FooterField
              label="Small label"
              onChange={(value) => updateField("eyebrow", value)}
              value={draft.eyebrow}
            />
            <FooterField
              label="Main heading"
              multiline
              onChange={(value) => updateField("heading", value)}
              value={draft.heading}
            />
            <FooterField
              label="Description"
              multiline
              onChange={(value) => updateField("description", value)}
              value={draft.description}
            />
            <FooterField
              label="Contact section heading"
              onChange={(value) => updateField("contactHeading", value)}
              value={draft.contactHeading}
            />
            <FooterField
              label="Address"
              multiline
              onChange={(value) => updateField("address", value)}
              value={draft.address}
            />
            <FooterField
              label="Global contact email"
              onChange={(value) => updateField("email", value)}
              value={draft.email}
            />
            <FooterField
              label="Links section heading"
              onChange={(value) => updateField("linksHeading", value)}
              value={draft.linksHeading}
            />

            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <span className="field-label">Footer links</span>
                <button
                  className="text-sm font-semibold text-accent"
                  onClick={addLink}
                  type="button"
                >
                  + Add link
                </button>
              </div>
              {draft.links.map((link, index) => (
                <div
                  className="rounded-[1.25rem] border border-line/70 p-4"
                  key={link.id}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FooterField
                      label={`Link ${index + 1} label`}
                      onChange={(value) => updateLink(index, "label", value)}
                      value={link.label}
                    />
                    <FooterField
                      label={`Link ${index + 1} address`}
                      onChange={(value) => updateLink(index, "href", value)}
                      value={link.href}
                    />
                  </div>
                  <button
                    className="mt-3 text-sm font-semibold text-accent"
                    onClick={() => removeLink(index)}
                    type="button"
                  >
                    Remove link
                  </button>
                </div>
              ))}
            </div>

            <FooterField
              help='Use "{siteName}" to show the global or chapter name automatically.'
              label="Left bottom text"
              multiline
              onChange={(value) => updateField("leftLegal", value)}
              value={draft.leftLegal}
            />
            <FooterField
              label="Right bottom text"
              multiline
              onChange={(value) => updateField("rightLegal", value)}
              value={draft.rightLegal}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <p className="eyebrow">Preview</p>
            <h2 className="mt-3 font-display text-3xl text-teal-deep">
              How the footer will look
            </h2>
            <p className="mt-2 text-sm text-foreground/62">
              This preview updates as you type. It is not public until you publish.
            </p>
          </div>
          <div className="site-shell !max-w-none !px-0">
            {hasGlobalFooterContent(normalizedDraft) ? (
              <SiteFooterContent
                content={normalizedDraft}
                siteContext={previewContext}
              />
            ) : (
              <p className="text-sm text-foreground/55">
                Nothing to show — the footer is hidden when every field is
                empty.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

type FooterFieldProps = {
  help?: string;
  label: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  value: string;
};

function FooterField({
  help,
  label,
  multiline = false,
  onChange,
  value,
}: FooterFieldProps) {
  return (
    <label className="field-shell">
      <span className="field-label">{label}</span>
      {multiline ? (
        <textarea
          className="field-input min-h-24"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      ) : (
        <input
          className="field-input"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
      )}
      {help ? <span className="text-xs text-foreground/52">{help}</span> : null}
    </label>
  );
}
