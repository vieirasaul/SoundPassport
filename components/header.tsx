import Image from "next/image";
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
            <Image
              src="/logo.png"
              alt="SoundPassport"
              width={1024}
              height={1024}
              priority
              className="h-auto w-[72px] sm:w-[92px]"
            />
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
