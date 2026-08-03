import { NextResponse, type NextRequest } from "next/server";

import {
  createCodeChallenge,
  getSpotifyClientId,
  getSpotifyRedirectUri,
  randomBase64Url,
  spotifyLocaleCookie,
  spotifyRequiredScopes,
  spotifyStateCookie,
  spotifyVerifierCookie,
} from "@/lib/auth/spotify";
import { defaultLocale, isLocale } from "@/i18n/config";

export async function GET(request: NextRequest) {
  const requestedLocale = request.nextUrl.searchParams.get("locale") ?? "";
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;
  const state = randomBase64Url(32);
  const verifier = randomBase64Url(64);
  const challenge = await createCodeChallenge(verifier);
  const authorizationUrl = new URL("https://accounts.spotify.com/authorize");

  authorizationUrl.search = new URLSearchParams({
    client_id: getSpotifyClientId(),
    response_type: "code",
    redirect_uri: getSpotifyRedirectUri(request),
    state,
    scope: spotifyRequiredScopes.join(" "),
    code_challenge_method: "S256",
    code_challenge: challenge,
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:",
    sameSite: "lax" as const,
    path: "/api/auth",
    maxAge: 60 * 10,
  };

  response.cookies.set(spotifyStateCookie, state, cookieOptions);
  response.cookies.set(spotifyVerifierCookie, verifier, cookieOptions);
  response.cookies.set(spotifyLocaleCookie, locale, cookieOptions);

  return response;
}
