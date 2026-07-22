"use client";

import { useMemo, useState } from "react";
import type { AdminUserRecord, AppRole, ChapterRecord } from "@/lib/types";

type UserRoleManagerProps = {
  action: (formData: FormData) => void | Promise<void>;
  chapters: Array<Pick<ChapterRecord, "id" | "name" | "status">>;
  currentUserId: string;
  users: AdminUserRecord[];
};

const roleOptions: Array<{ value: AppRole; label: string }> = [
  { value: "platform_admin", label: "Platform admin" },
  { value: "chapter_admin", label: "Chapter head" },
  { value: "content_creator", label: "Content creator" },
  { value: "coach", label: "Coach" },
  { value: "public_visitor", label: "Public visitor" },
];


function getRoleLabel(role: AppRole) {
  return roleOptions.find((option) => option.value === role)?.label ?? role;
}

function getRolePillClass(role: AppRole) {
  switch (role) {
    case "platform_admin":
      return "bg-[#fdecec] text-[#9f3a33]";
    case "chapter_admin":
      return "bg-[rgba(70,111,176,0.12)] text-[#466fb0]";
    case "coach":
      return "bg-[rgba(80,143,96,0.12)] text-[#508f60]";
    case "content_creator":
      return "bg-[rgba(176,139,38,0.12)] text-[#8f711f]";
    case "public_visitor":
    default:
      return "bg-[#f2f0ec] text-[#716b62]";
  }
}

function formatAccessSummary(options: {
  assignedChapters: string[];
  chapterId: string;
  chapters: UserRoleManagerProps["chapters"];
  role: AppRole;
}) {
  if (options.role === "content_creator") {
    const assignedNames = options.assignedChapters
      .map((chapterId) => options.chapters.find((chapter) => chapter.id === chapterId)?.name)
      .filter((value): value is string => Boolean(value));

    return assignedNames.length
      ? `Assigned chapters: ${assignedNames.join(", ")}`
      : "Assigned chapters: none";
  }

  if (options.chapterId) {
    const chapterName = options.chapters.find((chapter) => chapter.id === options.chapterId)?.name;

    if (chapterName) {
      return `Primary chapter: ${chapterName}`;
    }
  }

  return "Global access only";
}

function getAccessType(user: AdminUserRecord) {
  if (user.assignedChapters.length) return "assigned";
  if (user.chapterId) return "chapter";
  return "global";
}

export function UserRoleManager({
  action,
  chapters,
  currentUserId,
  users,
}: UserRoleManagerProps) {
  const [roleFilter, setRoleFilter] = useState<"all" | AppRole>("all");
  const [accessFilter, setAccessFilter] = useState<"all" | "global" | "chapter" | "assigned">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.name.toLowerCase().includes(normalizedSearch) ||
        user.email.toLowerCase().includes(normalizedSearch);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesAccess = accessFilter === "all" || getAccessType(user) === accessFilter;

      return matchesSearch && matchesRole && matchesAccess;
    });
  }, [accessFilter, roleFilter, searchTerm, users]);

  if (!users.length) {
    return (
      <section className="site-panel rounded-[2rem] px-6 py-12 text-center">
        <p className="text-lg font-semibold text-teal-deep">No users are available to manage yet.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-[1.35rem] border border-line/70 bg-white/85">
      <div className="grid gap-3 border-b border-line/70 bg-[rgba(255,250,242,0.62)] p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <label className="sr-only" htmlFor="user-search">
          Search users
        </label>
        <input
          className="h-12 rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none placeholder:text-foreground placeholder:opacity-100"          
          id="user-search"
          onChange={(event) => {
            setSearchTerm(event.target.value);
          }}
          placeholder="Search users"
          value={searchTerm}
        />

        <label className="sr-only" htmlFor="role-filter">
          Filter by role
        </label>
        <select
          className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none"
          id="role-filter"
          onChange={(event) => {
            setRoleFilter(event.target.value as "all" | AppRole);
          }}
          value={roleFilter}
        >
          <option value="all">All roles</option>
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="access-filter">
          Filter by access
        </label>
        <select
          className="rounded-xl border border-white/10 bg-white px-4 py-3 text-sm font-semibold text-foreground outline-none"
          id="access-filter"
          onChange={(event) => {
            setAccessFilter(event.target.value as "all" | "global" | "chapter" | "assigned");
          }}
          value={accessFilter}
        >
          <option value="all">All access</option>
          <option value="global">Global access</option>
          <option value="chapter">Primary chapter</option>
          <option value="assigned">Assigned chapters</option>
        </select>
      </div>

      <div className="border-b border-line/70 px-4 py-3 text-sm font-semibold text-foreground/60">
        {users.length} users&nbsp;&nbsp;&nbsp; {filteredUsers.length} shown
      </div>

      <div className="grid grid-cols-[minmax(0,2.05fr)_minmax(0,1.6fr)_minmax(5rem,0.5fr)_minmax(4rem,0.4fr)] gap-2 border-b border-line/70 bg-[rgba(255,250,242,0.58)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-foreground/50">
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
        <span>Action</span>
        
      </div>

      <div className="divide-y divide-line/70">
        {filteredUsers.map((user) => (
          <UserRoleRow
            action={action}
            chapters={chapters}
            currentUserId={currentUserId}
            key={user.id}
            user={user}
          />
        ))}
      </div>
    </section>
  );
}

