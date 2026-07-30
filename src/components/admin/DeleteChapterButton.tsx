"use client";

export function DeleteChapterButton() {
  return (
    <button
      className="inline-flex items-center justify-center rounded-full border border-[rgba(209,0,52,0.22)] px-4 py-2 text-sm font-semibold text-[var(--teal)] transition hover:border-[rgba(209,0,52,0.4)] hover:bg-[rgba(209,0,52,0.05)]"
      onClick={(event) => {
        const confirmed = window.confirm(
          "Do you want to proceed deleting this affiliate?"
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
      type="submit"
    >
      Delete affiliate
    </button>
  );
}