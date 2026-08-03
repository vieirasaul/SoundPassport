import Link from "next/link";

import {
  localeLabels,
  locales,
  type Locale,
} from "@/i18n/config";

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
  currentPath?: string;
};

export function LanguageSwitcher({
  locale,
  label,
  currentPath = "",
}: LanguageSwitcherProps) {
  return (
    <details className="group relative ml-1">
      <summary
        className="flex h-9 cursor-pointer list-none items-center gap-2 rounded-lg border border-black/[0.08] bg-white py-0 pl-3 pr-2.5 text-sm font-medium text-ink shadow-sm outline-none transition hover:border-black/[0.16] focus-visible:ring-2 focus-visible:ring-ink/20 [&::-webkit-details-marker]:hidden"
        aria-label={label}
      >
        <span>{localeLabels[locale]}</span>
        <svg
          viewBox="0 0 16 16"
          className="size-3 text-muted transition group-open:rotate-180"
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
      </summary>

      <div className="absolute right-0 z-50 mt-2 min-w-40 overflow-hidden rounded-xl border border-black/[0.08] bg-white p-1.5 shadow-xl shadow-black/10">
        {locales.map((option) => (
          <Link
            key={option}
            href={`/${option}${currentPath}`}
            lang={option}
            aria-current={option === locale ? "true" : undefined}
            className="block rounded-lg px-3 py-2 text-sm font-medium text-ink transition hover:bg-black/[0.05] aria-[current=true]:bg-black/[0.05]"
          >
            {localeLabels[option]}
          </Link>
        ))}
      </div>
    </details>
  );
}
