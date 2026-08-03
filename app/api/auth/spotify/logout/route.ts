import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";
import { getAppUrl, spotifySessionCookie } from "@/lib/auth/spotify";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const requestedLocale = formData.get("locale");
  const locale =
    typeof requestedLocale === "string" && isLocale(requestedLocale)
      ? requestedLocale
      : defaultLocale;
  const response = NextResponse.redirect(getAppUrl(request, `/${locale}`), 303);

  response.cookies.set(spotifySessionCookie, "", {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
