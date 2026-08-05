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
        <div className="flex h-16 items-center justify-between sm:h-20">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[-0.02em] text-ink"
            aria-label={navigation.homeLabel}
          >
            <BrandLogo />
          </Link>

          <div className="hidden items-center sm:flex">
            <nav aria-label={navigation.homeLabel}>
              <NavigationLinks
                links={links}
                className="flex items-center gap-1"
              />
            </nav>
            <LanguageSwitcher
              locale={locale}
              label={navigation.languageLabel}
              currentPath={currentPath}
            />
          </div>
          <MobileMenu
            locale={locale}
            label={navigation.menuLabel}
            languageLabel={navigation.languageLabel}
            currentPath={currentPath}
            links={links}
          />
        </div>
      </div>
    </header>
  );
}
