import type { TestimonialItem } from "@/lib/types";

/** One testimonial card, shared by the /clients grid and the highlights sections. */
export function TestimonialCard({ item }: { item: TestimonialItem }) {
  return (
    <article className="feature-card feature-card--flat flex flex-col gap-4 rounded-[1.5rem]">
      {item.videoUrl ? (
        <div className="overflow-hidden rounded-[1rem] border border-line">
          <iframe
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="aspect-video w-full"
            loading="lazy"
            src={item.videoUrl}
            title={item.videoTitle ?? `${item.organization} video testimonial`}
          />
        </div>
      ) : null}
      {item.context ? <p className="text-sm text-foreground/70">{item.context}</p> : null}
      {item.quote ? (
        <blockquote className="text-base leading-7 text-foreground/85">
          “{item.quote}”
        </blockquote>
      ) : null}
      <footer className="mt-auto flex items-center gap-3">
        {item.logo ? (
          <img
            alt={`${item.organization} logo`}
            className="h-8 w-auto max-w-[7rem] shrink-0 object-contain"
            src={item.logo}
          />
        ) : null}
        <div>
          <p className="text-sm font-semibold">{item.name}</p>
          <p className="text-xs text-foreground/60">
            {item.role ? `${item.role}, ` : ""}
            {item.organization}
          </p>
        </div>
      </footer>
    </article>
  );
}
