import { NextResponse, type NextRequest } from "next/server";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  matchLocale,
} from "@/i18n/config";

function detectLocale(request: NextRequest) {
  const savedLocale = request.cookies.get(localeCookieName)?.value;

  if (savedLocale && isLocale(savedLocale)) {
    return savedLocale;
  }

  const preferences = (request.headers.get("accept-language") ?? "")
    .split(",")
    .map((preference) => {
      const [tag, qualityValue] = preference.trim().split(";q=");
      const quality = qualityValue === undefined ? 1 : Number(qualityValue);

      return {
        tag,
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter(({ tag, quality }) => tag && quality > 0)
    .sort((a, b) => b.quality - a.quality);

  for (const preference of preferences) {
    const locale = matchLocale(preference.tag);

    if (locale) {
      return locale;
    }
  }

  return defaultLocale;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const firstSegment = pathname.split("/")[1];

  if (isLocale(firstSegment)) {
    return NextResponse.next();
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
