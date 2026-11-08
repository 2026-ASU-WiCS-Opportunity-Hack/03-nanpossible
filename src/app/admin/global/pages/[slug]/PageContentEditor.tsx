"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AdminWorkbench } from "@/components/admin/AdminWorkbench";
import { renderSection } from "@/components/content-page";
import { getWorkbenchStatusCopy, type WorkbenchSaveState } from "@/lib/workbench";
import {
  isTestimonialHighlightsSupported,
  clampTestimonialLimit,
  resolveTestimonials,
  TESTIMONIAL_AUDIENCE_LABELS,
  TESTIMONIAL_AUDIENCES,
  type TestimonialAudience,
  type TestimonialItem,
} from "@/lib/testimonials";
import type { ContentBody, ContentSection, MetricItem } from "@/lib/types";
import { saveGlobalPageAction } from "./actions";

type TimelineDraftItem = { year: string; title: string; body: string };

/**
 * Editable sections keep paragraphs/bullets as raw text while typing;
 * everything else (locked types) is carried verbatim and never modified.
 */
type SectionDraft =
  | { kind: "prose"; title: string; paragraphsText: string; bulletsText: string }
  | {
      kind: "media_prose";
      title: string;
      paragraphsText: string;
      bulletsText: string;
      image: string;
      imageAlt: string;
      caption: string;
      imagePosition: "left" | "right";
    }
  | { kind: "timeline"; title: string; items: TimelineDraftItem[] }
  | { kind: "cta"; title: string; body: string; href: string; label: string }
  | {
      kind: "testimonial_highlights";
      title: string;
      description: string;
      audience: TestimonialAudience;
      limitText: string;
      includeVideo: boolean;
      linkLabel: string;
      linkHref: string;
    }
  | {
      kind: "testimonial_tags";
      section: Extract<ContentSection, { type: "testimonial_grid" }>;
    }
  | { kind: "locked"; section: ContentSection };

type AddableKind = Exclude<SectionDraft["kind"], "locked" | "testimonial_tags">;

type PageContentEditorProps = {
  slug: string;
  initialTitle: string;
  initialPublished: boolean;
  initialBody: ContentBody;
  /** Quotes from /clients, for previewing "Client quotes" sections. */
  testimonials?: TestimonialItem[];
};

const SECTION_LABELS: Record<AddableKind, string> = {
  prose: "Text section",
  media_prose: "Text with photo",
  timeline: "Timeline",
  cta: "Call to action",
  testimonial_highlights: "Client quotes",
};

function toDraft(section: ContentSection): SectionDraft {
  switch (section.type) {
    case "prose":
      return {
        kind: "prose",
        title: section.title,
        paragraphsText: section.paragraphs.join("\n\n"),
        bulletsText: (section.bullets ?? []).join("\n"),
      };
    case "media_prose":
      return {
        kind: "media_prose",
        title: section.title,
        paragraphsText: section.paragraphs.join("\n\n"),
        bulletsText: (section.bullets ?? []).join("\n"),
        image: section.image,
        imageAlt: section.imageAlt,
        caption: section.caption ?? "",
        imagePosition: section.imagePosition ?? "left",
      };
    case "timeline":
      return {
        kind: "timeline",
        title: section.title,
        items: section.items.map((item) => ({
          year: item.year ?? "",
          title: item.title,
          body: item.body,
        })),
      };
    case "cta":
      return {
        kind: "cta",
        title: section.title,
        body: section.body,
        href: section.href,
        label: section.label,
      };
    case "testimonial_highlights":
      return {
        kind: "testimonial_highlights",
        title: section.title,
        description: section.description ?? "",
        audience: section.audience,
        limitText: String(section.limit ?? 3),
        includeVideo: section.includeVideo === true,
        linkLabel: section.linkLabel ?? "",
        linkHref: section.linkHref ?? "",
      };
    case "testimonial_grid":
      return { kind: "testimonial_tags", section };
    default:
      return { kind: "locked", section };
  }
}

function splitParagraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
}

