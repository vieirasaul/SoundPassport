import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PassportBooklet } from "@/components/passport-booklet";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";
import {
  getSpotifySession,
  hasRequiredSpotifyScopes,
  spotifySessionIsExpiring,
} from "@/lib/auth/spotify";
import {
  getPassportData,
  SpotifyDataRateLimitError,
} from "@/lib/spotify/data";

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

function formatRetryDuration(seconds: number, locale: string) {
  const unit = seconds >= 3600 ? "hour" : seconds >= 60 ? "minute" : "second";
  const divisor = unit === "hour" ? 3600 : unit === "minute" ? 60 : 1;

  return new Intl.NumberFormat(locale, {
    style: "unit",
    unit,
    unitDisplay: "long",
    maximumFractionDigits: 0,
  }).format(Math.ceil(seconds / divisor));
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
  let rateLimitRetryAfter: number | null = null;

  try {
    data = await getPassportData(session.accessToken);
  } catch (error) {
    if (error instanceof SpotifyDataRateLimitError) {
      rateLimitRetryAfter = error.retryAfter;
      console.warn(
        `Spotify is rate limiting passport data for ${error.retryAfter}s`,
      );
    } else {
      console.error("Unable to build Spotify passport", error);
    }
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
        {rateLimitRetryAfter ? (
          <div className="mx-auto my-16 max-w-[620px] rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900 sm:my-24">
            <p>{dictionary.passportPage.rateLimited.replace("{duration}", formatRetryDuration(rateLimitRetryAfter, locale))}</p>
            <Link href={`/${locale}/passport`} className="mt-3 inline-flex font-semibold underline underline-offset-4">
              {dictionary.passportPage.tryAgain}
            </Link>
          </div>
        ) : !data ? (
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
          <section className="py-16 sm:py-24">
            <PassportBooklet
              previousLabel={dictionary.passportPage.previousPage}
              nextLabel={dictionary.passportPage.nextPage}
              pageLabel={dictionary.passportPage.page}
            >
              <section className="px-6 py-8 sm:px-9 sm:py-10">
                <header className="text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f1d77f]/90">{dictionary.passportPage.republic}</p>
                  <div className="mx-auto mt-4 grid size-20 place-items-center rounded-full border-2 border-[#f1d77f]/85 text-4xl">♫</div>
                  <h1 className="mt-4 text-2xl font-semibold uppercase tracking-[0.22em] sm:text-3xl">{dictionary.passportPage.document}</h1>
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#e4cd8b]">{dictionary.passportPage.identityPage}</p>
                </header>
                <div className="mt-7 grid grid-cols-[112px_1fr] gap-5 border-t border-dashed border-[#f1d77f]/50 pt-7 sm:grid-cols-[150px_1fr] sm:gap-8">
                  <div>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-lg border border-[#f1d77f]/50 bg-[#183652]">
                      {portraitArtwork ? <Image src={portraitArtwork.url} alt="" fill sizes="150px" className="object-cover opacity-90" /> : <div className="grid h-full place-items-center text-4xl">♫</div>}
                    </div>
                    <p className="mt-2 text-center font-mono text-[10px] tracking-[0.08em] text-[#f1d77f]/85">{passportNumber}</p>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-5">
                    <div className="col-span-2"><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.citizen}</dt><dd className="mt-1 text-xl font-semibold text-[#fff0bd] sm:text-2xl">{session.profile.displayName}</dd></div>
                    <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.nationality}</dt><dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{nationality}</dd></div>
                    <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.documentType}</dt><dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{dictionary.passportPage.documentTypeValue}</dd></div>
                    <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.issued}</dt><dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{issueDate}</dd></div>
                    <div><dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.validUntil}</dt><dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{dictionary.passportPage.validUntilValue}</dd></div>
                  </dl>
                </div>
                <div className="mt-8 border-t border-[#f1d77f]/35 pt-5"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.officialAnthem}</p><p className="mt-1.5 text-base font-semibold text-[#fff0bd]">{data.longTerm[0] ? `${data.longTerm[0].name} · ${data.longTerm[0].artists.map((artist) => artist.name).join(", ")}` : "N/A"}</p></div>
                <div className="mt-8 flex items-center justify-between border-t border-[#f1d77f]/35 pt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]"><span>{dictionary.passportPage.connected}</span><span className="text-xl text-[#1DB954]">●</span></div>
              </section>

              <section className="px-6 py-8 sm:px-10 sm:py-10">
                <header><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{dictionary.passportPage.republic}</p><h2 className="mt-3 text-3xl font-semibold text-[#fff0bd]">{dictionary.passportPage.travelHistory}</h2><p className="mt-2 max-w-md text-sm leading-6 text-[#f1d77f]/75">{dictionary.passportPage.travelHistoryDescription}</p></header>
                <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {travelHistory.map((place, index) => (
                    <article key={place.source} className="relative min-h-48 overflow-hidden rounded-xl border-2 border-[#f1d77f]/55 bg-[#f1d77f]/[0.08] p-5 even:rotate-1 odd:-rotate-1">
                      <span className="text-4xl" aria-hidden="true">{place.flag}</span>
                      <p className="mt-5 text-lg font-bold uppercase tracking-[0.06em] text-[#fff0bd]">{place.destination}</p>
                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.12em] text-[#e4cd8b]">{formatGenre(place.source)}</p>
                      <p className="absolute bottom-4 right-4 font-mono text-[10px] text-[#f1d77f]/65">VISA {String(index + 1).padStart(2, "0")}</p>
                    </article>
                  ))}
                </div>
              </section>

              <section className="px-6 py-8 sm:px-10 sm:py-10">
                <header><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{dictionary.passportPage.republic}</p><h2 className="mt-3 text-3xl font-semibold text-[#fff0bd]">{dictionary.passportPage.anthemsPage}</h2><p className="mt-2 text-sm leading-6 text-[#f1d77f]/75">{dictionary.passportPage.mediumTermDescription}</p></header>
                <ol className="mt-8 space-y-3">
                  {data.mediumTerm.map((track, index) => (
                    <li key={track.id} className="flex items-center gap-4 rounded-xl border border-[#f1d77f]/30 bg-[#081a2b]/35 p-3">
                      <span className="w-6 text-center font-mono text-sm text-[#e4cd8b]">{index + 1}</span>
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-[#183652]">{track.album.images[0] ? <Image src={track.album.images[0].url} alt="" fill sizes="56px" className="object-cover" /> : null}</div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#fff0bd]">{track.name}</p><p className="mt-1 truncate text-xs text-[#f1d77f]/70">{track.artists.map((artist) => artist.name).join(", ")}</p></div>
                      <a href={track.external_urls.spotify} target="_blank" rel="noreferrer" aria-label={`${dictionary.passportPage.openSpotify}: ${track.name}`} className="grid size-9 shrink-0 place-items-center rounded-full bg-[#1DB954] text-white transition hover:scale-105"><span aria-hidden="true">▶</span></a>
                    </li>
                  ))}
                </ol>
              </section>
            </PassportBooklet>
          </section>
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
      <Footer content={dictionary.footer} locale={locale} />
    </div>
  );
}
