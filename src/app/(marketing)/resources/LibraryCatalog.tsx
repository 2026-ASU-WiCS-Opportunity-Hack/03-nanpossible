"use client";

import { useMemo, useState } from "react";
import type { LibraryKind } from "@/lib/types";

export type LibraryCard = {
  slug: string;
  kind: LibraryKind;
  kindLabel: string;
  title: string;
  summary: string | null;
  year: string;
  href: string;
  actionLabel: string;
  thumbnailUrl: string | null;
};

type FilterKey = "all" | "article" | "book" | "media" | "visual";

const FILTERS: { key: FilterKey; label: string; kinds: LibraryKind[] | null }[] = [
  { key: "all", label: "Everything", kinds: null },
  { key: "article", label: "Articles & case studies", kinds: ["article"] },
  { key: "book", label: "Books", kinds: ["book"] },
  { key: "media", label: "Videos & podcasts", kinds: ["video", "podcast"] },
  { key: "visual", label: "Posters & infographics", kinds: ["poster", "infographic"] },
];

const PAGE_SIZE = 12;

type LibraryCatalogProps = {
  items: LibraryCard[];
};

export function LibraryCatalog({ items }: LibraryCatalogProps) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const kinds = FILTERS.find((entry) => entry.key === filter)?.kinds ?? null;
    const needle = query.trim().toLowerCase();
    return items.filter((item) => {
      if (kinds && !kinds.includes(item.kind)) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return (
        item.title.toLowerCase().includes(needle) ||
        (item.summary?.toLowerCase().includes(needle) ?? false)
      );
    });
  }, [filter, items, query]);

  const shown = filtered.slice(0, visible);

  function changeFilter(next: FilterKey) {
    setFilter(next);
    setVisible(PAGE_SIZE);
  }

  return (
    <section className="section-stack" id="library">
      <div className="space-y-4">
        <h2 className="section-title text-teal-deep">Library</h2>
        <p className="max-w-3xl text-base leading-7 text-foreground/75">
          Case studies, articles, books, videos, podcasts, and posters published
          by WIAL coaches and affiliates around the world. Filter by type or
          search for a topic, organization, or author.
        </p>
      </div>

      <div className="site-panel rounded-[2rem] p-5 md:p-6">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter the library">
          {FILTERS.map((entry) => {
            const active = entry.key === filter;
            return (
              <button
                aria-pressed={active}
                className={
                  active
                    ? "rounded-full border border-teal-deep bg-teal-deep px-4 py-2 text-sm font-semibold text-white"
                    : "rounded-full border border-line bg-white/70 px-4 py-2 text-sm font-semibold text-foreground/70 transition hover:border-green hover:text-teal-deep"
                }
                key={entry.key}
                onClick={() => changeFilter(entry.key)}
                type="button"
              >
                {entry.label}
              </button>
            );
          })}
        </div>
        <label className="field-shell mt-4">
          <span className="field-label">Search the library</span>
          <input
            className="field-input"
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Try “psychological safety”, “university”, or “Marquardt”"
            type="search"
            value={query}
          />
        </label>
        <p className="mt-3 text-sm text-foreground/60">
          {filtered.length === items.length
            ? `${items.length} resources`
            : `${filtered.length} of ${items.length} resources`}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="text-base text-foreground/70">
          Nothing matches that search yet. Try a broader term or a different type.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((item) => (
            <article className="feature-card flex flex-col rounded-[1.5rem]" key={item.slug}>
              {item.thumbnailUrl ? (
                <div className="mb-4 overflow-hidden rounded-[1rem] border border-line bg-white/70">
                  <img
                    alt=""
                    className={
                      item.kind === "article" || item.kind === "video"
                        ? "h-40 w-full object-cover"
                        : "h-48 w-full object-contain p-3"
                    }
                    loading="lazy"
                    src={item.thumbnailUrl}
                  />
                </div>
              ) : null}
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green">
                {item.kindLabel}
                {item.year ? ` · ${item.year}` : ""}
              </p>
              <h3 className="mt-3">{item.title}</h3>
              {item.summary ? (
                <p className="mt-3 line-clamp-4 text-sm">{item.summary}</p>
              ) : null}
              <a
                className="mt-auto inline-flex pt-5 font-semibold text-teal"
                href={item.href}
                rel="noreferrer"
                target="_blank"
              >
                {item.actionLabel}
              </a>
            </article>
          ))}
        </div>
      )}

      {filtered.length > shown.length ? (
        <div>
          <button
            className="button-link secondary"
            onClick={() => setVisible((count) => count + PAGE_SIZE)}
            type="button"
          >
            Show more ({filtered.length - shown.length} remaining)
          </button>
        </div>
      ) : null}
    </section>
  );
}
