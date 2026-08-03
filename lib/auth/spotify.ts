import "server-only";

import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

export const spotifySessionCookie = "soundpassport_spotify_session";
export const spotifyStateCookie = "soundpassport_spotify_state";
export const spotifyVerifierCookie = "soundpassport_spotify_verifier";
export const spotifyLocaleCookie = "soundpassport_spotify_locale";
export const spotifyRequiredScopes = [
  "user-read-private",
  "user-top-read",
  "user-read-recently-played",
] as const;

export type SpotifySession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scope: string;
  issuedAt?: number;
  profile: {
    accountId: string;
    displayName: string;
  };
};

type SpotifyTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
};

type SpotifyProfileResponse = {
  account_id?: string;
  id: string;
  display_name: string | null;
};

function toBase64Url(value: Uint8Array) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return new Uint8Array(Buffer.from(value, "base64url"));
}

export function randomBase64Url(byteLength: number) {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
}

export async function createCodeChallenge(verifier: string) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );

  return toBase64Url(new Uint8Array(digest));
}

function getRequiredEnvironmentValue(name: "SPOTIFY_CLIENT_ID" | "AUTH_SECRET") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getSpotifyClientId() {
  return getRequiredEnvironmentValue("SPOTIFY_CLIENT_ID");
}

export function getSpotifyRedirectUri(request: NextRequest) {
  return (
    process.env.SPOTIFY_REDIRECT_URI ??
    `${request.nextUrl.origin}/api/auth/callback`
  );
}

export function getAppOrigin(request: NextRequest) {
  if (process.env.APP_URL) {
    return new URL(process.env.APP_URL).origin;
  }

  if (process.env.SPOTIFY_REDIRECT_URI) {
    return new URL(process.env.SPOTIFY_REDIRECT_URI).origin;
  }

  return request.nextUrl.origin;
}

export function getAppUrl(request: NextRequest, pathname: string) {
  return new URL(pathname, getAppOrigin(request));
}

export function hasRequiredSpotifyScopes(session: SpotifySession) {
  const grantedScopes = new Set((session.scope ?? "").split(" "));
  return spotifyRequiredScopes.every((scope) => grantedScopes.has(scope));
}

export function spotifySessionIsExpiring(session: SpotifySession) {
  return session.expiresAt <= Date.now() + 60_000;
}

async function getEncryptionKey() {
  const secret = getRequiredEnvironmentValue("AUTH_SECRET");
  const keyBytes = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );

  return crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function sealSpotifySession(session: SpotifySession) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    await getEncryptionKey(),
    new TextEncoder().encode(JSON.stringify(session)),
  );

  return `${toBase64Url(iv)}.${toBase64Url(new Uint8Array(ciphertext))}`;
}

async function openSpotifySession(value: string) {
  const [encodedIv, encodedCiphertext] = value.split(".");

  if (!encodedIv || !encodedCiphertext) {
    return null;
  }

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64Url(encodedIv) },
      await getEncryptionKey(),
      fromBase64Url(encodedCiphertext),
    );

    return JSON.parse(
      new TextDecoder().decode(plaintext),
    ) as SpotifySession;
  } catch {
    return null;
  }
}

export async function getSpotifySession() {
  const value = (await cookies()).get(spotifySessionCookie)?.value;

  if (!value) {
    return null;
  }

  return openSpotifySession(value);
}

export async function exchangeSpotifyCode(
  request: NextRequest,
  code: string,
  verifier: string,
) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getSpotifyClientId(),
      grant_type: "authorization_code",
      code,
      redirect_uri: getSpotifyRedirectUri(request),
      code_verifier: verifier,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Spotify token exchange failed with ${response.status}`);
  }

  return response.json() as Promise<SpotifyTokenResponse>;
}

export class SpotifyRateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number) {
    super("Spotify API rate limit reached");
    this.name = "SpotifyRateLimitError";
    this.retryAfter = retryAfter;
  }
}

function getRetryAfter(response: Response) {
  const seconds = Number(response.headers.get("retry-after"));
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 1;
}

export async function getSpotifyProfile(accessToken: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (response.ok) {
      return response.json() as Promise<SpotifyProfileResponse>;
    }

    if (response.status === 429) {
      const retryAfter = getRetryAfter(response);

      if (attempt === 0 && retryAfter <= 2) {
        await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));
        continue;
      }

      throw new SpotifyRateLimitError(retryAfter);
    }

    throw new Error(`Spotify profile request failed with ${response.status}`);
  }

  throw new SpotifyRateLimitError(1);
}

export async function refreshSpotifySession(session: SpotifySession) {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getSpotifyClientId(),
      grant_type: "refresh_token",
      refresh_token: session.refreshToken,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Spotify token refresh failed with ${response.status}`);
  }

  const token = (await response.json()) as SpotifyTokenResponse & {
    scope?: string;
  };

  return {
    ...session,
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? session.refreshToken,
    expiresAt: Date.now() + token.expires_in * 1000,
    scope: token.scope ?? session.scope,
  };
}
