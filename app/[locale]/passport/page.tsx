import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ArtistSeal } from "@/components/artist-seal";
import { PassportBooklet } from "@/components/passport-booklet";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";
import {
  getSpotifySession,
  hasRequiredSpotifyScopes,
  spotifySessionIsExpiring,
} from "@/lib/auth/spotify";
import {
  getCachedPassportData,
  type PassportData,
  SpotifyDataRateLimitError,
} from "@/lib/spotify/data";
import { createPassportShareToken } from "@/lib/share/passport-token";

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
  if (normalized.includes("emo")) return "🇺🇸";
  if (normalized.includes("punk") || normalized.includes("hardcore") || normalized.includes("core")) return "🇬🇧";
  if (normalized.includes("rock")) return "🇺🇸";
  if (normalized.includes("metal")) return "🇫🇮";
  if (normalized.includes("k-pop") || normalized.includes("korean")) return "🇰🇷";
  if (normalized.includes("latin") || normalized.includes("reggaeton")) return "🇵🇷";
  return "🌍";
}

function getCountryFlag(countryCode: string | undefined) {
  if (!countryCode || !/^[A-Z]{2}$/.test(countryCode)) return "🌍";

  return String.fromCodePoint(
    ...[...countryCode].map((character) => 127397 + character.charCodeAt(0)),
  );
}

function getGenreDestination(genre: string) {
  const normalized = genre.toLowerCase();

  if (normalized.includes("melodic death")) return "Melodeath Mountains";
  if (normalized.includes("death metal")) return "Death Metalvania";
  if (normalized.includes("black metal")) return "Blackmetalholm";
  if (normalized.includes("metal")) return "MetalLand";
  if (normalized.includes("pop punk")) return "Pop Punk Province";
  if (normalized.includes("punk")) return "Punknapolis";
  if (normalized.includes("hardcore")) return "Hardcore Harbor";
  if (normalized.includes("emo")) return "Emo Empire";
  if (normalized.includes("core")) return "Core County";
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
    `Embassy of ${artist}`,
    `${artist} Consulate`,
    `${artist} Territory`,
    `${artist} Outpost`,
  ];

  return destinations[index % destinations.length];
}

function getMusicNationalityCategory(genres: string[]) {
  const strongestGenre = genres[0]?.toLowerCase() ?? "";
  if (strongestGenre.includes("metal")) return "metal" as const;
  if (strongestGenre.includes("punk") || strongestGenre.includes("hardcore")) return "punk" as const;
  if (strongestGenre.includes("rock")) return "rock" as const;
  if (strongestGenre.includes("pop")) return "pop" as const;
  if (strongestGenre.includes("hip hop") || strongestGenre.includes("rap")) return "hipHop" as const;
  if (strongestGenre.includes("electronic") || strongestGenre.includes("techno")) return "electronic" as const;
  return "music" as const;
}