function fromDraft(draft: SectionDraft): ContentSection {
  switch (draft.kind) {
    case "prose":
      return {
        type: "prose",
        title: draft.title,
        paragraphs: splitParagraphs(draft.paragraphsText),
        bullets: splitLines(draft.bulletsText),
      };
    case "media_prose":
      return {
        type: "media_prose",
        title: draft.title,
        image: draft.image,
        imageAlt: draft.imageAlt,
        paragraphs: splitParagraphs(draft.paragraphsText),
        bullets: splitLines(draft.bulletsText),
        caption: draft.caption || undefined,
        imagePosition: draft.imagePosition,
      };
    case "timeline":
      return {
        type: "timeline",
        title: draft.title,
        items: draft.items.map((item) => ({
          year: item.year || undefined,
          title: item.title,
          body: item.body,
        })),
      };
    case "cta":
      return {
        type: "cta",
        title: draft.title,
        body: draft.body,
        href: draft.href,
        label: draft.label,
      };
    case "testimonial_highlights":
      return {
        type: "testimonial_highlights",
        title: draft.title,
        description: draft.description || undefined,
        audience: draft.audience,
        limit: limitFromText(draft.limitText),
        includeVideo: draft.includeVideo,
        linkLabel: draft.linkLabel || undefined,
        linkHref: draft.linkHref || undefined,
      };
    case "testimonial_tags":
      return draft.section;
    case "locked":
      return draft.section;
  }
}

const DEFAULT_AUDIENCE_BY_SLUG: Record<string, TestimonialAudience> = {
  home: "home",
  certification: "certification",
  "our-services": "organizations",
  "become-an-affiliate": "affiliate",
};

function emptyDraft(kind: AddableKind, slug = ""): SectionDraft {
  switch (kind) {
    case "testimonial_highlights":
      return {
        kind,
        title: "What our clients say",
        description: "",
        audience: DEFAULT_AUDIENCE_BY_SLUG[slug] ?? "home",
        limitText: "3",
        includeVideo: false,
        linkLabel: "",
        linkHref: "",
      };
    case "prose":
      return { kind, title: "", paragraphsText: "", bulletsText: "" };
    case "media_prose":
      return {
        kind,
        title: "",
        paragraphsText: "",
        bulletsText: "",
        image: "",
        imageAlt: "",
        caption: "",
        imagePosition: "left",
      };
    case "timeline":
      return { kind, title: "", items: [{ year: "", title: "", body: "" }] };
    case "cta":
      return { kind, title: "", body: "", href: "", label: "" };
  }
}

