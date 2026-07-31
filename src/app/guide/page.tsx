import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { Metadata } from "next";
import { BackButton } from "@/components/back-button";

export const metadata: Metadata = {
  title: "Platform Guide",
  description:
    "Documentation for administrators, chapter leads, coaches, and other WIAL platform users.",
};

function extractGuidePart(source: string, pattern: RegExp, label: string) {
  const match = source.match(pattern);

  if (!match?.[1]) {
    throw new Error(`Unable to read platform guide ${label}.`);
  }

  return match[1];
}

export default async function GuidePage() {
  const source = await readFile(
    join(process.cwd(), "src/content/platform-guide.html"),
    "utf8",
  );
  const styles = extractGuidePart(
    source,
    /<style>([\s\S]*?)<\/style>/i,
    "styles",
  );
  const content = extractGuidePart(
    source,
    /<body>([\s\S]*?)<\/body>/i,
    "content",
  );

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `@scope (.platform-guide) { ${styles} }`,
        }}
      />
      <div className="platform-guide">
        <div className="site-shell pt-5">
          <BackButton />
        </div>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </>
  );
}