function UserRoleRow({
  action,
  chapters,
  currentUserId,
  user,
}: {
  action: UserRoleManagerProps["action"];
  chapters: UserRoleManagerProps["chapters"];
  currentUserId: string;
  user: AdminUserRecord;
}) {
  const [role, setRole] = useState<AppRole>(user.role);
  const [chapterId, setChapterId] = useState(user.chapterId ?? "");
  const [assignedChapters, setAssignedChapters] = useState<string[]>(user.assignedChapters);
  const [isEditing, setIsEditing] = useState(false);
  const isSelf = user.id === currentUserId;
  const needsPrimaryChapter = role === "chapter_admin" || role === "coach";
  const needsAssignedChapters = role === "content_creator";

  return (
    <form action={action}>
      <input name="userId" type="hidden" value={user.id} />

      <div className="grid grid-cols-[minmax(0,2.05fr)_minmax(0,1.6fr)_minmax(5rem,0.5fr)_minmax(4rem,0.4fr)] items-center gap-2 px-4 py-3">

        <div className="min-w-0">
<div className="flex min-w-0 items-center gap-2">
  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[0.68rem] font-semibold text-teal-deep">
    {user.name.slice(0, 2).toUpperCase()}
  </span>
  <p className="truncate font-semibold text-teal-deep" title={user.name}>
    {user.name}
  </p>
</div>
<p
  className="truncate text-[0.68rem] leading-tight text-foreground/45"
  title={formatAccessSummary({ assignedChapters, chapterId, chapters, role })}
>
  {formatAccessSummary({ assignedChapters, chapterId, chapters, role })}
</p>
</div>

        <p className="truncate text-sm text-foreground/70" title={user.email}>
          {user.email}
        </p>
        <span
          className={`inline-flex w-[3.9rem] items-center justify-center justify-self-start whitespace-normal rounded-full border border-transparent px-1.5 py-1 text-center text-[0.66rem] font-semibold leading-tight ${getRolePillClass(role)}`}
        >
          {getRoleLabel(role)}
        </span>

        {isSelf ? (
          <span className="inline-flex w-[3.5rem] items-center justify-center justify-self-start whitespace-nowrap rounded-full border border-line/80 bg-[rgba(255,250,242,0.9)] px-1.5 py-0.5 text-center text-[0.66rem] font-semibold uppercase leading-tight tracking-[0.08em] text-accent">
            You
          </span>
        ) : (
          <button
            className="inline-flex w-[3.5rem] items-center justify-center justify-self-start whitespace-nowrap rounded-full border border-line/80 bg-[rgba(255,250,242,0.9)] px-1.5 py-0.5 text-center text-[0.66rem] font-semibold uppercase leading-tight tracking-[0.08em] text-teal-deep transition hover:border-[rgba(209,0,52,0.28)] hover:bg-[rgba(209,0,52,0.04)]"
            onClick={() => {
              if (isEditing) {
                setRole(user.role);
                setChapterId(user.chapterId ?? "");
                setAssignedChapters(user.assignedChapters);
              }

              setIsEditing((value) => !value);
            }}
            type="button"
          >
            {isEditing ? "Close" : "Edit"}
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="grid gap-4 border-t border-line/70 bg-[rgba(255,250,242,0.45)] px-4 py-4 md:grid-cols-2">
          <label className="field-shell">
            <span className="field-label">Role</span>
            <select
              className="field-input"
              name="role"
              onChange={(event) => setRole(event.target.value as AppRole)}
              value={role}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {needsPrimaryChapter ? (
            <label className="field-shell">
              <span className="field-label">Primary chapter</span>
              <select
                className="field-input"
                name="chapterId"
                onChange={(event) => setChapterId(event.target.value)}
                required={role === "chapter_admin"}
                value={chapterId}
              >
                <option value="">No primary chapter</option>
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                    {chapter.status !== "active" ? ` (${chapter.status})` : ""}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {needsAssignedChapters ? (
            <label className="field-shell md:col-span-2">
              <span className="field-label">Assigned chapters</span>
              <select
                className="field-input min-h-44"
                multiple
                name="assignedChapters"
                onChange={(event) =>
                  setAssignedChapters(
                    Array.from(event.target.selectedOptions, (option) => option.value),
                  )
                }
                required
                value={assignedChapters}
              >
                {chapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.name}
                    {chapter.status !== "active" ? ` (${chapter.status})` : ""}
                  </option>
                ))}
              </select>
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
                Hold command or control to choose multiple chapters.
              </span>
            </label>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 md:col-span-2">
            <p className="text-sm text-foreground/60">
              Saving clears any chapter fields that do not apply to the selected role.
            </p>
            <button className="button-link primary" type="submit">
              Save role
            </button>
          </div>
        </div>
      ) : null}
    </form>
  );
}
