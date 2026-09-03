"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  DONATION_COMMENT_MAX,
  DONATION_PRESETS_MINOR,
  formatMinorAmount,
  parseDonationAmount,
} from "@/lib/payments-format";
import { startDonationAction } from "./actions";

function DonateButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="button-link primary" disabled={pending} type="submit">
      {pending ? "Redirecting to Stripe…" : label}
    </button>
  );
}

export function DonationForm() {
  const [preset, setPreset] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [comment, setComment] = useState("");

  const amount = parseDonationAmount(preset, customAmount);
  const total = amount !== null ? formatMinorAmount(amount, "usd") : null;

  return (
    <form action={startDonationAction} className="site-panel rounded-[2rem] p-6 md:p-8">
      <h2 className="section-title text-teal-deep">Choose an amount</h2>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {DONATION_PRESETS_MINOR.map((minor) => (
          <label className="coach-checkbox justify-center text-center" key={minor}>
            <input
              checked={preset === String(minor)}
              name="preset"
              onChange={() => setPreset(String(minor))}
              type="radio"
              value={minor}
            />
            {formatMinorAmount(minor, "usd")}
          </label>
        ))}
        <label className="coach-checkbox justify-center text-center">
          <input
            checked={preset === "other"}
            name="preset"
            onChange={() => setPreset("other")}
            type="radio"
            value="other"
          />
          Other
        </label>
      </div>

      {preset === "other" ? (
        <label className="field-shell mt-4">
          <span className="field-label">Amount (USD)</span>
          <input
            className="field-input"
            inputMode="decimal"
            min={1}
            name="custom"
            onChange={(event) => setCustomAmount(event.target.value)}
            placeholder="25.00"
            type="text"
            value={customAmount}
          />
        </label>
      ) : null}

      <label className="field-shell mt-4">
        <span className="field-label">Comment or message (optional)</span>
        <textarea
          className="field-textarea"
          maxLength={DONATION_COMMENT_MAX}
          name="comment"
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          value={comment}
        />
      </label>

      <div className="mt-5 flex items-center justify-between border-t border-foreground/10 pt-4">
        <span className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground/60">
          Total
        </span>
        <span className="font-display text-2xl text-teal-deep">{total ?? "—"}</span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <DonateButton label={total ? `Donate ${total}` : "Donate"} />
        <p className="text-sm text-foreground/60">
          You will enter your card and billing details securely on Stripe.
        </p>
      </div>
    </form>
  );
}
