import { Children, type ReactNode } from "react";

type PassportBookletProps = {
  children: ReactNode;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
};

export function PassportBooklet({
  children,
  previousLabel,
  nextLabel,
  pageLabel,
}: PassportBookletProps) {
  const pages = Children.toArray(children);

  return (
    <div className="passport-booklet mx-auto grid max-w-[620px] [perspective:1800px]">
      {pages.map((content, page) => (
        <section
          key={page}
          id={`passport-page-${page + 1}`}
          className={`passport-booklet-sheet col-start-1 row-start-1 ${page === 0 ? "passport-booklet-sheet-initial" : ""}`}
        >
          <div className="passport-booklet-paper rounded-[30px] bg-[#081a2b] p-2 shadow-[0_38px_100px_rgba(8,26,43,0.3)]">
            <div className="min-h-[700px] overflow-hidden rounded-[24px] border border-[#e6c979]/60 bg-[#112a42] text-[#f1d77f]">
              {content}
            </div>
          </div>

          <nav className="mt-6 flex items-center justify-between" aria-label={pageLabel}>
            {page === 0 ? (
              <span className="rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-sm font-semibold text-ink opacity-35">← {previousLabel}</span>
            ) : (
              <a href={`#passport-page-${page}`} className="rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:border-black/[0.16]">← {previousLabel}</a>
            )}

            <div className="flex items-center gap-2">
              {pages.map((_, index) => (
                <a
                  key={index}
                  href={`#passport-page-${index + 1}`}
                  aria-label={`${pageLabel} ${index + 1}`}
                  aria-current={page === index ? "page" : undefined}
                  className="size-2.5 rounded-full bg-black/15 transition aria-[current=page]:scale-125 aria-[current=page]:bg-[#112a42]"
                />
              ))}
              <span className="ml-2 text-xs font-medium tabular-nums text-muted">{page + 1} / {pages.length}</span>
            </div>

            {page === pages.length - 1 ? (
              <span className="rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-sm font-semibold text-ink opacity-35">{nextLabel} →</span>
            ) : (
              <a href={`#passport-page-${page + 2}`} className="rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:border-black/[0.16]">{nextLabel} →</a>
            )}
          </nav>
        </section>
      ))}
    </div>
  );
}
