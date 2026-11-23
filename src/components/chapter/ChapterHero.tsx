import Link from "next/link";
import { COACH_DIRECTORY_URL } from "@/lib/routing";
import type { ChapterRecord } from "@/lib/types";

export function ChapterHero({ chapter }: { chapter: ChapterRecord }) {
  return (
    <section className="site-panel rounded-[2rem] p-7 md:p-10">
      <span className="eyebrow">WIAL affiliate</span>
      <div className="mt-5 space-y-4">
        <h1 className="max-w-4xl font-display text-3xl leading-none tracking-[-0.05em] text-teal-deep md:text-5xl">
          {chapter.name}
        </h1>
        <p className="max-w-3xl text-lg leading-8 text-foreground/82">
          {chapter.description ??
            `Explore ${chapter.name}'s coaching network, events, and Action Learning programming.`}
        </p>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <a className="button-link primary" href={COACH_DIRECTORY_URL} rel="noreferrer" target="_blank">
          Find a coach
        </a>
        <Link className="button-link secondary" href="/certification">
          Get certified
        </Link>
      </div>
    </section>
  );
}
