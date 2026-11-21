"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import type { NavigationItem } from "@/lib/types";

type NavDropdownProps = {
  item: NavigationItem;
  className: string;
};

/**
 * Header submenu (#156): a button that opens the parent page plus its child
 * links. Opens on click or hover; closes on Escape, an outside click, focus
 * leaving the menu, or picking a link.
 */
export function NavDropdown({ item, className }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const links = [
    { href: item.href, label: item.label },
    ...(item.children ?? []),
  ];

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      ref={wrapperRef}
    >
      <button
        aria-controls={menuId}
        aria-expanded={open}
        className={`${className} inline-flex items-center gap-1`}
        onClick={() => setOpen((current) => !current)}
        ref={buttonRef}
        // Header links inherit their colour (global `a` rule); match them.
        style={{ color: "inherit" }}
        type="button"
      >
        {item.label}
        <svg
          aria-hidden="true"
          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 12 12"
        >
          <path
            d="m2.5 4.5 3.5 3.5 3.5-3.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      </button>
      {/* pt-2 bridges the gap so the pointer can travel from button to menu. */}
      <div
        className={`absolute right-0 top-full z-50 pt-2 ${open ? "" : "hidden"}`}
        id={menuId}
      >
        <ul className="nav-dropdown-menu">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                className="nav-dropdown-link"
                href={link.href}
                onClick={() => {
                  trackEvent({
                    name: "nav_click",
                    params: {
                      nav_label: link.label,
                      nav_location: "header",
                      nav_destination: link.href,
                      outbound: false,
                    },
                  });
                  setOpen(false);
                }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
