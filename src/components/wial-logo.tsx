import Link from "next/link";
import Image from "next/image";

type WialLogoProps = {
  chapterLabel?: string | null;
};

export function WialLogo({ chapterLabel }: WialLogoProps) {
  return (
    <Link className="inline-flex items-center gap-3" href="/">
      <Image
        src="/WIAL.webp"
        alt="WIAL Logo"
        width={140}
        height={50}
        priority
        className="h-12 w-auto object-contain"
      />
      {chapterLabel ? (
        <span className="flex flex-col ml-2 border-l border-line pl-3">
          <span className="text-[0.8rem] font-semibold uppercase tracking-[0.15em] text-accent">
            {chapterLabel}
          </span>
        </span>
      ) : null}
    </Link>
  );
}
