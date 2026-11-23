import { CoachCard } from "@/app/(marketing)/coaches/CoachCard";
import { COACH_DIRECTORY_URL } from "@/lib/routing";
import type { CoachRecord } from "@/lib/types";

export function FeaturedCoaches({ coaches }: { coaches: CoachRecord[] }) {
  return (
    <section className="site-panel rounded-[2rem] p-6 md:p-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Featured coaches</p>
          <h2 className="mt-3 font-display text-3xl text-teal-deep">
            Affiliate coach roster
          </h2>
        </div>
        <a className="button-link secondary" href={COACH_DIRECTORY_URL} rel="noreferrer" target="_blank">
          View directory
        </a>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {coaches.length ? (
          coaches.map((coach) => <CoachCard coach={coach} key={coach.id} />)
        ) : (
          <article className="feature-card rounded-[1.35rem]">
            <p className="text-base leading-7 text-foreground/72">
              Approved coaches for this affiliate will appear here once their directory profiles are live.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}
