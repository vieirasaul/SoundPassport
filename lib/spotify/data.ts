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

  return {
    mediumTerm: mediumTerm.items,
    longTerm: mediumTerm.items,
    topGenres: [] as string[],
    topArtistNames,
  };
}
