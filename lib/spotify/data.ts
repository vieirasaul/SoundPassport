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

type SpotifyArtist = {
  id: string;
  name: string;
  genres?: string[];
};

type TopArtistsResponse = {
  items: SpotifyArtist[];
};

type RecentlyPlayedResponse = {
  items: Array<{
    track: SpotifyTrack;
    played_at: string;
  }>;
};

async function spotifyFetch<T>(path: string, accessToken: string) {
  const response = await fetch(`https://api.spotify.com/v1${path}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Spotify API request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getPassportData(accessToken: string) {
  const [shortTerm, mediumTerm, longTerm, recentlyPlayed, topArtists] =
    await Promise.all([
      spotifyFetch<TopTracksResponse>(
        "/me/top/tracks?time_range=short_term&limit=6",
        accessToken,
      ),
      spotifyFetch<TopTracksResponse>(
        "/me/top/tracks?time_range=medium_term&limit=6",
        accessToken,
      ),
      spotifyFetch<TopTracksResponse>(
        "/me/top/tracks?time_range=long_term&limit=6",
        accessToken,
      ),
      spotifyFetch<RecentlyPlayedResponse>(
        "/me/player/recently-played?limit=10",
        accessToken,
      ),
      spotifyFetch<TopArtistsResponse>(
        "/me/top/artists?time_range=medium_term&limit=20",
        accessToken,
      ),
    ]);

  const seenTrackIds = new Set<string>();
  const recent = recentlyPlayed.items.filter(({ track }) => {
    if (seenTrackIds.has(track.id)) return false;
    seenTrackIds.add(track.id);
    return true;
  });

  const genreScores = new Map<string, number>();
  topArtists.items.forEach((artist, index) => {
    const weight = topArtists.items.length - index;
    artist.genres?.forEach((genre) => {
      genreScores.set(genre, (genreScores.get(genre) ?? 0) + weight);
    });
  });

  const topGenres = [...genreScores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([genre]) => genre);

  return {
    shortTerm: shortTerm.items,
    mediumTerm: mediumTerm.items,
    longTerm: longTerm.items,
    recent: recent.slice(0, 6),
    topGenres,
    topArtistNames: topArtists.items.slice(0, 4).map((artist) => artist.name),
  };
}
