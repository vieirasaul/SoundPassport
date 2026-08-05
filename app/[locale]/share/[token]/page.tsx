import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";
import { readPassportShareToken } from "@/lib/share/passport-token";

type SharedPassportPageProps = {
  params: Promise<{ locale: string; token: string }>;
};

function getAppOrigin() {
  return new URL(process.env.APP_URL ?? "http://127.0.0.1:3000").origin;
}

export async function generateMetadata({ params }: SharedPassportPageProps): Promise<Metadata> {
  const { locale, token } = await params;
  if (!isLocale(locale)) return {};
  const passport = readPassportShareToken(token);
  if (!passport || passport.locale !== locale) return {};
  const dictionary = await getDictionary(locale);
  const title = dictionary.passportPage.sharedPassportTitle.replace("{name}", passport.name);
  const description = dictionary.passportPage.sharedPassportDescription;
  const pageUrl = `${getAppOrigin()}/${locale}/share/${token}`;
  const imageUrl = `${pageUrl}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: { title, description, url: pageUrl, type: "website", images: [{ url: imageUrl, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [imageUrl] },
    robots: { index: false, follow: true },
  };
}

export default async function SharedPassportPage({ params }: SharedPassportPageProps) {
  const { locale, token } = await params;
  if (!isLocale(locale)) notFound();
  const passport = readPassportShareToken(token);
  if (!passport || passport.locale !== locale) notFound();
  const dictionary = await getDictionary(locale);

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} navigation={dictionary.navigation} />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-6 py-10 sm:py-14">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">SoundPassport</p>
        <h1 className="mt-3 text-center text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {dictionary.passportPage.sharedPassportTitle.replace("{name}", passport.name)}
        </h1>
        <p className="mt-3 max-w-xl text-center text-sm leading-6 text-muted">{dictionary.passportPage.sharedPassportDescription}</p>
        <div className="mt-8 w-full overflow-hidden rounded-3xl border border-black/[0.08] bg-[#081a2b] shadow-[0_28px_80px_rgba(8,26,43,0.22)]">
          <Image
            src={`/${locale}/share/${token}/opengraph-image`}
            alt={dictionary.passportPage.sharedPassportTitle.replace("{name}", passport.name)}
            width={1200}
            height={630}
            priority
            unoptimized
            className="h-auto w-full"
          />
        </div>
        <Link href={`/${locale}`} className="mt-8 inline-flex rounded-full bg-[#112a42] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#183652]">
          {dictionary.passportPage.createYourPassport}
        </Link>
      </main>
      <Footer content={dictionary.footer} locale={locale} />
    </div>
  );
}
