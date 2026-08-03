import { notFound } from "next/navigation";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);
  const { privacy } = dictionary;

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} navigation={dictionary.navigation} currentPath="/privacy" />
      <main className="flex-1">
        <article className="mx-auto max-w-3xl px-6 py-20 sm:py-28 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{privacy.eyebrow}</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-ink sm:text-6xl">{privacy.title}</h1>
          <p className="mt-7 text-lg leading-8 text-muted sm:text-xl sm:leading-9">{privacy.introduction}</p>
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.12em] text-muted">{privacy.updated}</p>

          <div className="mt-16 space-y-12">
            {privacy.sections.map((section, index) => (
              <section key={section.title} className="grid gap-5 border-t border-black/[0.08] pt-8 sm:grid-cols-[48px_1fr]">
                <span className="grid size-10 place-items-center rounded-xl bg-[#112a42] text-xs font-semibold text-[#f1d77f]">{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.025em] text-ink">{section.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted">{section.description}</p>
                  {section.items.length ? (
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
                      {section.items.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#1DB954]" />{item}</li>)}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-14 rounded-3xl bg-[#112a42] p-7 text-white sm:p-9">
            <h2 className="text-2xl font-semibold tracking-[-0.03em]">{privacy.controlTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-white/70">{privacy.controlDescription}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="https://www.spotify.com/account/apps/" target="_blank" rel="noreferrer" className="rounded-xl bg-[#1DB954] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#19a64b]">{privacy.manageSpotify}</a>
              <a href="mailto:vvvieirasaul@gmail.com?subject=SoundPassport%20Privacy" className="rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">{privacy.contact}</a>
            </div>
          </section>
        </article>
      </main>
      <Footer content={dictionary.footer} locale={locale} />
    </div>
  );
}
