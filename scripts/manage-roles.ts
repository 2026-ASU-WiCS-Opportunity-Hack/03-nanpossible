import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type Role = "platform_admin" | "chapter_admin" | "content_creator" | "coach" | "public_visitor";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  chapter_id: string | null;
  assigned_chapters: string[] | null;
};

type ChapterRow = {
  id: string;
  name: string;
  subdomain: string;
  status: string;
};

const validRoles: Role[] = [
  "platform_admin",
  "chapter_admin",
  "content_creator",
  "coach",
  "public_visitor",
];

function isRole(value: string): value is Role {
  return (validRoles as string[]).includes(value);
}

function parseIndexes(answer: string, max: number) {
  const indexes = answer
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => Number.parseInt(part, 10));

  if (!indexes.length || indexes.some((index) => Number.isNaN(index) || index < 0 || index >= max)) {
    return null;
  }

  return Array.from(new Set(indexes));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const rl = readline.createInterface({ input, output });

  try {
    console.log("\n--- Fetching users and affiliates ---");
    const [usersResult, chaptersResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, email, name, role, chapter_id, assigned_chapters")
        .order("email"),
      supabase.from("chapters").select("id, name, subdomain, status").order("name"),
    ]);

    if (usersResult.error) {
      console.error("Error fetching users:", usersResult.error.message);
      process.exit(1);
    }

    if (chaptersResult.error) {
      console.error("Error fetching affiliates:", chaptersResult.error.message);
      process.exit(1);
    }

    const users = (usersResult.data ?? []) as UserRow[];
    const chapters = (chaptersResult.data ?? []) as ChapterRow[];
    const activeChapters = chapters.filter((chapter) => chapter.status === "active");
    const chapterLabel = (chapterId: string | null) => {
      if (!chapterId) return "none";
      const chapter = chapters.find((candidate) => candidate.id === chapterId);
      return chapter ? `${chapter.name}${chapter.status !== "active" ? ` (${chapter.status})` : ""}` : `unknown (${chapterId})`;
    };

    if (!users.length) {
      console.log("No users found.");
      process.exit(0);
    }

    console.log("\n[index] email (name) - role - affiliate");
    console.log("----------------------------------------");
    users.forEach((user, index) => {
      const stranded = user.role === "chapter_admin" && !user.chapter_id;
      console.log(
        `[${index}] ${user.email} (${user.name || "No Name"}) - ${user.role} - affiliate: ${chapterLabel(user.chapter_id)}${stranded ? "  <-- NEEDS AN AFFILIATE" : ""}`,
      );
    });

    const indexStr = await rl.question("\nEnter the index of the user to update (or 'q' to quit): ");
    if (indexStr.trim().toLowerCase() === "q") process.exit(0);

    const selectedUser = users[Number.parseInt(indexStr, 10)];

    if (!selectedUser) {
      console.log("Invalid index.");
      process.exit(1);
    }

    console.log(
      `\nSelected: ${selectedUser.email} (role: ${selectedUser.role}, affiliate: ${chapterLabel(selectedUser.chapter_id)})`,
    );
    console.log(`Available roles: ${validRoles.join(", ")}`);
    const nextRoleInput = (await rl.question("Enter new role (Enter keeps the current role): ")).trim();
    const nextRole = nextRoleInput === "" ? selectedUser.role : nextRoleInput;

    if (!isRole(nextRole)) {
      console.log(`Invalid role. Must be one of: ${validRoles.join(", ")}`);
      process.exit(1);
    }

    let chapterId: string | null = selectedUser.chapter_id;
    let assignedChapters: string[] = selectedUser.assigned_chapters ?? [];

    if (nextRole === "chapter_admin" || nextRole === "coach") {
      if (nextRole === "chapter_admin" && !activeChapters.length) {
        console.log("No active affiliates exist yet. Create one before assigning an affiliate head.");
        process.exit(1);
      }

      console.log("\nActive affiliates:");
      activeChapters.forEach((chapter, index) => {
        console.log(`[${index}] ${chapter.name} (${chapter.subdomain})`);
      });

      const currentIndex = activeChapters.findIndex((chapter) => chapter.id === chapterId);
      const keepHint =
        currentIndex >= 0 ? ` (Enter keeps ${activeChapters[currentIndex].name})` : "";
      const prompt =
        nextRole === "chapter_admin"
          ? `Affiliate heads must be linked to an affiliate. Enter the affiliate index${keepHint}: `
          : `Enter the coach's primary affiliate index${keepHint || " (Enter for none)"}: `;
      const answer = (await rl.question(prompt)).trim();

      if (answer === "") {
        if (nextRole === "chapter_admin" && currentIndex < 0) {
          console.log("An affiliate is required for affiliate heads. Aborted.");
          process.exit(1);
        }

        chapterId = currentIndex >= 0 ? activeChapters[currentIndex].id : null;
      } else {
        const picked = activeChapters[Number.parseInt(answer, 10)];

        if (!picked) {
          console.log("Invalid affiliate index.");
          process.exit(1);
        }

        chapterId = picked.id;
      }

      assignedChapters = [];
    } else if (nextRole === "content_creator") {
      if (!activeChapters.length) {
        console.log("No active affiliates exist yet. Create one before assigning a content creator.");
        process.exit(1);
      }

      console.log("\nActive affiliates:");
      activeChapters.forEach((chapter, index) => {
        console.log(`[${index}] ${chapter.name} (${chapter.subdomain})`);
      });

      const answer = (await rl.question(
        "Content creators need at least one affiliate. Enter affiliate indexes, comma-separated: ",
      )).trim();
      const indexes = parseIndexes(answer, activeChapters.length);

      if (!indexes) {
        console.log("Invalid affiliate indexes.");
        process.exit(1);
      }

      chapterId = null;
      assignedChapters = indexes.map((index) => activeChapters[index].id);
    } else {
      chapterId = null;
      assignedChapters = [];
    }

    const summary =
      nextRole === "content_creator"
        ? `assigned affiliates: ${assignedChapters.map((id) => chapterLabel(id)).join(", ")}`
        : `affiliate: ${chapterLabel(chapterId)}`;
    const confirm = await rl.question(
      `\nSet ${selectedUser.email} to '${nextRole}' (${summary})? (y/n): `,
    );

    if (confirm.trim().toLowerCase() !== "y") {
      console.log("Aborted.");
      process.exit(0);
    }

    // 1. public.users first: the DB trigger enforces "affiliate heads need an
    //    affiliate" and its message is the useful one if something is off.
    const { error: updateError } = await supabase
      .from("users")
      .update({ role: nextRole, chapter_id: chapterId, assigned_chapters: assignedChapters })
      .eq("id", selectedUser.id);

    if (updateError) {
      console.error(`\nFailed to update public.users: ${updateError.message}`);
      if (updateError.hint) console.error(`Hint: ${updateError.hint}`);
      process.exit(1);
    }

    // 2. auth.users app_metadata — the same three keys the app writes
    //    (syncUserAccess) so the JWT, RLS, and the public row agree.
    const { error: authError } = await supabase.auth.admin.updateUserById(selectedUser.id, {
      app_metadata: {
        role: nextRole,
        chapter_id: chapterId,
        assigned_chapters: assignedChapters,
      },
    });

    if (authError) {
      console.warn("Updated public.users, but failed to update auth metadata:", authError.message);
    }

    console.log(`\nDone: ${selectedUser.email} is now '${nextRole}' (${summary}).`);
    console.log("The user should sign out and back in for the change to take effect.");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("\nAn error occurred:", message);
  } finally {
    rl.close();
  }
}

main();
