import { NextResponse, type NextRequest } from "next/server";

import { defaultLocale, isLocale } from "@/i18n/config";
import {
  exchangeSpotifyCode,
  getAppUrl,
  getSpotifyProfile,
  sealSpotifySession,
  spotifyLocaleCookie,
  spotifySessionCookie,
  spotifyStateCookie,
  spotifyVerifierCookie,
} from "@/lib/auth/spotify";

function clearOAuthCookies(response: NextResponse) {
  const options = { path: "/api/auth", maxAge: 0 };
  response.cookies.set(spotifyStateCookie, "", options);
  response.cookies.set(spotifyVerifierCookie, "", options);
  response.cookies.set(spotifyLocaleCookie, "", options);
}

export async function GET(request: NextRequest) {
  const storedLocale = request.cookies.get(spotifyLocaleCookie)?.value ?? "";
  const locale = isLocale(storedLocale) ? storedLocale : defaultLocale;
  const errorUrl = getAppUrl(request, `/${locale}`);
  errorUrl.searchParams.set("auth", "error");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(spotifyStateCookie)?.value;
  const verifier = request.cookies.get(spotifyVerifierCookie)?.value;

  if (!code || !state || !storedState || !verifier || state !== storedState) {
    const response = NextResponse.redirect(errorUrl);
    clearOAuthCookies(response);
    return response;
  }

  try {
    const token = await exchangeSpotifyCode(request, code, verifier);

    if (!token.refresh_token) {
      throw new Error("Spotify did not return a refresh token");
    }

    const profile = await getSpotifyProfile(token.access_token);
    const session = await sealSpotifySession({
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + token.expires_in * 1000,
      scope: token.scope,
      issuedAt: Date.now(),
      profile: {
        accountId: profile.account_id ?? profile.id,
        displayName: profile.display_name ?? "Spotify user",
      },
    });
    const response = NextResponse.redirect(
      getAppUrl(request, `/${locale}/passport`),
    );

    response.cookies.set(spotifySessionCookie, session, {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      priority: "high",
    });
    clearOAuthCookies(response);

    return response;
  } catch (error) {
    console.error("Spotify authentication failed", error);
    const response = NextResponse.redirect(errorUrl);
    clearOAuthCookies(response);
    return response;
  }
}
