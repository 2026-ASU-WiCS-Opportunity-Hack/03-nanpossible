"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  fallbackHref?: string;
};

export function BackButton({
  fallbackHref = "/",
}: Readonly<BackButtonProps>) {
  const router = useRouter();

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button className="button-link secondary" onClick={handleBack} type="button">
      <span aria-hidden="true">←</span>
      Back
    </button>
  );
}
