"use client";

import Link from "next/link";

type AdminWorkbenchProps = {
  actions: React.ReactNode;
  editLabel?: string;
  editPane: React.ReactNode;
  liveHref?: string;
  previewHint?: string;
  previewLabel?: string;
  previewPane: React.ReactNode;
  rail?: React.ReactNode;
  saveStatus: {
    label: string;
    tone: "neutral" | "success" | "warning" | "error";
  };
  stageLabel: string;
  stageTone?: "neutral" | "success" | "warning";
  title: string;
};

function getStatusClassName(
  tone: "neutral" | "success" | "warning" | "error" | undefined,
) {
  switch (tone) {
    case "success":
      return "border-[rgba(22,95,88,0.14)] bg-[rgba(22,95,88,0.08)] text-teal-deep";
    case "warning":
      return "border-[rgba(181,163,0,0.2)] bg-[rgba(181,163,0,0.1)] text-[#6f5e00]";
    case "error":
      return "border-[rgba(180,83,9,0.18)] bg-[rgba(180,83,9,0.1)] text-[#92400e]";
    default:
      return "border-line/80 bg-white/70 text-foreground/62";
  }
}

export function AdminWorkbench({
  actions,
  editLabel = "Editor",
  editPane,
  liveHref,
  previewHint,
  previewLabel = "Preview",
  previewPane,
  rail,
  saveStatus,
  stageLabel,
  stageTone = "neutral",
  title,
}: AdminWorkbenchProps) {
  return (
    <section className="site-panel overflow-hidden rounded-[2rem]">
      <div className="border-b border-line/80 bg-[rgba(255,252,248,0.97)] px-5 py-4 md:px-7">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <h2 className="min-w-0 max-w-full truncate font-display text-2xl tracking-[-0.04em] text-teal-deep">
              {title}
            </h2>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] ${getStatusClassName(stageTone)}`}
            >
              {stageLabel}
            </span>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.14em] ${getStatusClassName(saveStatus.tone)}`}
            >
              {saveStatus.label}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {liveHref ? (
              <Link className="button-link ghost" href={liveHref} target="_blank">
                Open live page
              </Link>
            ) : null}
            {actions}
          </div>
        </div>
      </div>

      <div className={rail ? "grid lg:grid-cols-[260px_minmax(0,1fr)]" : ""}>
        {rail ? (
          <aside className="border-b border-line/70 bg-[rgba(255,252,248,0.56)] lg:border-b-0 lg:border-r">
            {rail}
          </aside>
        ) : null}

        <div className="min-w-0">
          <section>
            <div className="px-5 pt-5 md:px-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/42">
                {editLabel}
              </p>
            </div>
            <div className="px-5 py-5 md:px-7 md:pb-7">{editPane}</div>
          </section>

          <section className="border-t border-line/70 bg-[linear-gradient(180deg,rgba(252,249,244,0.78),rgba(249,246,241,0.62))]">
            <div className="px-5 pt-5 md:px-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/42">
                {previewLabel}
              </p>
              {previewHint ? (
                <p className="mt-1.5 text-sm leading-6 text-foreground/58">
                  {previewHint}
                </p>
              ) : null}
            </div>
            <div className="px-5 py-5 md:px-7 md:pb-7">{previewPane}</div>
          </section>
        </div>
      </div>
    </section>
  );
}
