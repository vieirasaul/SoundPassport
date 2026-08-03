"use client";

import { usePathname } from "next/navigation";

const loadingLabels = {
  en: "Preparing your SoundPassport…",
  "pt-BR": "Preparando seu SoundPassport…",
  es: "Preparando tu SoundPassport…",
};

export function PassportLoading() {
  const pathname = usePathname();
  const locale = pathname.split("/")[1] as keyof typeof loadingLabels;
  const label = loadingLabels[locale] ?? loadingLabels.en;

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6">
      <div className="text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl border border-black/[0.08] bg-white shadow-[0_12px_35px_rgba(17,24,39,0.08)]">
          <span className="text-2xl text-[#1DB954]">♫</span>
        </div>
        <p className="mt-6 text-sm font-medium text-ink">{label}</p>
        <div className="mx-auto mt-4 h-1 w-28 overflow-hidden rounded-full bg-black/[0.06]">
          <div className="passport-loading-bar h-full w-1/2 rounded-full bg-[#1DB954]" />
        </div>
      </div>
    </main>
  );
}
