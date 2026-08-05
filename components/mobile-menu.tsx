"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { LanguageSwitcher } from "@/components/language-switcher";
import { NavigationLinks } from "@/components/navigation-links";
import type { Locale } from "@/i18n/config";

type MobileMenuProps = {
  locale: Locale;
  label: string;
  languageLabel: string;
  currentPath?: string;
  links: Array<{ label: string; href: string }>;
};

export function MobileMenu({ locale, label, languageLabel, currentPath, links }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <div className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={label}
        aria-expanded={isOpen}
        className="grid size-10 cursor-pointer place-items-center rounded-xl border border-black/[0.08] bg-white text-ink shadow-sm transition hover:border-black/[0.16] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {isOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-12 z-[60] w-[min(19rem,calc(100vw-2rem))] rounded-2xl border border-black/[0.08] bg-white p-2 shadow-2xl shadow-black/10"
          onClick={(event) => {
            if ((event.target as HTMLElement).closest("a")) setIsOpen(false);
          }}
        >
          <nav aria-label={label}>
            <NavigationLinks links={links} className="flex flex-col gap-1" />
          </nav>
          <div className="mt-2 border-t border-black/[0.06] pt-2">
            <LanguageSwitcher locale={locale} label={languageLabel} currentPath={currentPath} mobile />
          </div>
        </div>
      ) : null}
    </div>
  );
}
