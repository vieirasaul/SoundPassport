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

export type SpotifyArtist = {
  id: string;
  name: string;
  genres: string[];
  images: Array<{ url: string; width: number | null; height: number | null }>;
  external_urls: { spotify: string };
  popularity: number;
};

type TopTracksResponse = {
  items: SpotifyTrack[];
};

type TopArtistsResponse = {
  items: SpotifyArtist[];
};

export type ArtistProfile = {
  name: string;
  type: string | null;
  country: string | null;
  area: string | null;
  activeSince: string | null;
  disambiguation: string | null;
};

type MusicBrainzArtistSearch = {
  artists?: Array<{
    name: string;
    score?: number;
    type?: string;
    country?: string;
    area?: { name?: string };
    "begin-area"?: { name?: string };
    "life-span"?: { begin?: string };
    disambiguation?: string;
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

async function getArtistProfile(artistName: string): Promise<ArtistProfile | null> {
  const parameters = new URLSearchParams({
    query: `artist:"${artistName.replace(/["\\]/g, "\\$&")}"`,
    fmt: "json",
    limit: "3",
  });

  try {
    const response = await fetch(`https://musicbrainz.org/ws/2/artist/?${parameters}`, {
      headers: {
        "User-Agent": "SoundPassport/0.1 (https://github.com/vieirasaul/SoundPassport)",
      },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!response.ok) return null;

    const result = (await response.json()) as MusicBrainzArtistSearch;
    const exactMatch = result.artists?.find(
      (artist) => artist.name.toLowerCase() === artistName.toLowerCase(),
    );
    const artist = exactMatch ?? result.artists?.[0];

    if (!artist) return null;

    return {
      name: artist.name,
      type: artist.type ?? null,
      country: artist.country ?? null,
      area: artist["begin-area"]?.name ?? artist.area?.name ?? null,
      activeSince: artist["life-span"]?.begin?.slice(0, 4) ?? null,
      disambiguation: artist.disambiguation ?? null,
    };
  } catch {
    return null;
  }
}

export async function getPassportData(accessToken: string) {
  const [mediumTerm, shortTermArtists, mediumTermArtists, longTermArtists] =
    await Promise.all([
      spotifyFetch<TopTracksResponse>(
        "/me/top/tracks?time_range=medium_term&limit=6",
        accessToken,
      ),
      spotifyFetch<TopArtistsResponse>(
        "/me/top/artists?time_range=short_term&limit=10",
        accessToken,
      ),
      spotifyFetch<TopArtistsResponse>(
        "/me/top/artists?time_range=medium_term&limit=10",
        accessToken,
      ),
      spotifyFetch<TopArtistsResponse>(
        "/me/top/artists?time_range=long_term&limit=10",
        accessToken,
      ),
    ]);
  const topArtistNames = mediumTermArtists.items.slice(0, 4).map((artist) => artist.name);
  const spotifyGenres = mediumTermArtists.items
    .flatMap((artist) => artist.genres ?? [])
    .filter((genre): genre is string =>
      typeof genre === "string" && genre.trim().length > 0,
    );
  const topGenres = spotifyGenres.length
    ? [...new Set(spotifyGenres)].slice(0, 12)
    : await getArtistGenres(topArtistNames);
  const headOfState = mediumTermArtists.items[0] ?? null;
  const headOfStateProfile = headOfState
    ? await getArtistProfile(headOfState.name)
    : null;

  return {
    mediumTerm: mediumTerm.items,
    longTerm: mediumTerm.items,
    topGenres,
    topArtistNames,
    shortTermArtists: shortTermArtists.items,
    mediumTermArtists: mediumTermArtists.items,
    longTermArtists: longTermArtists.items,
    headOfState,
    headOfStateProfile,
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
const passportDataVersion = "v2";

export async function getCachedPassportData(
  accountId: string,
  accessToken: string,
) {
  const now = Date.now();
  const cacheKey = `${accountId}:${passportDataVersion}`;
  const cached = passportCache.get(cacheKey);

  if (cached && cached.freshUntil > now) {
    return { data: cached.data, source: "cache" as const };
  }

  const existingRequest = passportRequests.get(cacheKey);
  if (existingRequest) {
    return { data: await existingRequest, source: "spotify" as const };
  }

  const request = getPassportData(accessToken);
  passportRequests.set(cacheKey, request);

  try {
    const data = await request;
    const generatedAt = Date.now();
    passportCache.set(cacheKey, {
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
    passportRequests.delete(cacheKey);
  }
}

export function clearPassportCache(accountId: string) {
  passportCache.delete(accountId);
  passportRequests.delete(accountId);
  passportCache.delete(`${accountId}:${passportDataVersion}`);
  passportRequests.delete(`${accountId}:${passportDataVersion}`);
}
