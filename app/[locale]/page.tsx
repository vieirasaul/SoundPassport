import { notFound } from "next/navigation";

import { Header } from "@/components/header";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";

export default async function Home({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  return (
    <div className="min-h-screen">
      <Header locale={locale} navigation={dictionary.navigation} />

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 sm:py-32 lg:grid-cols-[1fr_0.82fr] lg:px-8 lg:py-36">
          <div className="max-w-2xl">
            <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              <span className="block h-px w-6 bg-muted/60" />
              {dictionary.hero.eyebrow}
            </p>
            <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-ink sm:text-6xl lg:text-[72px]">
              {dictionary.hero.title}
            </h1>
            <p className="mt-7 max-w-xl text-pretty text-lg leading-8 text-muted sm:text-xl sm:leading-9">
              {dictionary.hero.description}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                type="button"
                className="rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(17,24,39,0.2)] transition hover:-translate-y-0.5 hover:bg-[#252d3a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                {dictionary.hero.cta}
              </button>
              <span className="text-sm text-muted">
                {dictionary.hero.comingSoon}
              </span>
            </div>
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

        <div className="mx-auto max-w-7xl px-6 pb-10 lg:px-8">
          <div className="flex flex-col gap-3 border-t border-black/[0.06] pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
            <p>{dictionary.footer.tagline}</p>
            <p>{dictionary.footer.features}</p>
          </div>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-muted">
            <span>{dictionary.footer.madeBy} Saul Vieira</span>
            <a
              href="https://github.com/vieirasaul"
              target="_blank"
              rel="noreferrer"
              aria-label="Saul Vieira on GitHub"
              className="inline-flex rounded-md p-1 text-ink transition hover:bg-black/[0.05] hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.77 2.72 1.26 3.38.96.1-.75.4-1.26.74-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.16 1.18a10.96 10.96 0 0 1 5.75 0c2.2-1.49 3.16-1.18 3.16-1.18.63 1.59.23 2.76.11 3.05a4.46 4.46 0 0 1 1.19 3.09c0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.06.79 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/in/vieirasaul/"
              target="_blank"
              rel="noreferrer"
              aria-label="Saul Vieira on LinkedIn"
              className="inline-flex rounded-md p-1 text-ink transition hover:bg-black/[0.05] hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <svg
                viewBox="0 0 24 24"
                className="size-5"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.04H3.54V8.98H7.1v11.47Z" />
              </svg>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
