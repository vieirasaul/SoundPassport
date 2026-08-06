import Link from "next/link";

import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileMenu } from "@/components/mobile-menu";
import { NavigationLinks } from "@/components/navigation-links";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

type HeaderProps = {
  locale: Locale;
  navigation: Dictionary["navigation"];
  currentPath?: string;
};

export function Header({ locale, navigation, currentPath }: HeaderProps) {
  const links = [
    { label: navigation.home, href: `/${locale}` },
    { label: navigation.about, href: `/${locale}/about` },
    { label: navigation.contact, href: `/${locale}/contact` },
  ];

  return (
    <header className="border-b border-black/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center sm:grid sm:h-20 sm:grid-cols-[1fr_auto_1fr]">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em] text-ink"
            aria-label={navigation.homeLabel}
          >
            <BrandLogo />
          </Link>

          <nav aria-label={navigation.homeLabel} className="hidden sm:block">
            <NavigationLinks
              links={links}
              className="flex items-center gap-1"
            />
          </nav>

          <div className="hidden justify-self-end sm:block">
            <LanguageSwitcher
              locale={locale}
              label={navigation.languageLabel}
              currentPath={currentPath}
            />
          </div>
          <div className="ml-auto sm:hidden">
            <MobileMenu
              locale={locale}
              label={navigation.menuLabel}
              languageLabel={navigation.languageLabel}
              currentPath={currentPath}
              links={links}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
