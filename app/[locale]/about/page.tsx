import { notFound } from "next/navigation";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);
  const { about } = dictionary;

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} navigation={dictionary.navigation} currentPath="/about" />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-6 pb-20 pt-20 sm:pb-28 sm:pt-28 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{about.eyebrow}</p>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-semibold tracking-[-0.05em] text-ink sm:text-6xl">{about.title}</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted sm:text-xl sm:leading-9">{about.introduction}</p>

          <div className="mt-16 grid gap-5 sm:grid-cols-3">
            {about.steps.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-black/[0.07] bg-white p-6 shadow-[0_12px_35px_rgba(17,24,39,0.04)]">
                <span className="grid size-8 place-items-center rounded-full bg-[#112a42] text-xs font-semibold text-[#f1d77f]">{index + 1}</span>
                <h2 className="mt-5 text-lg font-semibold tracking-[-0.02em] text-ink">{step.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{step.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-black/[0.06] bg-white">
          <div className="mx-auto grid max-w-4xl gap-10 px-6 py-16 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <span className="grid size-12 place-items-center rounded-2xl bg-[#1DB954]/10 text-xl text-[#179443]">✓</span>
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-ink">{about.privacyTitle}</h2>
            </div>
            <div className="space-y-5 text-base leading-7 text-muted">
              <p>{about.privacyDescription}</p>
              <p>{about.passwordDescription}</p>
              <p>{about.permissionsDescription}</p>
              <a href="https://developer.spotify.com/documentation/web-api/concepts/authorization" target="_blank" rel="noreferrer" className="inline-flex font-semibold text-ink underline decoration-black/25 underline-offset-4 transition hover:decoration-black">
                {about.officialApiLink}
              </a>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-20 sm:py-28 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{about.faqEyebrow}</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-ink sm:text-4xl">{about.faqTitle}</h2>
          <div className="mt-10 divide-y divide-black/[0.08] border-y border-black/[0.08]">
            {about.faq.map((item) => (
              <details key={item.question} className="group py-1">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span className="text-xl font-normal text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="max-w-2xl pb-6 pr-10 text-sm leading-7 text-muted">{item.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer content={dictionary.footer} />
    </div>
  );
}
