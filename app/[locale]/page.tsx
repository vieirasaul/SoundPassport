import { notFound, redirect } from "next/navigation";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { PassportDemo } from "@/components/passport-demo";
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
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1fr_0.82fr] lg:gap-16 lg:px-8 lg:py-36">
          <div className="max-w-2xl">
            <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              <span className="block h-px w-6 bg-muted/60" />
              {dictionary.hero.eyebrow}
            </p>
            <h1 className="text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.05em] text-ink sm:text-5xl lg:text-[56px]">
              {dictionary.hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-base leading-7 text-muted sm:mt-7 sm:text-xl sm:leading-9">
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

          <PassportDemo content={dictionary.demoPassport} />
        </section>

        <Footer content={dictionary.footer} locale={locale} />
      </main>
    </div>
  );
}
