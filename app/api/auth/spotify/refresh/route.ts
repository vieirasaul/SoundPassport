import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";
import {
  getSpotifySession,
  getAppUrl,
  refreshSpotifySession,
  sealSpotifySession,
  spotifySessionCookie,
} from "@/lib/auth/spotify";

export async function GET(request: NextRequest) {
  const requestedLocale = request.nextUrl.searchParams.get("locale") ?? "";
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const session = await getSpotifySession();

  if (!session) {
    return NextResponse.redirect(getAppUrl(request, `/${locale}`));
  }

  try {
    const refreshedSession = await refreshSpotifySession(session);
    const sealedSession = await sealSpotifySession(refreshedSession);
    const response = NextResponse.redirect(
      getAppUrl(request, `/${locale}/passport`),
    );

    response.cookies.set(spotifySessionCookie, sealedSession, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      priority: "high",
    });

    return response;
  } catch (error) {
    console.error("Spotify token refresh failed", error);
    const response = NextResponse.redirect(
      getAppUrl(request, `/${locale}?auth=error`),
    );
    response.cookies.set(spotifySessionCookie, "", {
      path: "/",
      maxAge: 0,
    });
    return response;
  }
}
