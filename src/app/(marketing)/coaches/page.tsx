import { redirect } from "next/navigation";
import { COACH_DIRECTORY_URL } from "@/lib/routing";

/**
 * The browseable roster lives on the official WIAL directory. This route only
 * forwards old links and bookmarks; coach profile pages (`/coaches/<slug>`) stay.
 */
export default function CoachesDirectoryPage() {
  redirect(COACH_DIRECTORY_URL);
}
