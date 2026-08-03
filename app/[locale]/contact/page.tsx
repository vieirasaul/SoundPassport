import { notFound } from "next/navigation";

import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { getDictionary } from "@/i18n/get-dictionary";
import { isLocale } from "@/i18n/config";

const email = "vvvieirasaul@gmail.com";

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;

  if (!isLocale(locale)) notFound();

  const dictionary = await getDictionary(locale);
  const { contact } = dictionary;

  return (
    <div className="flex min-h-screen flex-col">
      <Header locale={locale} navigation={dictionary.navigation} currentPath="/contact" />
      <main className="flex flex-1 items-center">
        <section className="mx-auto w-full max-w-4xl px-6 py-20 sm:py-28 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{contact.eyebrow}</p>
            <h1 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.05em] text-ink sm:text-6xl">{contact.title}</h1>
            <p className="mt-7 text-lg leading-8 text-muted sm:text-xl sm:leading-9">{contact.description}</p>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-2">
            <a
              href={`mailto:${email}?subject=SoundPassport`}
              className="group rounded-3xl bg-[#112a42] p-7 text-white shadow-[0_24px_65px_rgba(17,42,66,0.18)] transition hover:-translate-y-1 hover:shadow-[0_30px_75px_rgba(17,42,66,0.24)] sm:col-span-2 sm:p-9"
            >
              <span className="grid size-12 place-items-center rounded-2xl bg-white/10 text-xl text-[#f1d77f]">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </span>
              <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-[#f1d77f]">{contact.emailLabel}</p>
              <p className="mt-2 break-all text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{email}</p>
              <p className="mt-4 max-w-xl text-sm leading-6 text-white/65">{contact.emailDescription}</p>
              <span className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-[#f1d77f]">{contact.emailAction} <span className="transition group-hover:translate-x-1">→</span></span>
            </a>

            <a href="https://www.linkedin.com/in/vieirasaul/" target="_blank" rel="noreferrer" className="group rounded-3xl border border-black/[0.07] bg-white p-7 shadow-[0_12px_35px_rgba(17,24,39,0.04)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(17,24,39,0.08)]">
              <svg viewBox="0 0 24 24" className="size-7 text-ink" fill="currentColor" aria-hidden="true"><path d="M5.37 3.5A2.18 2.18 0 1 1 5.36 7.86 2.18 2.18 0 0 1 5.37 3.5ZM3.49 9.5h3.75v11H3.49v-11Zm5.98 0h3.6V11h.05c.5-.95 1.73-1.95 3.56-1.95 3.8 0 4.5 2.5 4.5 5.76v5.69h-3.75v-5.04c0-1.2-.02-2.75-1.68-2.75-1.68 0-1.94 1.31-1.94 2.66v5.13H9.47v-11Z" /></svg>
              <h2 className="mt-8 text-xl font-semibold tracking-[-0.03em] text-ink">LinkedIn</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{contact.linkedinDescription}</p>
              <span className="mt-6 inline-flex text-sm font-semibold text-ink">{contact.visitProfile} <span className="ml-2 transition group-hover:translate-x-1">→</span></span>
            </a>

            <a href="https://github.com/vieirasaul" target="_blank" rel="noreferrer" className="group rounded-3xl border border-black/[0.07] bg-white p-7 shadow-[0_12px_35px_rgba(17,24,39,0.04)] transition hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(17,24,39,0.08)]">
              <svg viewBox="0 0 24 24" className="size-7 text-ink" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.91-2.78.62-3.37-1.21-3.37-1.21-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.99a9.3 9.3 0 0 1 2.5.35c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.89 0 1.37-.01 2.47-.01 2.81 0 .27.18.59.69.49A10.23 10.23 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z" clipRule="evenodd" /></svg>
              <h2 className="mt-8 text-xl font-semibold tracking-[-0.03em] text-ink">GitHub</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{contact.githubDescription}</p>
              <span className="mt-6 inline-flex text-sm font-semibold text-ink">{contact.visitProfile} <span className="ml-2 transition group-hover:translate-x-1">→</span></span>
            </a>
          </div>
        </section>
      </main>
      <Footer content={dictionary.footer} locale={locale} />
    </div>
  );
}
