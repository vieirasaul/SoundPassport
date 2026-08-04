import Link from "next/link";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

type FooterProps = {
  content: Dictionary["footer"];
  locale: Locale;
};

export function Footer({ content, locale }: FooterProps) {
  return (
    <footer className="mx-auto mt-auto w-full max-w-7xl px-6 pb-6 lg:px-8">
      <div className="grid items-center gap-3 border-t border-black/[0.06] pt-5 text-center text-xs text-muted sm:grid-cols-[1fr_auto_1fr] sm:text-left">
        <p>{content.tagline}</p>
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span>{content.madeBy} Saul Vieira</span>
          <a
            href="https://github.com/vieirasaul"
            target="_blank"
            rel="noreferrer"
            aria-label="Saul Vieira on GitHub"
            className="inline-flex rounded-md p-1 text-ink transition hover:bg-black/[0.05] hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
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
            <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
              <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V8.98h3.42v1.57h.05c.47-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29ZM5.32 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13Zm1.78 13.04H3.54V8.98H7.1v11.47Z" />
            </svg>
          </a>
        </div>
        <div className="flex items-center justify-center gap-4 sm:justify-end">
          <p>{content.features}</p>
          <Link href={`/${locale}/privacy`} className="font-medium text-ink underline decoration-black/20 underline-offset-4 transition hover:decoration-black">
            {content.privacy}
          </Link>
        </div>
      </div>
    </footer>
  );
}
