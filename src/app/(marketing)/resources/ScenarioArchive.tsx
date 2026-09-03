"use client";

import { useMemo, useState } from "react";
import type { WialTalkScenario } from "@/lib/types";

const PAGE_SIZE = 9;

type ScenarioArchiveProps = {
  scenarios: WialTalkScenario[];
};

function year(date: string) {
  return date.slice(0, 4);
}

export function ScenarioArchive({ scenarios }: ScenarioArchiveProps) {
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return scenarios;
    }
    return scenarios.filter(
      (scenario) =>
        scenario.title.toLowerCase().includes(needle) ||
        scenario.prompt.toLowerCase().includes(needle),
    );
  }, [query, scenarios]);

  const shown = filtered.slice(0, visible);
  const firstYear = scenarios.reduce(
    (earliest, scenario) => (scenario.firstPostedOn < earliest ? scenario.firstPostedOn : earliest),
    scenarios[0]?.firstPostedOn ?? "",
  );

  return (
    <section className="section-stack" id="wial-talk">
      <div className="space-y-4">
        <h2 className="section-title text-teal-deep">WIAL Talk coaching scenarios</h2>
        <p className="max-w-3xl text-base leading-7 text-foreground/75">
          Since {year(firstYear)}, WIAL Talk has posed a weekly scenario to the
          coaching community. Each one asks the same question: as an Action
          Learning coach, how would you handle the following situation? Use them
          to rehearse interventions, warm up a practice group, or reflect after a
          session.
        </p>
      </div>

      <div className="site-panel rounded-[2rem] p-5 md:p-6">
        <label className="field-shell">
          <span className="field-label">Search the scenarios</span>
          <input
            className="field-input"
            onChange={(event) => {
              setQuery(event.target.value);
              setVisible(PAGE_SIZE);
            }}
            placeholder="Try “silence”, “norms”, or “problem presenter”"
            type="search"
            value={query}
          />
        </label>
        <p className="mt-3 text-sm text-foreground/60">
          {filtered.length === scenarios.length
            ? `${scenarios.length} scenarios, newest first`
            : `${filtered.length} of ${scenarios.length} scenarios`}
        </p>
      </div>

      {shown.length === 0 ? (
        <p className="text-base text-foreground/70">No scenario mentions that yet.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((scenario) => (
            <article className="feature-card flex flex-col rounded-[1.5rem]" key={scenario.slug}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-green">
                Scenario · {year(scenario.lastPostedOn)}
              </p>
              <h3 className="mt-3">{scenario.title}</h3>
              <p className="mt-3 text-sm">{scenario.prompt}</p>
              <p className="mt-auto pt-4 text-xs text-foreground/55">
                {scenario.timesPosted > 1
                  ? `Posted ${scenario.timesPosted} times since ${year(scenario.firstPostedOn)}`
                  : `Posted in ${year(scenario.firstPostedOn)}`}
              </p>
            </article>
          ))}
        </div>
      )}

      {filtered.length > shown.length ? (
        <div>
          <button
            className="button-link secondary"
            onClick={() => setVisible((count) => count + PAGE_SIZE * 2)}
            type="button"
          >
            Show more ({filtered.length - shown.length} remaining)
          </button>
        </div>
      ) : null}
    </section>
  );
}