function getArtistOfficeCategory(genres: string[]) {
  const genre = genres.join(" ").toLowerCase();

  if (genre.includes("metal")) return "metal";
  if (genre.includes("punk") || genre.includes("hardcore")) return "punk";
  if (genre.includes("emo")) return "emo";
  if (genre.includes("hip hop") || genre.includes("rap")) return "hipHop";
  if (genre.includes("electronic") || genre.includes("house") || genre.includes("techno")) return "electronic";
  if (genre.includes("pop")) return "pop";
  if (genre.includes("rock")) return "rock";
  return "default";
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

function toMachineReadable(value: string, length: number) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "<")
    .padEnd(length, "<")
    .slice(0, length);
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
  let data: PassportData | null = null;
  let rateLimitRetryAfter: number | null = null;

  try {
    const passport = await getCachedPassportData(
      session.profile.accountId,
      session.accessToken,
    );
    data = passport.data;
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
  const validTopGenres = (data?.topGenres ?? []).filter(
    (genre): genre is string =>
      typeof genre === "string" && genre.trim().length > 0,
  );
  const affinityTravelHistory = (data?.genreAffinities ?? [])
    .map((affinity) => ({
      source: affinity.genre,
      destination: getGenreDestination(affinity.genre),
      flag: getCountryFlag(
        data?.artistCountries?.[affinity.ambassador.toLowerCase()],
      ),
      affinity,
    }))
    .filter(
      (place, index, places) =>
        places.findIndex(
          (candidate) => candidate.destination === place.destination,
        ) === index,
    )
    .slice(0, 4);
  const travelHistory = affinityTravelHistory.length
    ? affinityTravelHistory
    : validTopGenres.length
    ? validTopGenres
        .map((genre) => ({
          source: genre,
          destination: getGenreDestination(genre),
          flag: getGenreFlag(genre),
          affinity: null,
        }))
        .filter(
          (place, index, places) =>
            places.findIndex(
              (candidate) => candidate.destination === place.destination,
            ) === index,
        )
        .slice(0, 4)
    : (data?.topArtistNames ?? []).map((artist, index) => ({
        source: artist,
        destination: getArtistDestination(artist, index),
        flag: "🎵",
        affinity: null,
      }));
  const nationality = dictionary.passportPage.nationalities[
    getMusicNationalityCategory(validTopGenres)
  ];
  const portraitArtwork = data?.longTerm[0]?.album.images[0];
  const headOfState = data?.headOfState ?? null;
  const headOfStateProfile = data?.headOfStateProfile ?? null;
  const headOfStateTrack = data?.mediumTerm.find((track) =>
    track.artists.some((artist) => artist.name === headOfState?.name),
  );
  const spotifyHeadOfStateGenres = (headOfState?.genres ?? []).filter(
    (genre): genre is string => typeof genre === "string" && genre.length > 0,
  );
  const headOfStateGenres = spotifyHeadOfStateGenres.length
    ? spotifyHeadOfStateGenres
    : data?.artistGenres?.[headOfState?.name.toLowerCase() ?? ""] ?? [];
  const artistOffice = headOfState
    ? dictionary.passportPage.artistOffices[getArtistOfficeCategory(headOfStateGenres)]
    : "";
  const primaryDestination = travelHistory[0];
  const secondaryDestination = travelHistory[1];
  const machineReadableName = toMachineReadable(
    `SP MUSIC ${session.profile.displayName}`,
    42,
  );
  const machineReadableIdentity = toMachineReadable(
    `${passportNumber} ${nationality} ${dictionary.passportPage.validUntilValue}`,
    42,
  );
  const highCouncil = (data?.mediumTermArtists ?? []).slice(0, 3).map((artist, index) => ({
    artist,
    office: dictionary.passportPage.artistOffices[getArtistOfficeCategory(
      artist.genres?.length
        ? artist.genres
        : data?.artistGenres?.[artist.name.toLowerCase()] ?? [],
    )],
    rank: index + 1,
  }));
  const currentTopArtists = data?.shortTermArtists ?? [];
  const legacyArtistIds = new Set(
    (data?.longTermArtists ?? []).map((artist) => artist.id),
  );
  const legacyOverlap = currentTopArtists.filter((artist) =>
    legacyArtistIds.has(artist.id),
  ).length;
  const overlapBase = Math.max(
    Math.min(currentTopArtists.length, legacyArtistIds.size),
    1,
  );
  const overlapRatio = legacyOverlap / overlapBase;
  const travelerProfileKey = overlapRatio >= 0.6
    ? "loyalDiplomat"
    : overlapRatio <= 0.3
      ? "borderExplorer"
      : "seasonedVoyager";
  const travelerProfile = dictionary.passportPage.travelerProfiles[travelerProfileKey];
  const travelerProfileDescription =
    dictionary.passportPage.travelerProfileDescriptions[travelerProfileKey];
  const routeObservation = dictionary.passportPage.routeObservation
    .replace("{count}", String(legacyOverlap))
    .replace("{total}", String(currentTopArtists.length));
  const travelEras = [
    { label: dictionary.passportPage.currentExpedition, period: dictionary.passportPage.fourWeeks, artists: data?.shortTermArtists.slice(0, 3) ?? [] },
    { label: dictionary.passportPage.longHaulRoute, period: dictionary.passportPage.oneYear, artists: data?.longTermArtists.slice(0, 3) ?? [] },
  ];
  const leadingArtistFlag = getCountryFlag(
    data?.artistCountries?.[headOfState?.name.toLowerCase() ?? ""],
  );
  const appOrigin = new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;
  const passportShareToken = data ? createPassportShareToken({
    version: 1,
    locale,
    name: session.profile.displayName,
    nationality,
    territory: primaryDestination?.destination ?? dictionary.passportPage.undisclosed,
    headOfState: headOfState?.name ?? dictionary.passportPage.undisclosed,
    passportNumber,
    issueDate,
    portraitUrl: portraitArtwork?.url ?? null,
  }) : "";
  const passportShareUrl = `${appOrigin}/${locale}/share/${passportShareToken}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} navigation={dictionary.navigation} currentPath="/passport" />
      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-4 lg:px-8">
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
          <section className="py-6 sm:py-8">
            <PassportBooklet
              previousLabel={dictionary.passportPage.previousPage}
              nextLabel={dictionary.passportPage.nextPage}
              pageLabel={dictionary.passportPage.page}
              playLabel={dictionary.passportPage.playPassport}
              pauseLabel={dictionary.passportPage.pausePassport}
              progressLabel={dictionary.passportPage.pageProgress}
              downloadPageLabel={dictionary.passportPage.downloadPage}
              downloadAllLabel={dictionary.passportPage.downloadAllPages}
              downloadingLabel={dictionary.passportPage.downloading}
              downloadErrorLabel={dictionary.passportPage.downloadError}
              shareInstagramLabel={dictionary.passportPage.shareInstagram}
              shareSocialLabel={dictionary.passportPage.shareSocial}
              shareXLabel={dictionary.passportPage.shareX}
              shareText={dictionary.passportPage.shareText}
              shareFallbackLabel={dictionary.passportPage.shareFallback}
              createYoursLabel={dictionary.passportPage.createYours}
              shareUrl={passportShareUrl}
            >
              <section className="relative h-full overflow-hidden px-6 py-7 sm:px-9 sm:py-8">
                <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_center,#f1d77f_1px,transparent_1px)] [background-size:18px_18px]" />
                <div className="relative flex h-full flex-col">
                  <header className="flex items-center justify-between border-b border-[#f1d77f]/40 pb-4">
                    <div><p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#e4cd8b]">{dictionary.passportPage.republic}</p><h1 className="mt-1 text-3xl font-semibold uppercase tracking-[0.18em] text-[#fff0bd]">{dictionary.passportPage.document}</h1><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4cd8b]">{dictionary.passportPage.officialIdentityRecord}</p></div>
                    <div className="grid size-14 place-items-center rounded-full border-2 border-[#f1d77f]/75 text-2xl shadow-[inset_0_0_0_4px_rgba(241,215,127,0.08)]">♫</div>
                  </header>

                  <div className="mt-5 grid grid-cols-[112px_1fr] gap-5 sm:grid-cols-[140px_1fr] sm:gap-7">
                    <div>
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-[#f1d77f]/60 bg-[#183652]">
                        {portraitArtwork ? <Image src={portraitArtwork.url} alt="" fill sizes="140px" loading="eager" fetchPriority="high" className="object-cover opacity-90" /> : <div className="grid h-full place-items-center text-4xl">♫</div>}
                      </div>
                      <p className="mt-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e4cd8b]">{dictionary.passportPage.musicalPortrait}</p>
                      <div className="relative mx-auto mt-4 grid size-[84px] rotate-[-5deg] place-items-center rounded-full border-4 border-double border-[#f1d77f]/65 text-center text-[#f1d77f]/90 sm:size-24">
                        <span className="absolute inset-1.5 rounded-full border border-dashed border-[#f1d77f]/40" />
                        <div className="relative">
                          <span className="text-3xl leading-none" aria-hidden="true">♫</span>
                          <p className="mt-1 text-[8px] font-bold uppercase leading-[1.05] tracking-[0.08em] sm:text-[9px]">{dictionary.passportPage.verified}</p>
                        </div>
                      </div>
                    </div>
                    <dl className="grid grid-cols-2 content-start gap-x-4 gap-y-4">
                      <div className="col-span-2"><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.citizen}</dt><dd className="mt-1 text-2xl font-semibold text-[#fff0bd] sm:text-[28px]">{session.profile.displayName}</dd></div>
                      <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.nationality}</dt><dd className="mt-1 text-base font-semibold text-[#fff0bd]">{nationality}</dd></div>
                      <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.primaryTerritory}</dt><dd className="mt-1 text-base font-semibold text-[#fff0bd]">{primaryDestination?.destination ?? dictionary.passportPage.undisclosed}</dd></div>
                      <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.documentType}</dt><dd className="mt-1 text-base font-semibold text-[#fff0bd]">{dictionary.passportPage.documentTypeValue}</dd></div>
                      <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.passportNumber}</dt><dd className="mt-1 text-base font-semibold text-[#fff0bd]">{passportNumber}</dd></div>
                      <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.issued}</dt><dd className="mt-1 text-base font-semibold text-[#fff0bd]">{issueDate}</dd></div>
                      <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.validUntil}</dt><dd className="mt-1 text-base font-semibold text-[#fff0bd]">{dictionary.passportPage.validUntilValue}</dd></div>
                    </dl>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-4 border-y border-[#f1d77f]/30 py-4">
                    <div><dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#e4cd8b]">{dictionary.passportPage.headOfState}</dt><dd className="mt-1 truncate text-sm font-semibold text-[#fff0bd]">{headOfState?.name ?? dictionary.passportPage.undisclosed}</dd></div>
                    <div><dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#e4cd8b]">{dictionary.passportPage.issuingAuthority}</dt><dd className="mt-1 text-sm font-semibold text-[#fff0bd]">SoundPassport</dd></div>
                  </dl>

                  <div className="mt-4 rounded-lg border border-[#f1d77f]/25 bg-[#081a2b]/45 px-3 py-2 font-mono text-[11px] leading-4 tracking-[0.08em] text-[#f1d77f]/80"><p>{machineReadableName}</p><p>{machineReadableIdentity}</p></div>
                  <div className="mx-auto mt-auto w-64 pt-4 text-center">
                    <p className="whitespace-nowrap text-[38px] leading-none text-[#fff0bd] [font-family:'Snell_Roundhand','Segoe_Script','Brush_Script_MT',cursive] sm:text-[44px]"><span className="passport-signature relative inline-block">{session.profile.displayName}</span></p>
                    <div className="mt-1 border-b border-[#f1d77f]/45" />
                    <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.listenerSignature}</p>
                  </div>
                </div>
              </section>

              <section className="flex h-full flex-col px-3 py-6 sm:px-8 sm:py-7">
                <header className="text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{dictionary.passportPage.republic}</p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold uppercase tracking-[0.08em] text-[#fff0bd]">{dictionary.passportPage.highCouncil}</h2>
                  <p className="mx-auto mt-1.5 max-w-md text-sm leading-5 text-[#f1d77f]/75">{dictionary.passportPage.highCouncilDescription}</p>
                </header>

                {highCouncil.length ? (
                  <div className="mt-5 flex flex-1 flex-col items-center">
                    <ArtistSeal
                      artist={{ id: highCouncil[0].artist.id, name: highCouncil[0].artist.name, imageUrl: highCouncil[0].artist.images[0]?.url ?? null, spotifyUrl: highCouncil[0].artist.external_urls.spotify }}
                      office={highCouncil[0].office}
                      rank={highCouncil[0].rank}
                      openLabel={dictionary.passportPage.openSpotify}
                      featured
                      delay={0}
                    />
                    <div className="mt-3 flex w-full items-start justify-center gap-2.5 sm:gap-7">
                      {highCouncil.slice(1).map((member, index) => (
                        <ArtistSeal
                          key={member.artist.id}
                          artist={{ id: member.artist.id, name: member.artist.name, imageUrl: member.artist.images[0]?.url ?? null, spotifyUrl: member.artist.external_urls.spotify }}
                          office={member.office}
                          rank={member.rank}
                          openLabel={dictionary.passportPage.openSpotify}
                          delay={(index + 1) * 140}
                        />
                      ))}
                    </div>
                    <p className="mt-auto pb-1 text-center text-[9px] font-semibold uppercase leading-4 tracking-[0.1em] text-[#e4cd8b]">{dictionary.passportPage.councilPeriodLegend}</p>
                  </div>
                ) : <p className="mt-10 text-sm text-[#f1d77f]/75">{dictionary.passportPage.empty}</p>}
              </section>

              <section className="px-6 py-8 sm:px-10 sm:py-10">
                <header><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{dictionary.passportPage.republic}</p><h2 className="mt-2 text-3xl font-semibold text-[#fff0bd]">{dictionary.passportPage.foreignAffairs}</h2><p className="mt-1.5 max-w-md text-sm leading-5 text-[#f1d77f]/75">{dictionary.passportPage.travelHistoryDescription}</p></header>
                {primaryDestination ? (
                  <div className="mt-5">
                    <article className="rounded-xl border-2 border-[#f1d77f]/55 bg-[#f1d77f]/[0.08] p-4">
                      <div className="flex items-start gap-4">
                        <span className="text-4xl" aria-hidden="true">{primaryDestination.flag}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4cd8b]">{dictionary.passportPage.primaryTerritory}</p>
                          <p className="mt-1 text-xl font-bold uppercase tracking-[0.05em] text-[#fff0bd]">{primaryDestination.destination}</p>
                          <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#e4cd8b]">{formatGenre(primaryDestination.source)}</p>
                        </div>
                        <span className="font-mono text-[10px] text-[#f1d77f]/65">{dictionary.passportPage.entry} 01</span>
                      </div>
                      {primaryDestination.affinity ? (
                        <dl className="mt-4 border-t border-[#f1d77f]/25 pt-3">
                          <div><dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#e4cd8b]">{dictionary.passportPage.ambassador}</dt><dd className="mt-1 truncate text-xs font-semibold text-[#fff0bd]">{primaryDestination.affinity.ambassador}</dd></div>
                        </dl>
                      ) : null}
                    </article>

                    <div className="mt-3 space-y-2">
                      {travelHistory.slice(1).map((place, index) => (
                        <article key={place.source} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-xl border border-[#f1d77f]/30 bg-[#081a2b]/30 px-3 py-2.5">
                          <span className="text-2xl" aria-hidden="true">{place.flag}</span>
                          <div className="min-w-0"><p className="truncate text-sm font-bold uppercase tracking-[0.04em] text-[#fff0bd]">{place.destination}</p><p className="mt-0.5 truncate text-[10px] text-[#e4cd8b]">{place.affinity ? `${dictionary.passportPage.ambassador}: ${place.affinity.ambassador}` : formatGenre(place.source)}</p></div>
                          <p className="text-right font-mono text-[9px] uppercase tracking-[0.1em] text-[#f1d77f]/65">{dictionary.passportPage.entry} {String(index + 2).padStart(2, "0")}</p>
                        </article>
                      ))}
                    </div>

                    {secondaryDestination ? <p className="mt-4 rounded-xl border border-dashed border-[#f1d77f]/35 px-4 py-3 text-sm leading-5 text-[#fff0bd]">{dictionary.passportPage.borderReport.replace("{primary}", primaryDestination.destination).replace("{secondary}", secondaryDestination.destination)}</p> : null}
                  </div>
                ) : <p className="mt-10 text-sm text-[#f1d77f]/75">{dictionary.passportPage.empty}</p>}
              </section>

              <section className="px-6 py-7 sm:px-10 sm:py-8">
                <header><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{dictionary.passportPage.republic}</p><h2 className="mt-3 text-3xl font-semibold text-[#fff0bd]">{dictionary.passportPage.anthemsPage}</h2><p className="mt-2 text-xs leading-5 text-[#f1d77f]/75">{dictionary.passportPage.mediumTermDescription}</p></header>
                <ol className="mt-6 space-y-2">
                  {data.mediumTerm.map((track, index) => (
                    <li key={track.id} className="flex items-center gap-3 rounded-xl border border-[#f1d77f]/30 bg-[#081a2b]/35 p-2">
                      <span className="w-6 text-center font-mono text-sm text-[#e4cd8b]">{index + 1}</span>
                      <div className="relative size-14 shrink-0 overflow-hidden rounded-md bg-[#183652]">{track.album.images[0] ? <Image src={track.album.images[0].url} alt="" fill sizes="56px" loading={index === 0 ? "eager" : "lazy"} fetchPriority={index === 0 ? "high" : "auto"} className="object-cover" /> : null}</div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-[#fff0bd]">{track.name}</p><p className="mt-1 truncate text-xs text-[#f1d77f]/70">{track.artists.map((artist) => artist.name).join(", ")}</p></div>
                      <a href={track.external_urls.spotify} target="_blank" rel="noreferrer" aria-label={`${dictionary.passportPage.openSpotify}: ${track.name}`} className="grid size-11 shrink-0 place-items-center rounded-full bg-[#1DB954] text-white transition hover:scale-105"><Play className="size-5 translate-x-px" fill="currentColor" strokeWidth={0} aria-hidden="true" /></a>
                    </li>
                  ))}
                </ol>
              </section>

              <section className="px-6 py-7 sm:px-10 sm:py-8">
                <header>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{dictionary.passportPage.republic}</p>
                  <h2 className="mt-3 text-3xl font-semibold text-[#fff0bd]">{dictionary.passportPage.headOfState}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#f1d77f]/75">{dictionary.passportPage.headOfStateDescription}</p>
                </header>

                {headOfState ? (
                  <div className="mt-6">
                    <div className="grid grid-cols-[120px_1fr] gap-6 border-y border-[#f1d77f]/35 py-5 sm:grid-cols-[150px_1fr]">
                      <a
                        href={headOfState.external_urls.spotify}
                        target="_blank"
                        rel="noreferrer"
                        className="relative aspect-square overflow-hidden rounded-xl border border-[#f1d77f]/50 bg-[#183652]"
                        aria-label={`${dictionary.passportPage.openSpotify}: ${headOfState.name}`}
                      >
                        {headOfState.images[0] ? <Image src={headOfState.images[0].url} alt={headOfState.name} fill sizes="160px" className="object-cover" /> : <div className="grid h-full place-items-center text-4xl">♫</div>}
                      </a>
                      <div className="self-center">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4cd8b]">{dictionary.passportPage.currentAdministration}</p>
                        <h3 className="mt-2 text-2xl font-bold leading-tight text-[#fff0bd] sm:text-3xl">{headOfState.name}</h3>
                        <p className="mt-3 text-sm font-semibold leading-5 text-[#f1d77f]">{artistOffice}</p>
                      </div>
                    </div>

                    <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">
                      <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.capital}</dt><dd className="mt-1.5 text-sm font-semibold text-[#fff0bd]">{headOfStateProfile?.area ?? dictionary.passportPage.undisclosed}</dd></div>
                      <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.inOfficeSince}</dt><dd className="mt-1.5 text-sm font-semibold text-[#fff0bd]">{headOfStateProfile?.activeSince ?? dictionary.passportPage.undisclosed}</dd></div>
                      <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.government}</dt><dd className="mt-1.5 text-sm font-semibold text-[#fff0bd]">{headOfStateGenres.slice(0, 2).map(formatGenre).join(" · ") || dictionary.passportPage.independentState}</dd></div>
                      <div><dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.stateAnthem}</dt><dd className="mt-1.5 text-sm font-semibold text-[#fff0bd]">{headOfStateTrack?.name ?? dictionary.passportPage.classified}</dd></div>
                    </dl>

                    <blockquote className="mt-6 rounded-xl border border-[#f1d77f]/35 bg-[#081a2b]/35 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4cd8b]">{dictionary.passportPage.stateAddress}</p>
                      <p className="mt-3 text-base font-medium italic leading-7 text-[#fff0bd]">“{dictionary.passportPage.stateAddressText.replace("{artist}", headOfState.name)}”</p>
                    </blockquote>
                  </div>
                ) : <p className="mt-10 text-sm text-[#f1d77f]/75">{dictionary.passportPage.empty}</p>}
              </section>

              <section className="flex h-full flex-col px-6 py-7 sm:px-10 sm:py-8">
                <header>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{dictionary.passportPage.republic}</p>
                  <h2 className="mt-2 text-3xl font-semibold text-[#fff0bd]">{dictionary.passportPage.travelEras}</h2>
                  <p className="mt-1.5 text-sm leading-5 text-[#f1d77f]/75">{dictionary.passportPage.travelErasDescription}</p>
                </header>

                <div className="mt-6 space-y-4">
                  {travelEras.map((era, eraIndex) => (
                    <article key={era.label} className="rounded-xl border border-[#f1d77f]/30 bg-[#081a2b]/30 px-4 py-3">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-serif text-lg font-bold uppercase tracking-[0.05em] text-[#fff0bd]">{era.label}</h3>
                        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#e4cd8b]">{era.period}</span>
                      </div>
                      <ol className="mt-2.5 grid grid-cols-3 gap-2">
                        {era.artists.map((artist, artistIndex) => (
                          <li key={artist.id} className="min-w-0 rounded-lg border border-[#f1d77f]/20 bg-[#112a42] px-2 py-2 text-center">
                            <span className="text-xl" aria-hidden="true">{getCountryFlag(data?.artistCountries?.[artist.name.toLowerCase()])}</span>
                            <p className="mt-1 min-h-8 text-balance break-words text-xs font-semibold leading-4 text-[#fff0bd]">{artistIndex + 1}. {artist.name}</p>
                          </li>
                        ))}
                      </ol>
                      <p className="mt-2 text-right font-mono text-[9px] uppercase tracking-[0.12em] text-[#f1d77f]/55">{dictionary.passportPage.route} {String(eraIndex + 1).padStart(2, "0")}</p>
                    </article>
                  ))}
                </div>

                <div className="mt-auto rounded-xl border border-dashed border-[#f1d77f]/40 px-4 py-3 text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{dictionary.passportPage.borderPattern}</p>
                  <p className="mt-1.5 text-base font-semibold text-[#fff0bd]">{routeObservation}</p>
                </div>
              </section>

              <section className="relative flex h-full flex-col overflow-hidden px-6 py-7 sm:px-10 sm:py-8">
                <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:radial-gradient(circle_at_center,#f1d77f_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative flex h-full flex-col">
                  <header className="text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{dictionary.passportPage.republic}</p>
                    <div className="mx-auto mt-3 grid size-16 place-items-center rounded-full border-2 border-[#f1d77f]/70 text-3xl">♫</div>
                    <h2 className="mt-3 font-serif text-3xl font-semibold uppercase tracking-[0.08em] text-[#fff0bd]">{dictionary.passportPage.finalBorderReport}</h2>
                    <p className="mt-1 text-sm text-[#f1d77f]/75">{dictionary.passportPage.finalBorderDescription}</p>
                  </header>

                  <div className="mt-6 rounded-2xl border-2 border-[#f1d77f]/50 bg-[#081a2b]/35 p-5 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#e4cd8b]">{dictionary.passportPage.travelerClassification}</p>
                    <p className="mt-2 font-serif text-2xl font-bold uppercase tracking-[0.06em] text-[#fff0bd]">{travelerProfile}</p>
                    <p className="mt-2 text-xl font-semibold text-[#fff0bd]">{session.profile.displayName}</p>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#f1d77f]/25 bg-[#112a42]/80 p-3"><dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#e4cd8b]">{dictionary.passportPage.nationality}</dt><dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{nationality}</dd></div>
                    <div className="rounded-xl border border-[#f1d77f]/25 bg-[#112a42]/80 p-3"><dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#e4cd8b]">{dictionary.passportPage.leadingCountry}</dt><dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{leadingArtistFlag} {headOfState?.name ?? dictionary.passportPage.undisclosed}</dd></div>
                    <div className="rounded-xl border border-[#f1d77f]/25 bg-[#112a42]/80 p-3"><dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#e4cd8b]">{dictionary.passportPage.primaryTerritory}</dt><dd className="mt-1 text-sm font-semibold text-[#fff0bd]">{primaryDestination?.destination ?? dictionary.passportPage.undisclosed}</dd></div>
                    <div className="rounded-xl border border-[#f1d77f]/25 bg-[#112a42]/80 p-3"><dt className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#e4cd8b]">{dictionary.passportPage.officialAnthem}</dt><dd className="mt-1 truncate text-sm font-semibold text-[#fff0bd]">{data?.mediumTerm[0]?.name ?? dictionary.passportPage.classified}</dd></div>
                  </dl>

                  <p className="mt-5 rounded-xl border border-dashed border-[#f1d77f]/40 px-4 py-3 text-center text-sm font-medium leading-5 text-[#fff0bd]">{travelerProfileDescription}</p>
                  <div className="mt-auto flex justify-center"><span className="rotate-[-4deg] rounded-lg border-2 border-[#f1d77f]/65 px-5 py-2 font-serif text-sm font-bold uppercase tracking-[0.12em] text-[#f1d77f]">{dictionary.passportPage.clearedForTravel}</span></div>
                </div>
              </section>

            </PassportBooklet>
          </section>
        )}

        <div className="flex justify-center py-2">
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
