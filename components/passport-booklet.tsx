"use client";

import { Archive, Download, Pause, Play } from "lucide-react";
import { Children, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

type PassportBookletProps = {
  children: ReactNode;
  previousLabel: string;
  nextLabel: string;
  pageLabel: string;
  playLabel: string;
  pauseLabel: string;
  progressLabel: string;
  downloadPageLabel: string;
  downloadAllLabel: string;
  downloadingLabel: string;
  downloadErrorLabel: string;
};

const pageDuration = 10_000;

export function PassportBooklet({
  children,
  previousLabel,
  nextLabel,
  pageLabel,
  playLabel,
  pauseLabel,
  progressLabel,
  downloadPageLabel,
  downloadAllLabel,
  downloadingLabel,
  downloadErrorLabel,
}: PassportBookletProps) {
  const pages = Children.toArray(children);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [activePage, setActivePage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [timerKey, setTimerKey] = useState(0);
  const [exportState, setExportState] = useState<"idle" | "page" | "all" | "error">("idle");

  const selectPage = useCallback((page: number) => {
    setActivePage(page);
    setTimerKey((key) => key + 1);
  }, []);

  useEffect(() => {
    const getPageFromHash = () => {
      const match = window.location.hash.match(/^#passport-page-(\d+)$/);
      const page = match ? Number(match[1]) - 1 : 0;
      selectPage(Math.min(Math.max(page, 0), pages.length - 1));
    };

    getPageFromHash();
    window.addEventListener("hashchange", getPageFromHash);
    return () => window.removeEventListener("hashchange", getPageFromHash);
  }, [pages.length, selectPage]);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const applyInitialPreferences = window.setTimeout(() => {
      if (reducedMotion.matches) setIsPlaying(false);
      setIsDocumentVisible(!document.hidden);
    }, 0);

    const handleReducedMotion = (event: MediaQueryListEvent) => {
      if (event.matches) setIsPlaying(false);
    };
    const handleVisibility = () => setIsDocumentVisible(!document.hidden);
    reducedMotion.addEventListener("change", handleReducedMotion);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearTimeout(applyInitialPreferences);
      reducedMotion.removeEventListener("change", handleReducedMotion);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const goToPage = (page: number) => {
    selectPage(page);
    window.location.hash = `passport-page-${page + 1}`;
  };

  const handleProgressComplete = () => {
    if (!isPlaying || !isDocumentVisible) return;

    if (activePage < pages.length - 1) {
      goToPage(activePage + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlayback = () => {
    if (!isPlaying && activePage === pages.length - 1) {
      goToPage(0);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((playing) => !playing);
  };

  const progressIsRunning = isPlaying && isDocumentVisible;

  const capturePage = async (page: number) => {
    const node = pageRefs.current[page];
    if (!node) throw new Error("Passport page is unavailable");

    await document.fonts.ready;
    await Promise.all(
      Array.from(node.querySelectorAll("img")).map((image) =>
        image.complete ? Promise.resolve() : image.decode().catch(() => undefined),
      ),
    );

    node.classList.add("passport-export-page");
    try {
      const { toBlob } = await import("html-to-image");
      const blob = await toBlob(node, {
        backgroundColor: "#081a2b",
        cacheBust: true,
        pixelRatio: 2,
        style: { visibility: "visible" },
      });
      if (!blob) throw new Error("Unable to create passport image");
      return blob;
    } finally {
      node.classList.remove("passport-export-page");
    }
  };

  const saveBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  };

  const exportPage = async () => {
    if (exportState === "page" || exportState === "all") return;
    const resumePlayback = isPlaying;
    setIsPlaying(false);
    setExportState("page");
    try {
      saveBlob(await capturePage(activePage), `soundpassport-page-${activePage + 1}.png`);
      setExportState("idle");
    } catch (error) {
      console.error("Unable to download passport page", error);
      setExportState("error");
    } finally {
      if (resumePlayback) setIsPlaying(true);
    }
  };

  const exportAllPages = async () => {
    if (exportState === "page" || exportState === "all") return;
    const resumePlayback = isPlaying;
    setIsPlaying(false);
    setExportState("all");
    try {
      const [{ default: JSZip }, pageImages] = await Promise.all([
        import("jszip"),
        Promise.all(pages.map((_, page) => capturePage(page))),
      ]);
      const zip = new JSZip();
      pageImages.forEach((image, page) => {
        zip.file(`soundpassport-page-${String(page + 1).padStart(2, "0")}.png`, image);
      });
      saveBlob(await zip.generateAsync({ type: "blob" }), "soundpassport-pages.zip");
      setExportState("idle");
    } catch (error) {
      console.error("Unable to download passport pages", error);
      setExportState("error");
    } finally {
      if (resumePlayback) setIsPlaying(true);
    }
  };

  const isExporting = exportState === "page" || exportState === "all";

  return (
    <div className="passport-booklet mx-auto grid max-w-[620px] [perspective:1800px]">
      {pages.map((content, page) => (
        <section
          key={page}
          id={`passport-page-${page + 1}`}
          className={`passport-booklet-sheet col-start-1 row-start-1 ${page === 0 ? "passport-booklet-sheet-initial" : ""}`}
          aria-hidden={activePage !== page}
        >
          <div ref={(node) => { pageRefs.current[page] = node; }} className="passport-booklet-paper rounded-[30px] bg-[#081a2b] p-2 shadow-[0_38px_100px_rgba(8,26,43,0.3)]">
            <div className="h-[700px] overflow-hidden rounded-[24px] border border-[#e6c979]/60 bg-[#112a42] text-[#f1d77f]">
              <div className="h-full overflow-y-auto overscroll-contain [scrollbar-color:rgba(241,215,127,0.35)_transparent] [scrollbar-width:thin]">
                {content}
              </div>
            </div>
          </div>

          <div className="mt-3 h-1 overflow-hidden rounded-full bg-black/[0.08]" aria-label={`${progressLabel}: ${page + 1}`}>
            <div
              key={`${page}-${timerKey}`}
              className={page === activePage ? "passport-autoplay-progress h-full rounded-full bg-[#b1872c]" : "h-full w-0"}
              style={{
                animationDuration: `${pageDuration}ms`,
                animationPlayState: progressIsRunning ? "running" : "paused",
              }}
              onAnimationEnd={page === activePage ? handleProgressComplete : undefined}
            />
          </div>

          <nav className="mt-3 flex items-center justify-between" aria-label={pageLabel}>
            {page === 0 ? (
              <span className="rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-sm font-semibold text-ink opacity-35">← {previousLabel}</span>
            ) : (
              <a href={`#passport-page-${page}`} onClick={() => selectPage(page - 1)} className="rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:border-black/[0.16]">← {previousLabel}</a>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportPage}
                disabled={isExporting}
                aria-label={exportState === "page" ? downloadingLabel : downloadPageLabel}
                title={downloadPageLabel}
                className="group relative grid size-8 cursor-pointer place-items-center rounded-full border border-black/[0.09] bg-white text-ink shadow-sm transition hover:border-black/[0.16] hover:bg-black/[0.02] disabled:cursor-wait disabled:opacity-50"
              >
                <Download className="size-3.5" aria-hidden="true" />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#111827] px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {downloadPageLabel}
                </span>
              </button>
              <button
                type="button"
                onClick={exportAllPages}
                disabled={isExporting}
                aria-label={exportState === "all" ? downloadingLabel : downloadAllLabel}
                title={downloadAllLabel}
                className="group relative grid size-8 cursor-pointer place-items-center rounded-full border border-black/[0.09] bg-white text-ink shadow-sm transition hover:border-black/[0.16] hover:bg-black/[0.02] disabled:cursor-wait disabled:opacity-50"
              >
                <Archive className="size-3.5" aria-hidden="true" />
                <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#111827] px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                  {downloadAllLabel}
                </span>
              </button>
              <button
                type="button"
                onClick={togglePlayback}
                aria-label={isPlaying ? pauseLabel : playLabel}
                title={isPlaying ? pauseLabel : playLabel}
                className="mr-1 grid size-8 cursor-pointer place-items-center rounded-full border border-black/[0.09] bg-white text-ink shadow-sm transition hover:border-black/[0.16] hover:bg-black/[0.02]"
              >
                {isPlaying ? <Pause className="size-3.5" fill="currentColor" aria-hidden="true" /> : <Play className="size-3.5 translate-x-px" fill="currentColor" aria-hidden="true" />}
              </button>
              {pages.map((_, index) => (
                <a
                  key={index}
                  href={`#passport-page-${index + 1}`}
                  onClick={() => selectPage(index)}
                  aria-label={`${pageLabel} ${index + 1}`}
                  aria-current={page === index ? "page" : undefined}
                  className="size-2.5 rounded-full bg-black/15 transition aria-[current=page]:scale-125 aria-[current=page]:bg-[#112a42]"
                />
              ))}
              <span className="ml-2 text-xs font-medium tabular-nums text-muted">{page + 1} / {pages.length}</span>
              <span className="sr-only" aria-live="polite">{isExporting ? downloadingLabel : exportState === "error" ? downloadErrorLabel : ""}</span>
            </div>

            {page === pages.length - 1 ? (
              <span className="rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-sm font-semibold text-ink opacity-35">{nextLabel} →</span>
            ) : (
              <a href={`#passport-page-${page + 2}`} onClick={() => selectPage(page + 1)} className="rounded-xl border border-black/[0.09] bg-white px-4 py-2.5 text-sm font-semibold text-ink shadow-sm transition hover:border-black/[0.16]">{nextLabel} →</a>
            )}
          </nav>
        </section>
      ))}
    </div>
  );
}
