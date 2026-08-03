import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { SpotifySession } from "@/lib/auth/spotify";

type SpotifyAuthProps = {
  locale: Locale;
  session: SpotifySession | null;
  labels: Dictionary["auth"];
};

function SpotifyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 1.5A10.5 10.5 0 1 0 12 22.5 10.5 10.5 0 0 0 12 1.5Zm4.82 15.14a.65.65 0 0 1-.9.21c-2.47-1.51-5.58-1.85-9.24-1.01a.65.65 0 1 1-.29-1.27c4-.91 7.44-.52 10.22 1.18.31.19.4.59.21.89Zm1.28-2.85a.81.81 0 0 1-1.12.27c-2.83-1.74-7.15-2.24-10.5-1.23a.81.81 0 1 1-.47-1.56c3.83-1.16 8.59-.6 11.82 1.39.38.23.5.74.27 1.13Zm.11-2.97C14.82 8.8 9.22 8.61 5.99 9.58a.98.98 0 0 1-.56-1.87c3.71-1.12 9.9-.89 13.78 1.41a.98.98 0 0 1-1 1.7Z" />
    </svg>
  );
}

export function SpotifyAuth({ locale, session, labels }: SpotifyAuthProps) {
  if (!session) {
    return (
      <a
        href={`/api/auth/spotify/login?locale=${locale}`}
        className="inline-flex items-center gap-2.5 rounded-xl bg-[#1DB954] px-5 py-3 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(29,185,84,0.28)] transition hover:-translate-y-0.5 hover:bg-[#1AA34A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1DB954]"
      >
        <SpotifyIcon />
        {labels.connect}
      </a>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex items-center gap-2.5 rounded-xl border border-[#1DB954]/20 bg-[#1DB954]/[0.08] px-4 py-2.5 text-sm text-ink">
        <span className="text-[#1DB954]">
          <SpotifyIcon />
        </span>
        <span>
          {labels.connectedAs}{" "}
          <strong className="font-semibold">{session.profile.displayName}</strong>
        </span>
      </div>
      <form action="/api/auth/spotify/logout" method="post">
        <input type="hidden" name="locale" value={locale} />
        <button
          type="submit"
          className="rounded-lg px-3 py-2 text-sm font-medium text-muted transition hover:bg-black/[0.04] hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {labels.disconnect}
        </button>
      </form>
    </div>
  );
}
