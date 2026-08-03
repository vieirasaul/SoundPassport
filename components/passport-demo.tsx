import type { Dictionary } from "@/i18n/get-dictionary";

type PassportDemoProps = {
  content: Dictionary["demoPassport"];
};

export function PassportDemo({ content }: PassportDemoProps) {
  return (
    <div className="passport-demo relative mx-auto w-full max-w-[480px] lg:mr-0">
      <div className="absolute -inset-10 -z-10 rounded-full bg-[#ede9df]/70 blur-3xl" />
      <input className="sr-only" type="radio" name="passport-demo-page" id="demo-identity" defaultChecked />
      <input className="sr-only" type="radio" name="passport-demo-page" id="demo-travel" />
      <input className="sr-only" type="radio" name="passport-demo-page" id="demo-anthems" />

      <div className="passport-demo-paper rotate-[1deg] rounded-[28px] bg-[#081a2b] p-2 shadow-[0_30px_80px_rgba(17,24,39,0.18)]">
        <div className="grid min-h-[460px] overflow-hidden rounded-[21px] border border-[#e6c979]/55 bg-[#112a42] text-[#f1d77f] [perspective:1200px]">
          <section className="passport-demo-page passport-demo-identity col-start-1 row-start-1 p-7">
            <header className="flex items-start justify-between border-b border-[#f1d77f]/30 pb-5">
              <div><p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{content.republic}</p><h2 className="mt-2 text-xl font-semibold uppercase tracking-[0.16em] text-[#fff0bd]">{content.passport}</h2></div>
              <span className="grid size-12 place-items-center rounded-full border border-[#f1d77f]/60 text-xl">♫</span>
            </header>
            <div className="mt-7 grid grid-cols-[105px_1fr] gap-6">
              <div className="aspect-[4/5] rounded-lg border border-[#f1d77f]/40 bg-[linear-gradient(145deg,#1f3d59,#65798d)] p-3"><div className="flex h-full items-end rounded border border-white/15 p-3 text-2xl">♫</div></div>
              <dl className="space-y-5">
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{content.citizen}</dt><dd className="mt-1 text-xl font-semibold text-[#fff0bd]">Alex Melody</dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{content.nationality}</dt><dd className="mt-1 text-sm font-semibold text-[#fff0bd]">Rock Citizen</dd></div>
                <div><dt className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#e4cd8b]">{content.anthem}</dt><dd className="mt-1 text-sm font-semibold text-[#fff0bd]">Midnight City · M83</dd></div>
              </dl>
            </div>
            <p className="mt-7 border-t border-[#f1d77f]/30 pt-5 font-mono text-[10px] tracking-[0.1em] text-[#f1d77f]/70">SP-0247 · MUS · LISTENER</p>
          </section>

          <section className="passport-demo-page passport-demo-travel col-start-1 row-start-1 p-7">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{content.republic}</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#fff0bd]">{content.travelTitle}</h2>
            <p className="mt-2 text-xs leading-5 text-[#f1d77f]/70">{content.travelDescription}</p>
            <div className="mt-7 grid grid-cols-2 gap-4">
              {content.destinations.map((destination, index) => (
                <div key={destination.name} className="min-h-28 rounded-lg border-2 border-[#f1d77f]/45 bg-[#f1d77f]/[0.08] p-4 even:rotate-1 odd:-rotate-1">
                  <span className="text-2xl">{destination.flag}</span>
                  <p className="mt-3 text-xs font-bold uppercase tracking-[0.05em] text-[#fff0bd]">{destination.name}</p>
                  <p className="mt-2 font-mono text-[8px] text-[#f1d77f]/60">VISA {String(index + 1).padStart(2, "0")}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="passport-demo-page passport-demo-anthems col-start-1 row-start-1 p-7">
            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e4cd8b]">{content.republic}</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#fff0bd]">{content.anthemsTitle}</h2>
            <p className="mt-2 text-xs leading-5 text-[#f1d77f]/70">{content.anthemsDescription}</p>
            <ol className="mt-7 space-y-3">
              {content.tracks.map((track, index) => (
                <li key={track.title} className="flex items-center gap-4 rounded-lg border border-[#f1d77f]/25 bg-[#081a2b]/35 p-3">
                  <span className="font-mono text-xs text-[#e4cd8b]">0{index + 1}</span>
                  <span className="grid size-10 place-items-center rounded-md bg-[#f1d77f]/10 text-lg">♫</span>
                  <div className="min-w-0"><p className="truncate text-sm font-semibold text-[#fff0bd]">{track.title}</p><p className="mt-0.5 truncate text-[10px] text-[#f1d77f]/65">{track.artist}</p></div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2" aria-label={content.previewLabel}>
        <label htmlFor="demo-identity" className="passport-demo-tab passport-demo-tab-identity">{content.identityTab}</label>
        <label htmlFor="demo-travel" className="passport-demo-tab passport-demo-tab-travel">{content.travelTab}</label>
        <label htmlFor="demo-anthems" className="passport-demo-tab passport-demo-tab-anthems">{content.anthemsTab}</label>
      </div>
    </div>
  );
}