export function PageContentEditor({
  slug,
  initialTitle,
  initialPublished,
  initialBody,
  testimonials = [],
}: PageContentEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [published, setPublished] = useState(initialPublished);
  const [heroIntro, setHeroIntro] = useState(initialBody.heroIntro);
  const [metrics, setMetrics] = useState<MetricItem[]>(initialBody.metrics);
  const [sections, setSections] = useState<SectionDraft[]>(
    initialBody.sections.map(toDraft),
  );
  const [newSectionKind, setNewSectionKind] = useState<AddableKind>("prose");
  const addableKinds = (Object.keys(SECTION_LABELS) as AddableKind[]).filter(
    (kind) =>
      kind !== "testimonial_highlights" || isTestimonialHighlightsSupported(slug),
  );
  const [saveState, setSaveState] = useState<WorkbenchSaveState>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function markDirty() {
    setSaveState("dirty");
    setError(null);
  }

  function updateSection(index: number, next: SectionDraft) {
    setSections((current) =>
      current.map((section, i) => (i === index ? next : section)),
    );
    markDirty();
  }

  function moveSection(index: number, direction: -1 | 1) {
    setSections((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) {
        return current;
      }
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    markDirty();
  }

  function removeSection(index: number) {
    setSections((current) => current.filter((_, i) => i !== index));
    markDirty();
  }

  const previewSections = useMemo(() => sections.map(fromDraft), [sections]);

  function save() {
    startTransition(async () => {
      setSaveState("saving");
      const result = await saveGlobalPageAction({
        slug,
        title,
        published,
        body: { heroIntro, metrics, sections: previewSections },
      });
      if (result.ok) {
        setSaveState("saved");
        setLastSavedAt(result.savedAt);
        setError(null);
      } else {
        setSaveState("error");
        setError(result.error);
      }
    });
  }

  const editPane = (
    <div className="space-y-5">
      {error ? <div className="account-flash is-error">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="field-shell">
          <span className="field-label">Page title</span>
          <input
            className="field-input"
            onChange={(event) => {
              setTitle(event.target.value);
              markDirty();
            }}
            value={title}
          />
        </label>
        <label className="coach-checkbox self-end">
          <input
            checked={published}
            onChange={(event) => {
              setPublished(event.target.checked);
              markDirty();
            }}
            type="checkbox"
          />
          Visible on the public site
        </label>
      </div>

      <label className="field-shell">
        <span className="field-label">Intro (shown under the page title)</span>
        <textarea
          className="field-textarea min-h-[90px]"
          onChange={(event) => {
            setHeroIntro(event.target.value);
            markDirty();
          }}
          value={heroIntro}
        />
      </label>

      <div className="space-y-2">
        <span className="field-label">Quick facts (label + value)</span>
        {metrics.map((metric, index) => (
          <div className="flex flex-wrap items-center gap-2" key={index}>
            <input
              className="field-input min-w-[160px] flex-1"
              onChange={(event) => {
                setMetrics((current) =>
                  current.map((m, i) =>
                    i === index ? { ...m, label: event.target.value } : m,
                  ),
                );
                markDirty();
              }}
              placeholder="Label"
              value={metric.label}
            />
            <input
              className="field-input min-w-[140px] flex-1"
              onChange={(event) => {
                setMetrics((current) =>
                  current.map((m, i) =>
                    i === index ? { ...m, value: event.target.value } : m,
                  ),
                );
                markDirty();
              }}
              placeholder="Value"
              value={metric.value}
            />
            <button
              className="button-link ghost"
              onClick={() => {
                setMetrics((current) => current.filter((_, i) => i !== index));
                markDirty();
              }}
              type="button"
            >
              Remove
            </button>
          </div>
        ))}
        <button
          className="button-link secondary"
          onClick={() => {
            setMetrics((current) => [...current, { label: "", value: "" }]);
            markDirty();
          }}
          type="button"
        >
          Add a quick fact
        </button>
      </div>

      {sections.map((draft, index) => (
        <section
          className="rounded-[1.4rem] border border-line/70 bg-white/55 p-4"
          key={index}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground/55">
              {draft.kind === "locked"
                ? "Managed section"
                : draft.kind === "testimonial_tags"
                  ? "Client quote tags"
                  : SECTION_LABELS[draft.kind]}
            </span>
            {draft.kind === "testimonial_tags" ? null : (
            <span className="flex items-center gap-1">
              <button
                aria-label="Move section up"
                className="button-link ghost"
                disabled={index === 0}
                onClick={() => moveSection(index, -1)}
                type="button"
              >
                ↑
              </button>
              <button
                aria-label="Move section down"
                className="button-link ghost"
                disabled={index === sections.length - 1}
                onClick={() => moveSection(index, 1)}
                type="button"
              >
                ↓
              </button>
              <button
                className="button-link ghost"
                onClick={() => removeSection(index)}
                type="button"
              >
                Remove
              </button>
            </span>
            )}
          </div>

          {draft.kind === "testimonial_tags" ? (
            <TagsEditor
              onChange={(next) => updateSection(index, { ...draft, section: next })}
              section={draft.section}
            />
          ) : draft.kind === "locked" ? (
            <p className="mt-3 text-sm text-foreground/60">
              “{"title" in draft.section ? draft.section.title : draft.section.type}”
              can&apos;t be edited here yet. It stays on the page exactly as it
              is now.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              <label className="field-shell">
                <span className="field-label">Heading</span>
                <input
                  className="field-input"
                  onChange={(event) =>
                    updateSection(index, { ...draft, title: event.target.value })
                  }
                  value={draft.title}
                />
              </label>

              {draft.kind === "testimonial_highlights" ? (
                <HighlightsFields
                  draft={draft}
                  onChange={(next) => updateSection(index, next)}
                  testimonials={testimonials}
                />
              ) : null}

              {draft.kind === "prose" || draft.kind === "media_prose" ? (
                <>
                  <label className="field-shell">
                    <span className="field-label">
                      Text (separate paragraphs with a blank line)
                    </span>
                    <textarea
                      className="field-textarea min-h-[120px]"
                      onChange={(event) =>
                        updateSection(index, {
                          ...draft,
                          paragraphsText: event.target.value,
                        })
                      }
                      value={draft.paragraphsText}
                    />
                  </label>
                  <label className="field-shell">
                    <span className="field-label">
                      Bullet points (one per line, optional)
                    </span>
                    <textarea
                      className="field-textarea min-h-[80px]"
                      onChange={(event) =>
                        updateSection(index, {
                          ...draft,
                          bulletsText: event.target.value,
                        })
                      }
                      value={draft.bulletsText}
                    />
                  </label>
                </>
              ) : null}

              {draft.kind === "media_prose" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="field-shell">
                    <span className="field-label">Photo path</span>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        updateSection(index, { ...draft, image: event.target.value })
                      }
                      placeholder="/conferences/photo.jpg"
                      value={draft.image}
                    />
                  </label>
                  <label className="field-shell">
                    <span className="field-label">Photo description</span>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        updateSection(index, {
                          ...draft,
                          imageAlt: event.target.value,
                        })
                      }
                      value={draft.imageAlt}
                    />
                  </label>
                  <label className="field-shell">
                    <span className="field-label">Caption (optional)</span>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        updateSection(index, {
                          ...draft,
                          caption: event.target.value,
                        })
                      }
                      value={draft.caption}
                    />
                  </label>
                  <label className="field-shell">
                    <span className="field-label">Photo side</span>
                    <select
                      className="field-input"
                      onChange={(event) =>
                        updateSection(index, {
                          ...draft,
                          imagePosition:
                            event.target.value === "right" ? "right" : "left",
                        })
                      }
                      value={draft.imagePosition}
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                </div>
              ) : null}

              {draft.kind === "timeline" ? (
                <div className="space-y-3">
                  {draft.items.map((item, itemIndex) => (
                    <div
                      className="rounded-[1rem] border border-line/60 p-3"
                      key={itemIndex}
                    >
                      <div className="grid gap-2 md:grid-cols-[110px_1fr]">
                        <label className="field-shell">
                          <span className="field-label">Year</span>
                          <input
                            className="field-input"
                            onChange={(event) =>
                              updateSection(index, {
                                ...draft,
                                items: draft.items.map((entry, i) =>
                                  i === itemIndex
                                    ? { ...entry, year: event.target.value }
                                    : entry,
                                ),
                              })
                            }
                            value={item.year}
                          />
                        </label>
                        <label className="field-shell">
                          <span className="field-label">Title</span>
                          <input
                            className="field-input"
                            onChange={(event) =>
                              updateSection(index, {
                                ...draft,
                                items: draft.items.map((entry, i) =>
                                  i === itemIndex
                                    ? { ...entry, title: event.target.value }
                                    : entry,
                                ),
                              })
                            }
                            value={item.title}
                          />
                        </label>
                      </div>
                      <label className="field-shell mt-2">
                        <span className="field-label">Description</span>
                        <textarea
                          className="field-textarea min-h-[70px]"
                          onChange={(event) =>
                            updateSection(index, {
                              ...draft,
                              items: draft.items.map((entry, i) =>
                                i === itemIndex
                                  ? { ...entry, body: event.target.value }
                                  : entry,
                              ),
                            })
                          }
                          value={item.body}
                        />
                      </label>
                      <button
                        className="button-link ghost mt-2"
                        onClick={() =>
                          updateSection(index, {
                            ...draft,
                            items: draft.items.filter((_, i) => i !== itemIndex),
                          })
                        }
                        type="button"
                      >
                        Remove entry
                      </button>
                    </div>
                  ))}
                  <button
                    className="button-link secondary"
                    onClick={() =>
                      updateSection(index, {
                        ...draft,
                        items: [...draft.items, { year: "", title: "", body: "" }],
                      })
                    }
                    type="button"
                  >
                    Add an entry
                  </button>
                </div>
              ) : null}

              {draft.kind === "cta" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="field-shell md:col-span-2">
                    <span className="field-label">Text</span>
                    <textarea
                      className="field-textarea min-h-[70px]"
                      onChange={(event) =>
                        updateSection(index, { ...draft, body: event.target.value })
                      }
                      value={draft.body}
                    />
                  </label>
                  <label className="field-shell">
                    <span className="field-label">Link (e.g. /contact)</span>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        updateSection(index, { ...draft, href: event.target.value })
                      }
                      value={draft.href}
                    />
                  </label>
                  <label className="field-shell">
                    <span className="field-label">Button label</span>
                    <input
                      className="field-input"
                      onChange={(event) =>
                        updateSection(index, { ...draft, label: event.target.value })
                      }
                      value={draft.label}
                    />
                  </label>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ))}

      <div className="flex flex-wrap items-center gap-2">
        <label className="field-shell">
          <span className="field-label">Add a section</span>
          <select
            className="field-input"
            onChange={(event) =>
              setNewSectionKind(event.target.value as AddableKind)
            }
            value={newSectionKind}
          >
            {addableKinds.map((kind) => (
              <option key={kind} value={kind}>
                {SECTION_LABELS[kind]}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button-link secondary"
          onClick={() => {
            setSections((current) => [...current, emptyDraft(newSectionKind, slug)]);
            markDirty();
          }}
          type="button"
        >
          Add
        </button>
      </div>
    </div>
  );

  const previewPane = (
    <div className="space-y-8">
      {heroIntro ? (
        <p className="max-w-3xl text-lg leading-8 text-foreground/75">{heroIntro}</p>
      ) : null}
      {metrics.filter((metric) => metric.label && metric.value).length ? (
        <div className="flex flex-wrap gap-3">
          {metrics
            .filter((metric) => metric.label && metric.value)
            .map((metric) => (
              <div
                className="rounded-[1.2rem] border border-line bg-white/70 px-4 py-3"
                key={`${metric.label}-${metric.value}`}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/55">
                  {metric.label}
                </p>
                <p className="font-display text-xl text-teal-deep">{metric.value}</p>
              </div>
            ))}
        </div>
      ) : null}
      {previewSections.map((section) => renderSection(section, { testimonials }))}
    </div>
  );

  return (
    <AdminWorkbench
      actions={
        <button
          className="button-link primary"
          disabled={isPending || saveState === "saving"}
          onClick={save}
          type="button"
        >
          {isPending ? "Saving…" : "Save and publish"}
        </button>
      }
      editLabel="Content"
      editPane={editPane}
      liveHref={slug === "home" ? "/" : `/${slug}`}
      previewHint="This is how the page will look after saving."
      previewPane={previewPane}
      saveStatus={getWorkbenchStatusCopy(saveState, { lastSavedAt })}
      stageLabel={published ? "Visible" : "Hidden"}
      stageTone={published ? "success" : "warning"}
      title={title || "Untitled page"}
    />
  );
}

function limitIsValid(text: string): boolean {
  const n = Number(text);
  return text.trim() !== "" && Number.isInteger(n) && n >= 1 && n <= 6;
}

/** Empty or non-numeric input falls back to the form's default of 3; other values are clamped. */
function limitFromText(text: string): number {
  return text.trim() === "" ? 3 : clampTestimonialLimit(Number(text));
}

function HighlightsFields({
  draft,
  onChange,
  testimonials,
}: {
  draft: Extract<SectionDraft, { kind: "testimonial_highlights" }>;
  onChange: (next: SectionDraft) => void;
  testimonials: TestimonialItem[];
}) {
  const picked = resolveTestimonials(testimonials, {
    audience: draft.audience,
    limit: limitFromText(draft.limitText),
    includeVideo: draft.includeVideo,
  });
  return (
    <div className="space-y-3">
      <label className="field-shell">
        <span className="field-label">Intro text (optional)</span>
        <textarea
          className="field-textarea min-h-[60px]"
          onChange={(event) => onChange({ ...draft, description: event.target.value })}
          value={draft.description}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="field-shell">
          <span className="field-label">Show quotes tagged for</span>
          <select
            className="field-input"
            onChange={(event) =>
              onChange({ ...draft, audience: event.target.value as TestimonialAudience })
            }
            value={draft.audience}
          >
            {TESTIMONIAL_AUDIENCES.map((audience) => (
              <option key={audience} value={audience}>
                {TESTIMONIAL_AUDIENCE_LABELS[audience]}
              </option>
            ))}
          </select>
        </label>
        <label className="field-shell">
          <span className="field-label">How many quotes (1 to 6)</span>
          <input
            className="field-input"
            max={6}
            min={1}
            onChange={(event) => onChange({ ...draft, limitText: event.target.value })}
            type="number"
            value={draft.limitText}
          />
          {limitIsValid(draft.limitText) ? null : (
            <span className="text-sm text-foreground/60">
              Enter a whole number from 1 to 6. Until then, {limitFromText(draft.limitText)}{" "}
              will be used.
            </span>
          )}
        </label>
        <label className="field-shell">
          <span className="field-label">Link text</span>
          <input
            className="field-input"
            onChange={(event) => onChange({ ...draft, linkLabel: event.target.value })}
            placeholder="See all client stories"
            value={draft.linkLabel}
          />
        </label>
        <label className="field-shell">
          <span className="field-label">Link to (a page on this site)</span>
          <input
            className="field-input"
            onChange={(event) => onChange({ ...draft, linkHref: event.target.value })}
            placeholder="/clients"
            value={draft.linkHref}
          />
        </label>
      </div>
      <label className="coach-checkbox">
        <input
          checked={draft.includeVideo}
          onChange={(event) => onChange({ ...draft, includeVideo: event.target.checked })}
          type="checkbox"
        />
        Include video testimonials
      </label>
      <p className="text-sm text-foreground/60">
        {picked.length
          ? `${picked.length} ${picked.length === 1 ? "quote" : "quotes"} will show: ${picked
              .map((item) => item.organization)
              .join(", ")}.`
          : "No quotes are tagged for this page yet, so this section will stay hidden."}{" "}
        Based on the tags currently saved on the{" "}
        <Link
          className="underline"
          href="/admin/global/pages/clients"
          rel="noopener"
          target="_blank"
        >
          Our Clients
        </Link>{" "}
        page.
      </p>
    </div>
  );
}

function TagsEditor({
  section,
  onChange,
}: {
  section: Extract<ContentSection, { type: "testimonial_grid" }>;
  onChange: (next: Extract<ContentSection, { type: "testimonial_grid" }>) => void;
}) {
  function toggle(itemIndex: number, audience: TestimonialAudience, on: boolean) {
    onChange({
      ...section,
      items: section.items.map((item, i) => {
        if (i !== itemIndex) return item;
        const current = new Set(item.audiences ?? []);
        if (on) current.add(audience);
        else current.delete(audience);
        return {
          ...item,
          audiences: TESTIMONIAL_AUDIENCES.filter((a) => current.has(a)),
        };
      }),
    });
  }

  return (
    <div className="mt-3 space-y-3">
      <h3 className="font-semibold text-foreground">Where each client quote appears</h3>
      <div className="flex flex-wrap gap-2">
        {TESTIMONIAL_AUDIENCES.map((audience) => {
          const count = section.items.filter((item) =>
            item.audiences?.includes(audience),
          ).length;
          return (
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                count === 0
                  ? "border-amber-400 bg-amber-50 text-amber-900"
                  : "border-line bg-white/70 text-foreground/70"
              }`}
              key={audience}
            >
              {TESTIMONIAL_AUDIENCE_LABELS[audience]}:{" "}
              {count === 0 ? "none yet" : `${count} ${count === 1 ? "quote" : "quotes"}`}
            </span>
          );
        })}
      </div>
      <p className="text-sm text-foreground/60">
        Tick the pages each quote may appear on. Quotes appear in the order they are
        listed on this page, and the order and wording can&apos;t be changed here.
      </p>
      {section.items.map((item, itemIndex) => {
        const text = item.quote ?? "";
        return (
          <fieldset
            className="rounded-[1rem] border border-line/60 p-3"
            key={`${item.organization}-${item.name}-${itemIndex}`}
          >
            <legend className="sr-only">
              Pages for {item.organization}
              {item.name ? ` — ${item.name}` : ""}
            </legend>
            <p className="text-sm font-semibold">
              {item.organization}
              {item.name ? ` — ${item.name}` : ""}
              {item.role ? `, ${item.role}` : ""}
              {item.videoUrl && !item.quote ? (
                <span className="ml-2 rounded-full bg-white/80 px-2 py-0.5 text-xs">
                  Video
                </span>
              ) : null}
            </p>
            {text ? (
              <p className="mt-1 text-sm text-foreground/65" title={text}>
                {text.length > 140 ? `${text.slice(0, 140)}…` : text}
              </p>
            ) : null}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {TESTIMONIAL_AUDIENCES.map((audience) => (
                <label className="coach-checkbox" key={audience}>
                  <input
                    checked={item.audiences?.includes(audience) ?? false}
                    onChange={(event) => toggle(itemIndex, audience, event.target.checked)}
                    type="checkbox"
                  />
                  {TESTIMONIAL_AUDIENCE_LABELS[audience]}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
