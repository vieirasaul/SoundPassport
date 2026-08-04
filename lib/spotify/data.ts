import "server-only";

export type SpotifyTrack = {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    release_date: string;
    images: Array<{ url: string; width: number | null; height: number | null }>;
  };
  external_urls: { spotify: string };
};

type TopTracksResponse = {
  items: SpotifyTrack[];
};

type MusicBrainzArtistSearch = {
  artists?: Array<{
    tags?: Array<{ name: string; count?: number }>;
  }>;
};

const supportedGenreTerms = [
  "metal", "punk", "hardcore", "core", "emo", "rock", "mpb", "samba", "bossa", "pop",
  "hip hop", "rap", "techno", "house", "electronic", "edm", "jazz",
  "classical", "funk", "soul", "r&b", "reggae", "country", "indie",
];

export class SpotifyDataRateLimitError extends Error {
  retryAfter: number;

  constructor(retryAfter: number) {
    super(`Spotify API rate limited for ${retryAfter} seconds`);
    this.name = "SpotifyDataRateLimitError";
    this.retryAfter = retryAfter;
  }
}

async function spotifyFetch<T>(path: string, accessToken: string) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(`https://api.spotify.com/v1${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });

    if (response.ok) {
      return response.json() as Promise<T>;
    }

    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("retry-after"));
      const waitSeconds = Number.isFinite(retryAfter) && retryAfter > 0
        ? retryAfter
        : 1;

      if (attempt === 0 && waitSeconds <= 5) {
        await new Promise((resolve) => setTimeout(resolve, waitSeconds * 1000));
        continue;
      }

      throw new SpotifyDataRateLimitError(waitSeconds);
    }

    throw new Error(`Spotify API request failed with ${response.status}`);
  }

  throw new Error("Spotify API request failed after retry");
}

async function getArtistGenres(artistNames: string[]) {
  if (!artistNames.length) return [];

  const query = artistNames
    .slice(0, 4)
    .map((name) => `artist:"${name.replace(/["\\]/g, "\\$&")}"`)
    .join(" OR ");
  const parameters = new URLSearchParams({ query, fmt: "json", limit: "4" });

  try {
    const response = await fetch(
      `https://musicbrainz.org/ws/2/artist/?${parameters}`,
      {
        headers: {
          "User-Agent": "SoundPassport/0.1 (https://github.com/vieirasaul/SoundPassport)",
        },
        next: { revalidate: 60 * 60 * 24 * 30 },
      },
    );

    if (!response.ok) return [];

    const result = (await response.json()) as MusicBrainzArtistSearch;
    const scores = new Map<string, number>();

    result.artists?.forEach((artist) => {
      artist.tags?.forEach((tag) => {
        const name = tag.name.trim().toLowerCase();
        if (!supportedGenreTerms.some((term) => name.includes(term))) return;
        scores.set(name, (scores.get(name) ?? 0) + Math.max(tag.count ?? 1, 1));
      });
    });

    return [...scores.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([genre]) => genre);
  } catch {
    return [];
  }
}

export async function getPassportData(accessToken: string) {
  const mediumTerm = await spotifyFetch<TopTracksResponse>(
    "/me/top/tracks?time_range=medium_term&limit=6",
    accessToken,
  );
  const topArtistNames = Array.from(
    new Set(
      mediumTerm.items.flatMap((track) =>
        track.artists.map((artist) => artist.name),
      ),
    ),
  ).slice(0, 4);
  const topGenres = await getArtistGenres(topArtistNames);

  return {
    mediumTerm: mediumTerm.items,
    longTerm: mediumTerm.items,
    topGenres,
    topArtistNames,
  };
}

export type PassportData = Awaited<ReturnType<typeof getPassportData>>;

type PassportCacheEntry = {
  data: PassportData;
  freshUntil: number;
  staleUntil: number;
};

const globalPassportCache = globalThis as typeof globalThis & {
  soundPassportCache?: Map<string, PassportCacheEntry>;
  soundPassportRequests?: Map<string, Promise<PassportData>>;
};

const passportCache =
  globalPassportCache.soundPassportCache ?? new Map<string, PassportCacheEntry>();
const passportRequests =
  globalPassportCache.soundPassportRequests ?? new Map<string, Promise<PassportData>>();

globalPassportCache.soundPassportCache = passportCache;
globalPassportCache.soundPassportRequests = passportRequests;

const freshLifetime = 12 * 60 * 60 * 1000;
const staleLifetime = 7 * 24 * 60 * 60 * 1000;

export async function getCachedPassportData(
  accountId: string,
  accessToken: string,
) {
  const now = Date.now();
  const cached = passportCache.get(accountId);

  if (cached && cached.freshUntil > now) {
    return { data: cached.data, source: "cache" as const };
  }

  const existingRequest = passportRequests.get(accountId);
  if (existingRequest) {
    return { data: await existingRequest, source: "spotify" as const };
  }

  const request = getPassportData(accessToken);
  passportRequests.set(accountId, request);

  try {
    const data = await request;
    const generatedAt = Date.now();
    passportCache.set(accountId, {
      data,
      freshUntil: generatedAt + freshLifetime,
      staleUntil: generatedAt + staleLifetime,
    });
    return { data, source: "spotify" as const };
  } catch (error) {
    if (cached && cached.staleUntil > now) {
      console.warn("Serving stale passport data after Spotify request failed");
      return { data: cached.data, source: "stale-cache" as const };
    }
    throw error;
  } finally {
    passportRequests.delete(accountId);
  }
}

export function clearPassportCache(accountId: string) {
  passportCache.delete(accountId);
  passportRequests.delete(accountId);
}
