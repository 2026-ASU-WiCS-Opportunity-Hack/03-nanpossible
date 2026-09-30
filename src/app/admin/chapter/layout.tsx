import { AffiliateWorkspaceNotice } from "@/components/admin/AffiliateWorkspaceNotice";
import { ChapterProvider } from "@/components/providers/ChapterProvider";
import { requireAccountViewer } from "@/lib/auth";
import { resolveWorkspaceAccess } from "@/lib/chapter-workspace";

export default async function ChapterAdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const viewer = await requireAccountViewer("/admin/chapter", [
    "platform_admin",
    "chapter_admin",
    "content_creator",
  ]);
  const access = await resolveWorkspaceAccess(viewer);

  if (!access.chapter) {
    return <AffiliateWorkspaceNotice gap={access.gap} viewerEmail={viewer.email} />;
  }

  const chapter = access.chapter;

  return (
    <ChapterProvider
      value={{
        id: chapter.id,
        subdomain: chapter.subdomain,
        name: chapter.name,
        language: chapter.language,
      }}
    >
      <>{children}</>
    </ChapterProvider>
  );
}
