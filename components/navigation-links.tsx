"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavigationLink = {
  label: string;
  href: string;
};

type NavigationLinksProps = {
  links: NavigationLink[];
  className?: string;
};

export function isActiveLink(pathname: string, href: string) {
  const normalizedPathname = pathname.replace(/\/+$/, "");
  const normalizedHref = href.replace(/\/+$/, "");
  const isLocaleRoot = normalizedHref.split("/").filter(Boolean).length === 1;

  if (isLocaleRoot) {
    return normalizedPathname === normalizedHref;
  }

  return (
    normalizedPathname === normalizedHref ||
    normalizedPathname.startsWith(`${normalizedHref}/`)
  );
}

export function NavigationLinks({
  links,
  className,
}: NavigationLinksProps) {
  const pathname = usePathname();

  return (
    <ul className={className}>
      {links.map((item) => {
        const active = isActiveLink(pathname, item.href);

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`block rounded-lg px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                active
                  ? "bg-black/[0.05] text-ink"
                  : "text-muted hover:bg-black/[0.04] hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
