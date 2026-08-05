import Image from "next/image";
import type { CSSProperties } from "react";

type ArtistSealProps = {
  artist: {
    id: string;
    name: string;
    imageUrl: string | null;
    spotifyUrl: string;
  };
  office: string;
  rank: number;
  openLabel: string;
  featured?: boolean;
  delay?: number;
};

function sealRotation(id: string) {
  const total = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return `${(total % 7) - 3}deg`;
}

export function ArtistSeal({
  artist,
  office,
  rank,
  openLabel,
  featured = false,
  delay = 0,
}: ArtistSealProps) {
  const style = {
    "--seal-rotation": sealRotation(artist.id),
    "--seal-delay": `${delay}ms`,
  } as CSSProperties;

  return (
    <a
      href={artist.spotifyUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`${openLabel}: ${artist.name}`}
      className={`artist-seal group relative grid aspect-square shrink-0 place-items-center rounded-full border-[6px] border-double border-[#f1d77f]/80 bg-[#0b2237] text-center shadow-[0_14px_34px_rgba(0,0,0,0.28),inset_0_0_0_6px_rgba(241,215,127,0.12)] transition hover:border-[#fff0bd] ${featured ? "w-[225px] sm:w-[260px]" : "w-[138px] sm:w-[210px]"}`}
      style={style}
    >
      <span className="absolute inset-[8px] rounded-full border border-dashed border-[#f1d77f]/45" />

      <span className={`absolute top-[8%] z-10 flex max-w-[70%] items-center justify-center font-serif font-extrabold uppercase tracking-[0.04em] text-[#fff0bd] drop-shadow-[0_1px_1px_#081a2b] ${featured ? "min-h-9 text-sm leading-[1.05] sm:min-h-11 sm:text-base" : "min-h-7 text-[10px] leading-[1.05] sm:min-h-9 sm:text-sm"}`}>
        <span className="text-balance break-words">{artist.name}</span>
      </span>

      <span className={`relative overflow-hidden rounded-full border-[3px] border-[#f1d77f]/55 bg-[#183652] ${featured ? "size-[118px] sm:size-[136px]" : "size-[76px] sm:size-[104px]"}`}>
        {artist.imageUrl ? (
          <Image
            src={artist.imageUrl}
            alt={artist.name}
            fill
            sizes={featured ? "136px" : "104px"}
            loading={featured ? "eager" : "lazy"}
            fetchPriority={featured ? "high" : "auto"}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="grid h-full place-items-center text-3xl text-[#f1d77f]">♫</span>
        )}
      </span>

      <span className={`absolute bottom-[7%] z-10 flex max-w-[70%] items-center justify-center font-serif font-bold uppercase tracking-[0.03em] text-[#e4cd8b] drop-shadow-[0_1px_1px_#081a2b] ${featured ? "min-h-8 text-[11px] leading-[1.05] sm:min-h-10 sm:text-sm" : "min-h-7 text-[9px] leading-[1.05] sm:min-h-9 sm:text-xs"}`}>
        <span className="text-balance break-words">{office}</span>
      </span>

      <span className="absolute left-[5%] top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full border-2 border-[#f1d77f]/60 bg-[#112a42] font-mono text-[10px] font-bold text-[#fff0bd] sm:size-10 sm:text-xs">
        {String(rank).padStart(2, "0")}
      </span>
    </a>
  );
}
