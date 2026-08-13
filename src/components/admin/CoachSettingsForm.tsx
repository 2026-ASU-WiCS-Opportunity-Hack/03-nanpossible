import type { ChapterRecord, CoachRecord } from "@/lib/types";

type CoachSettingsFormProps = {
  coach: CoachRecord;
  chapters: ChapterRecord[];
  action: (formData: FormData) => Promise<void>;
};

const TITLE_OPTIONS = ["", "Dr.", "Mr.", "Ms.", "Mrs."];
const CERT_LEVELS = ["", "CALC", "PALC", "SALC", "MALC"];

export function CoachSettingsForm({ coach, chapters, action }: CoachSettingsFormProps) {
  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <input name="coachId" type="hidden" value={coach.id} />

      <label className="field-shell">
        <span className="field-label">Full name</span>
        <input className="field-input" defaultValue={coach.name} name="name" required type="text" />
      </label>

      <label className="field-shell">
        <span className="field-label">Title</span>
        <select className="field-input" defaultValue={coach.title ?? ""} name="title">
          {TITLE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option || "None"}
            </option>
          ))}
        </select>
      </label>

      <label className="field-shell">
        <span className="field-label">Organization</span>
        <input
          className="field-input"
          defaultValue={coach.organization ?? ""}
          name="organization"
          type="text"
        />
      </label>

      <label className="field-shell">
        <span className="field-label">Profile link (slug)</span>
        <input
          className="field-input"
          defaultValue={coach.slug ?? ""}
          name="slug"
          type="text"
        />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
          Appears in the profile address: /coaches/&lt;slug&gt;
        </span>
      </label>

      <label className="field-shell">
        <span className="field-label">Affiliate</span>
        <select className="field-input" defaultValue={coach.chapterId ?? ""} name="chapterId">
          <option value="">None</option>
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}
        </select>
      </label>

      <label className="field-shell">
        <span className="field-label">Certification level</span>
        <select className="field-input" defaultValue={coach.certLevel ?? ""} name="certLevel">
          {CERT_LEVELS.map((option) => (
            <option key={option} value={option}>
              {option || "None"}
            </option>
          ))}
        </select>
      </label>

      <label className="field-shell">
        <span className="field-label">Certification valid until</span>
        <input
          className="field-input"
          defaultValue={coach.certValidUntil ?? ""}
          name="certValidUntil"
          type="date"
        />
      </label>

      <label className="field-shell">
        <span className="field-label">Email</span>
        <input className="field-input" defaultValue={coach.email ?? ""} name="email" type="email" />
      </label>

      <label className="field-shell">
        <span className="field-label">Phone</span>
        <input className="field-input" defaultValue={coach.phone ?? ""} name="phone" type="text" />
      </label>

      <label className="field-shell">
        <span className="field-label">City</span>
        <input
          className="field-input"
          defaultValue={coach.locationCity ?? ""}
          name="locationCity"
          type="text"
        />
      </label>

      <label className="field-shell">
        <span className="field-label">State / province</span>
        <input
          className="field-input"
          defaultValue={coach.locationState ?? ""}
          name="locationState"
          type="text"
        />
      </label>

      <label className="field-shell">
        <span className="field-label">Country</span>
        <input
          className="field-input"
          defaultValue={coach.locationCountry ?? ""}
          name="locationCountry"
          type="text"
        />
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
          Use the full country name so the flag and map placement resolve
        </span>
      </label>

      <div className="grid grid-cols-2 gap-4">
        <label className="field-shell">
          <span className="field-label">Latitude</span>
          <input
            className="field-input"
            defaultValue={coach.locationLat ?? ""}
            name="locationLat"
            step="any"
            type="number"
          />
        </label>
        <label className="field-shell">
          <span className="field-label">Longitude</span>
          <input
            className="field-input"
            defaultValue={coach.locationLng ?? ""}
            name="locationLng"
            step="any"
            type="number"
          />
        </label>
      </div>

      <label className="field-shell">
        <span className="field-label">Website</span>
        <input className="field-input" defaultValue={coach.website ?? ""} name="website" type="text" />
      </label>

      <label className="field-shell">
        <span className="field-label">LinkedIn</span>
        <input className="field-input" defaultValue={coach.linkedin ?? ""} name="linkedin" type="text" />
      </label>

      <label className="field-shell">
        <span className="field-label">Blog</span>
        <input className="field-input" defaultValue={coach.blogUrl ?? ""} name="blogUrl" type="text" />
      </label>

      <label className="field-shell">
        <span className="field-label">YouTube</span>
        <input className="field-input" defaultValue={coach.youtubeUrl ?? ""} name="youtubeUrl" type="text" />
      </label>

      <label className="field-shell">
        <span className="field-label">X (Twitter)</span>
        <input className="field-input" defaultValue={coach.twitterUrl ?? ""} name="twitterUrl" type="text" />
      </label>

      <label className="field-shell">
        <span className="field-label">Facebook</span>
        <input className="field-input" defaultValue={coach.facebookUrl ?? ""} name="facebookUrl" type="text" />
      </label>

      <label className="field-shell">
        <span className="field-label">Photo URL</span>
        <input className="field-input" defaultValue={coach.photoUrl ?? ""} name="photoUrl" type="text" />
      </label>

      <label className="field-shell">
        <span className="field-label">CV URL</span>
        <input className="field-input" defaultValue={coach.cvUrl ?? ""} name="cvUrl" type="text" />
      </label>

      <label className="field-shell md:col-span-2">
        <span className="field-label">Credly badge URL</span>
        <input
          className="field-input"
          defaultValue={coach.credlyBadgeUrl ?? ""}
          name="credlyBadgeUrl"
          type="text"
        />
      </label>

      <label className="field-shell md:col-span-2">
        <span className="field-label">Bio</span>
        <textarea className="field-textarea" defaultValue={coach.bio ?? ""} name="bio" rows={6} />
      </label>

      <label className="field-shell md:col-span-2">
        <span className="field-label">Credentials (one per line)</span>
        <textarea
          className="field-textarea"
          defaultValue={coach.credentials ?? ""}
          name="credentials"
          rows={5}
        />
      </label>

      <label className="field-shell md:col-span-2">
        <span className="field-label">Honors &amp; awards (one per line)</span>
        <textarea
          className="field-textarea"
          defaultValue={coach.awards ?? ""}
          name="awards"
          rows={4}
        />
      </label>

      <label className="field-shell">
        <span className="field-label">Specializations (comma-separated)</span>
        <input
          className="field-input"
          defaultValue={coach.specializations.join(", ")}
          name="specializations"
          type="text"
        />
      </label>

      <label className="field-shell">
        <span className="field-label">Languages (comma-separated codes)</span>
        <input
          className="field-input"
          defaultValue={coach.languages.join(", ")}
          name="languages"
          type="text"
        />
      </label>

      <label className="coach-checkbox md:col-span-2">
        <input defaultChecked={coach.approved} name="approved" type="checkbox" value="true" />
        <span>Approved — visible in the public directory</span>
      </label>

      <div className="md:col-span-2">
        <button className="button-link primary" type="submit">
          Save coach details
        </button>
      </div>
    </form>
  );
}
