import { notFound, redirect } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { SpotifyAuth } from "@/components/spotify-auth";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";
import {
  getSpotifySession,
  hasRequiredSpotifyScopes,
} from "@/lib/auth/spotify";

export default async function Home({
  params,
  searchParams,
}: PageProps<"/[locale]">) {
  const { locale } = await params;
  const query = await searchParams;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);
  const session = await getSpotifySession();

  if (session && hasRequiredSpotifyScopes(session)) {
    redirect(`/${locale}/passport`);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} navigation={dictionary.navigation} />

      <main className="flex flex-1 flex-col">
        <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 sm:py-32 lg:grid-cols-[1fr_0.82fr] lg:px-8 lg:py-36">
          <div className="max-w-2xl">
            <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              <span className="block h-px w-6 bg-muted/60" />
              {dictionary.hero.eyebrow}
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-ink sm:text-5xl lg:text-[56px]">
              {dictionary.hero.title}
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              {dictionary.hero.description}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <SpotifyAuth
                locale={locale}
                session={null}
                labels={dictionary.auth}
              />
            </div>
            {query.auth === "error" ? (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {dictionary.auth.error}
              </p>
            ) : null}
          </div>

          <div className="relative mx-auto w-full max-w-[480px] lg:mr-0">
            <div className="absolute -inset-10 -z-10 rounded-full bg-[#ede9df]/70 blur-3xl" />
            <div className="rotate-[2deg] rounded-[28px] border border-black/[0.08] bg-white p-3 shadow-[0_30px_80px_rgba(17,24,39,0.12)]">
              <div className="overflow-hidden rounded-[21px] border border-black/[0.06] bg-[#f4f1e9]">
                <div className="flex items-center justify-between border-b border-black/[0.08] px-7 py-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                      {dictionary.passport.title}
                    </p>
                    <p className="mt-1 text-sm font-semibold tracking-tight">
                      {dictionary.passport.number}
                    </p>
                  </div>
                  <div className="grid size-10 place-items-center rounded-full border border-black/10">
                    <span className="text-lg">♫</span>
                  </div>
                </div>

                <div className="grid gap-8 p-7 sm:grid-cols-[116px_1fr]">
                  <div className="aspect-[4/5] rounded-xl bg-[linear-gradient(145deg,#1f2937,#667085)] p-3">
                    <div className="flex h-full items-end rounded-lg border border-white/20 p-3">
                      <div className="space-y-1">
                        <div className="h-0.5 w-8 bg-white/80" />
                        <div className="h-0.5 w-5 bg-white/45" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                      {dictionary.passport.recentEntry}
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
                      {dictionary.passport.song}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {dictionary.passport.artistAlbum}
                    </p>
                    <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-black/[0.08] pt-5">
                      <div>
                        <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                          {dictionary.passport.firstHeard}
                        </dt>
                        <dd className="mt-1 text-xs font-medium">
                          {dictionary.passport.place}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                          {dictionary.passport.year}
                        </dt>
                        <dd className="mt-1 text-xs font-medium">2011</dd>
                      </div>
                      <div>
                        <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                          {dictionary.passport.genre}
                        </dt>
                        <dd className="mt-1 text-xs font-medium">
                          {dictionary.passport.genreValue}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                          {dictionary.passport.plays}
                        </dt>
                        <dd className="mt-1 text-xs font-medium">184</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-t border-dashed border-black/[0.12] px-7 py-5">
                  <span className="grid size-8 place-items-center rounded-full border border-black/[0.12] text-xs">
                    ✓
                  </span>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                      {dictionary.passport.verified}
                    </p>
                    <p className="mt-0.5 text-xs font-medium">
                      {dictionary.passport.date}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer content={dictionary.footer} />
      </main>
    </div>
  );
}
