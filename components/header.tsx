import Link from "next/link";

import { LanguageSwitcher } from "@/components/language-switcher";
import { NavigationLinks } from "@/components/navigation-links";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

type HeaderProps = {
  locale: Locale;
  navigation: Dictionary["navigation"];
};

export function Header({ locale, navigation }: HeaderProps) {
  const links = [
    { label: navigation.home, href: `/${locale}` },
    { label: navigation.about, href: `/${locale}/about` },
    { label: navigation.contact, href: `/${locale}/contact` },
  ];

  return (
    <header className="border-b border-black/[0.06]">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em] text-ink"
            aria-label={navigation.homeLabel}
          >
            <span className="grid size-8 place-items-center rounded-lg bg-ink text-white shadow-sm">
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M9 16.5V7.8l8-1.8v8.7M9 11l8-1.8"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="6.5" cy="17" r="2.5" fill="currentColor" />
                <circle cx="14.5" cy="15.2" r="2.5" fill="currentColor" />
              </svg>
            </span>
            <span className="hidden sm:inline">SoundPassport</span>
          </Link>

          <div className="flex items-center">
            <nav aria-label={navigation.homeLabel} className="hidden sm:block">
              <NavigationLinks
                links={links}
                className="flex items-center gap-1"
              />
            </nav>
            <LanguageSwitcher
              locale={locale}
              label={navigation.languageLabel}
            />
          </div>
        </div>

        <nav
          aria-label={navigation.homeLabel}
          className="border-t border-black/[0.05] py-2 sm:hidden"
        >
          <NavigationLinks
            links={links}
            className="flex items-center justify-center gap-1"
          />
        </nav>
      </div>
    </header>
  );
}
