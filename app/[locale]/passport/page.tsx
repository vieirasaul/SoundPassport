import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getDictionary, type Dictionary } from "@/i18n/get-dictionary";
import { isLocale, type Locale } from "@/i18n/config";
import {
  getSpotifySession,
  hasRequiredSpotifyScopes,
  spotifySessionIsExpiring,
} from "@/lib/auth/spotify";
import { getPassportData, type SpotifyTrack } from "@/lib/spotify/data";

type TrackCardProps = {
  track: SpotifyTrack;
  labels: Dictionary["passportPage"];
  locale: Locale;
  rank?: number;
  playedAt?: string;
};

function TrackCard({
  track,
  labels,
  locale,
  rank,
  playedAt,
}: TrackCardProps) {
  const artwork = track.album.images[0];
  const artistNames = track.artists.map((artist) => artist.name).join(", ");

  return (
    <article className="group overflow-hidden rounded-2xl border border-black/[0.07] bg-white shadow-[0_1px_2px_rgba(17,24,39,0.03)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(17,24,39,0.08)]">
      <div className="relative aspect-square overflow-hidden bg-[#ebe7dc]">
        {artwork ? (
          <Image
            src={artwork.url}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 220px"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : null}
        {rank ? (
          <span className="absolute left-3 top-3 grid size-8 place-items-center rounded-full bg-white/90 text-xs font-semibold text-ink shadow-sm backdrop-blur">
            {rank}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <h3 className="truncate text-sm font-semibold tracking-[-0.015em] text-ink">
          {track.name}
        </h3>
        <p className="mt-1 truncate text-xs text-muted">{artistNames}</p>
        <div className="mt-4 flex items-end justify-between gap-3 border-t border-black/[0.06] pt-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
              {playedAt ? labels.lastPlayed : labels.released}
            </p>
            <p className="mt-1 text-[11px] font-medium text-ink">
              {playedAt
                ? new Intl.DateTimeFormat(locale, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(playedAt))
                : track.album.release_date.slice(0, 4)}
            </p>
          </div>
          <a
            href={track.external_urls.spotify}
            target="_blank"
            rel="noreferrer"
            aria-label={`${labels.openSpotify}: ${track.name}`}
            className="grid size-8 shrink-0 place-items-center rounded-full bg-[#1DB954]/10 text-[#179443] transition hover:bg-[#1DB954] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
              <path d="M12 1.5A10.5 10.5 0 1 0 12 22.5 10.5 10.5 0 0 0 12 1.5Zm4.82 15.14a.65.65 0 0 1-.9.21c-2.47-1.51-5.58-1.85-9.24-1.01a.65.65 0 1 1-.29-1.27c4-.91 7.44-.52 10.22 1.18.31.19.4.59.21.89Zm1.28-2.85a.81.81 0 0 1-1.12.27c-2.83-1.74-7.15-2.24-10.5-1.23a.81.81 0 1 1-.47-1.56c3.83-1.16 8.59-.6 11.82 1.39.38.23.5.74.27 1.13Zm.11-2.97C14.82 8.8 9.22 8.61 5.99 9.58a.98.98 0 0 1-.56-1.87c3.71-1.12 9.9-.89 13.78 1.41a.98.98 0 0 1-1 1.7Z" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  );
}

type PassportSectionProps = {
  title: string;
  description: string;
  emptyLabel: string;
  children: React.ReactNode;
  isEmpty: boolean;
};

function PassportSection({
  title,
  description,
  emptyLabel,
  children,
  isEmpty,
}: PassportSectionProps) {
  return (
    <section className="border-t border-black/[0.07] py-14 sm:py-16">
      <div className="mb-8 max-w-xl">
        <h2 className="text-2xl font-semibold tracking-[-0.035em] text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
      </div>
      {isEmpty ? (
        <div className="rounded-2xl border border-dashed border-black/[0.1] px-6 py-12 text-center text-sm text-muted">
          {emptyLabel}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {children}
        </div>
      )}
    </section>
  );
}

function formatGenre(genre: string) {
  if (genre.toLowerCase() === "mpb") return "MPB";
  if (genre.toLowerCase() === "j-rock") return "J-Rock";

  return genre.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getGenreFlag(genre: string) {
  const normalized = genre.toLowerCase();
  if (normalized.includes("j-rock") || normalized.includes("japanese")) return "🇯🇵";
  if (normalized.includes("mpb") || normalized.includes("brazil")) return "🇧🇷";
  if (normalized.includes("swedish") || normalized.includes("melodic death")) return "🇸🇪";
  if (normalized.includes("rock")) return "🇺🇸";
  if (normalized.includes("metal")) return "🇫🇮";
  if (normalized.includes("k-pop") || normalized.includes("korean")) return "🇰🇷";
  if (normalized.includes("latin") || normalized.includes("reggaeton")) return "🇵🇷";
  return "🌍";
}

function getGenreDestination(genre: string) {
  const normalized = genre.toLowerCase();

  if (normalized.includes("melodic death")) return "Melodeath Mountains";
  if (normalized.includes("death metal")) return "Death Metalvania";
  if (normalized.includes("black metal")) return "Blackmetalholm";
  if (normalized.includes("metal")) return "MetalLand";
  if (normalized.includes("punk")) return "Punknapolis";
  if (normalized.includes("j-rock") || normalized.includes("japanese rock")) return "J-Rockyama";
  if (normalized.includes("rock")) return "Rock Republic";
  if (normalized.includes("mpb")) return "MPBrasília";
  if (normalized.includes("samba")) return "Sambadonia";
  if (normalized.includes("k-pop") || normalized.includes("korean pop")) return "Seoul Pop City";
  if (normalized.includes("hip hop") || normalized.includes("rap")) return "Rhyme City";
  if (normalized.includes("techno")) return "Technopolis";
  if (normalized.includes("house")) return "House Island";
  if (normalized.includes("electronic") || normalized.includes("edm")) return "Synthapore";
  if (normalized.includes("jazz")) return "Jazzakhstan";
  if (normalized.includes("classical")) return "Symphonia";
  if (normalized.includes("funk")) return "Funkylvania";
  if (normalized.includes("soul") || normalized.includes("r&b")) return "Soulvania";
  if (normalized.includes("reggae")) return "Reggae Bay";
  if (normalized.includes("country")) return "Countryshire";
  if (normalized.includes("indie")) return "Indieland";
  if (normalized.includes("pop")) return "Poptopia";

  return `${formatGenre(genre)} Island`;
}

function getArtistDestination(artist: string, index: number) {
  const destinations = [
    `${artist}land`,
    `Republic of ${artist}`,
    `${artist} City`,
    `Isles of ${artist}`,
  ];

  return destinations[index % destinations.length];
}

function getMusicNationality(genres: string[]) {
  const strongestGenre = genres[0]?.toLowerCase() ?? "";
  if (strongestGenre.includes("metal")) return "Metalhead";
  if (strongestGenre.includes("rock")) return "Rock Citizen";
  if (strongestGenre.includes("pop")) return "Pop Native";
  if (strongestGenre.includes("hip hop") || strongestGenre.includes("rap")) return "Beat Dweller";
  if (strongestGenre.includes("electronic") || strongestGenre.includes("techno")) return "Electronic Voyager";
  if (strongestGenre) return `${formatGenre(genres[0])} Native`;
  return "Citizen of Music";
}

export default async function PassportPage({
  params,
}: PageProps<"/[locale]/passport">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  const session = await getSpotifySession();

  if (!session || !hasRequiredSpotifyScopes(session)) {
    redirect(`/${locale}`);
  }

  if (spotifySessionIsExpiring(session)) {
    redirect(`/api/auth/spotify/refresh?locale=${locale}`);
  }

  const dictionary = await getDictionary(locale);
  let data: Awaited<ReturnType<typeof getPassportData>> | null = null;

  try {
    data = await getPassportData(session.accessToken);
  } catch (error) {
    console.error("Unable to build Spotify passport", error);
  }

  const passportNumber = `SP-${session.profile.accountId.slice(-8).toUpperCase()}`;
  const issueDate = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(session.issuedAt ?? session.expiresAt - 60 * 60 * 1000));
  const travelHistory = data?.topGenres.length
    ? data.topGenres.map((genre) => ({
        source: genre,
        destination: getGenreDestination(genre),
        flag: getGenreFlag(genre),
      }))
    : (data?.topArtistNames ?? []).map((artist, index) => ({
        source: artist,
        destination: getArtistDestination(artist, index),
        flag: "🎵",
      }));
  const nationality = getMusicNationality(data?.topGenres ?? []);
  const portraitArtwork = data?.longTerm[0]?.album.images[0];

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} navigation={dictionary.navigation} currentPath="/passport" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-12 lg:px-8">
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-[520px] rounded-[30px] bg-[#081a2b] p-2 shadow-[0_38px_100px_rgba(8,26,43,0.3)]">
            <div className="overflow-hidden rounded-[24px] border border-[#e6c979]/60 bg-[#112a42] text-[#f1d77f]">
            <div className="px-8 pb-7 pt-9 text-center">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f1d77f]/90">
                {dictionary.passportPage.republic}
              </p>
              <div className="mx-auto mt-6 grid size-24 place-items-center rounded-full border-2 border-[#f1d77f]/85">
                <svg viewBox="0 0 64 64" className="size-16" fill="none" aria-hidden="true">
                  <circle cx="32" cy="32" r="25" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M7 32h50M32 7c8 7 12 15 12 25S40 50 32 57M32 7c-8 7-12 15-12 25s4 18 12 25M12 19c12 5 28 5 40 0M12 45c12-5 28-5 40 0" stroke="currentColor" strokeWidth="1.2" opacity=".7" />
                  <path d="M31 41V22l13-3v18" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="25" cy="42" r="6" fill="currentColor" />
                  <circle cx="38" cy="38" r="6" fill="currentColor" />
                </svg>
              </div>
              <h1 className="mt-6 text-2xl font-semibold uppercase tracking-[0.22em] sm:text-3xl">
                {dictionary.passportPage.document}
              </h1>
            </div>

            <div className="border-t border-dashed border-[#f1d77f]/50 px-6 py-7 sm:px-8">
              <div className="grid grid-cols-[112px_1fr] gap-5 sm:grid-cols-[138px_1fr] sm:gap-7">
                <div>
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-[#f1d77f]/50 bg-[#183652]">
                  {portraitArtwork ? (
                    <Image src={portraitArtwork.url} alt="" fill sizes="138px" className="object-cover opacity-90 grayscale-[20%]" />
                  ) : (
                    <div className="grid h-full place-items-center text-4xl">♫</div>
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_55%,rgba(13,32,51,0.7))]" />
                </div>
                <p className="mt-2 text-center font-mono text-[10px] tracking-[0.08em] text-[#f1d77f]/85">
                  {passportNumber}
                </p>
              </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                  <div className="col-span-2">
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">
                      {dictionary.passportPage.citizen}
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#fff0bd] sm:text-2xl">
                      {session.profile.displayName}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">
                      {dictionary.passportPage.documentType}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{dictionary.passportPage.documentTypeValue}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">
                      {dictionary.passportPage.nationality}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{nationality}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.issued}</dt>
                    <dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{issueDate}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.validUntil}</dt>
                    <dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{dictionary.passportPage.validUntilValue}</dd>
                  </div>
                </dl>
              </div>

              <div className="mt-7 border-t border-[#f1d77f]/35 pt-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.officialAnthem}</p>
                <p className="mt-1.5 truncate text-base font-semibold text-[#fff0bd]">
                  {data?.longTerm[0] ? `${data.longTerm[0].name} · ${data.longTerm[0].artists.map((artist) => artist.name).join(", ")}` : "—"}
                </p>
              </div>

                <div className="mt-6 border-t border-[#f1d77f]/35 pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">
                    {dictionary.passportPage.travelHistory}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {travelHistory.map((place) => (
                      <span key={place.source} title={formatGenre(place.source)} className="flex min-h-12 -rotate-1 items-center rounded-md border border-[#f1d77f]/50 bg-[#f1d77f]/[0.11] px-3 py-2 text-xs font-semibold uppercase tracking-[0.04em] text-[#fff0bd] even:rotate-1">
                        <span className="mr-2 text-lg" aria-hidden="true">{place.flag}</span>
                        <span className="line-clamp-2">{place.destination}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-7 flex items-center justify-between border-t border-[#f1d77f]/35 pt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">
                  <span>{dictionary.passportPage.connected}</span>
                  <span className="text-xl text-[#1DB954]">●</span>
                </div>
              <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#f1d77f]/35 pt-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">
                    {dictionary.passportPage.republic}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#fff0bd]">
                    {dictionary.passportPage.documentTypeValue}
                  </p>
                </div>
                <p className="shrink-0 font-mono text-[10px] tracking-[0.08em] text-[#f1d77f]/85">
                  {passportNumber}
                </p>
              </div>
            </div>
            </div>
          </div>
        </section>

        {!data ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p className="text-sm text-red-700">{dictionary.passportPage.loadError}</p>
            <Link
              href={`/${locale}/passport`}
              className="mt-4 inline-flex rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white"
            >
              {dictionary.passportPage.tryAgain}
            </Link>
          </div>
        ) : (
          <>
            <PassportSection
              title={dictionary.passportPage.shortTerm}
              description={dictionary.passportPage.shortTermDescription}
              emptyLabel={dictionary.passportPage.empty}
              isEmpty={data.shortTerm.length === 0}
            >
              {data.shortTerm.map((track, index) => (
                <TrackCard key={track.id} track={track} rank={index + 1} locale={locale} labels={dictionary.passportPage} />
              ))}
            </PassportSection>
            <PassportSection
              title={dictionary.passportPage.mediumTerm}
              description={dictionary.passportPage.mediumTermDescription}
              emptyLabel={dictionary.passportPage.empty}
              isEmpty={data.mediumTerm.length === 0}
            >
              {data.mediumTerm.map((track, index) => (
                <TrackCard key={track.id} track={track} rank={index + 1} locale={locale} labels={dictionary.passportPage} />
              ))}
            </PassportSection>
            <PassportSection
              title={dictionary.passportPage.longTerm}
              description={dictionary.passportPage.longTermDescription}
              emptyLabel={dictionary.passportPage.empty}
              isEmpty={data.longTerm.length === 0}
            >
              {data.longTerm.map((track, index) => (
                <TrackCard key={track.id} track={track} rank={index + 1} locale={locale} labels={dictionary.passportPage} />
              ))}
            </PassportSection>
            <PassportSection
              title={dictionary.passportPage.recent}
              description={dictionary.passportPage.recentDescription}
              emptyLabel={dictionary.passportPage.empty}
              isEmpty={data.recent.length === 0}
            >
              {data.recent.map(({ track, played_at: playedAt }) => (
                <TrackCard key={`${track.id}-${playedAt}`} track={track} playedAt={playedAt} locale={locale} labels={dictionary.passportPage} />
              ))}
            </PassportSection>
          </>
        )}

        <div className="flex justify-center pb-4 pt-6">
          <form action="/api/auth/spotify/logout" method="post">
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition hover:border-red-300 hover:bg-red-100 hover:text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10 17l5-5-5-5M15 12H3" />
                <path d="M13 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
              </svg>
              {dictionary.auth.disconnect}
            </button>
          </form>
        </div>
      </main>
      <Footer content={dictionary.footer} />
    </div>
  );
}
