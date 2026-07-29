"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  localeCookieName,
  localeLabels,
  locales,
  type Locale,
} from "@/i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
};

export function LanguageSwitcher({
  locale,
  label,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(nextLocale: Locale) {
    const segments = pathname.split("/");
    segments[1] = nextLocale;

    document.cookie = `${localeCookieName}=${nextLocale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    router.replace(`${segments.join("/")}${window.location.search}${window.location.hash}`);
  }

  return (
    <label className="relative ml-1">
      <span className="sr-only">{label}</span>
      <select
        value={locale}
        onChange={(event) => switchLocale(event.target.value as Locale)}
        className="h-9 cursor-pointer appearance-none rounded-lg border border-black/[0.08] bg-white py-0 pl-3 pr-8 text-sm font-medium text-ink shadow-sm outline-none transition hover:border-black/[0.16] focus-visible:ring-2 focus-visible:ring-ink/20"
        aria-label={label}
      >
        {locales.map((option) => (
          <option key={option} value={option} className="text-base">
            {localeLabels[option]}
          </option>
        ))}
      </select>
      <svg
        viewBox="0 0 16 16"
        className="pointer-events-none absolute right-2.5 top-1/2 size-3 -translate-y-1/2 text-muted"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="m4 6 4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </label>
  );
}
