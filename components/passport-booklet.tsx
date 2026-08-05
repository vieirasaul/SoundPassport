"use client";

import { Archive, Download, Pause, Play } from "lucide-react";
import { Children, type PointerEvent as ReactPointerEvent, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

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
  shareInstagramLabel: string;
  shareSocialLabel: string;
  shareXLabel: string;
  shareText: string;
  shareFallbackLabel: string;
  createYoursLabel: string;
  shareUrl: string;
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
  shareInstagramLabel,
  shareSocialLabel,
  shareXLabel,
  shareText,
  shareFallbackLabel,
  createYoursLabel,
  shareUrl,
}: PassportBookletProps) {
  const pages = Children.toArray(children);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);
  const swipeRef = useRef<{ pointerId: number; startX: number; startY: number } | null>(null);
  const [activePage, setActivePage] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [timerKey, setTimerKey] = useState(0);
  const [exportState, setExportState] = useState<"idle" | "page" | "all" | "share" | "error">("idle");
  const [shareNotice, setShareNotice] = useState<string | null>(null);

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

  useEffect(() => {
    if (!shareNotice) return;
    const timeout = window.setTimeout(() => setShareNotice(null), 6_000);
    return () => window.clearTimeout(timeout);
  }, [shareNotice]);

  const goToPage = (page: number) => {
    selectPage(page);
    window.location.hash = `passport-page-${page + 1}`;
  };

  const selectPageManually = (page: number) => {
    setIsPlaying(false);
    selectPage(page);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("a, button, input, summary")) return;
    swipeRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    swipeRef.current = null;
    if (!swipe || swipe.pointerId !== event.pointerId) return;

    const horizontalDistance = event.clientX - swipe.startX;
    const verticalDistance = event.clientY - swipe.startY;
    if (Math.abs(horizontalDistance) < 48 || Math.abs(horizontalDistance) < Math.abs(verticalDistance) * 1.2) return;

    setIsPlaying(false);
    if (horizontalDistance < 0 && activePage < pages.length - 1) goToPage(activePage + 1);
    if (horizontalDistance > 0 && activePage > 0) goToPage(activePage - 1);
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
    if (exportState === "page" || exportState === "all" || exportState === "share") return;
    setIsPlaying(false);
    setExportState("page");
    try {
      saveBlob(await capturePage(activePage), `soundpassport-page-${activePage + 1}.png`);
      setExportState("idle");
    } catch (error) {
      console.error("Unable to download passport page", error);
      setExportState("error");
    }
  };

  const exportAllPages = async () => {
    if (exportState === "page" || exportState === "all" || exportState === "share") return;
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
    }
  };

  const shareToInstagram = async () => {
    if (exportState === "page" || exportState === "all" || exportState === "share") return;
    setIsPlaying(false);
    setShareNotice(null);
    setExportState("share");

    try {
      const image = await capturePage(activePage);
      const file = new File([image], `soundpassport-page-${activePage + 1}.png`, { type: "image/png" });
      const shareData = { files: [file], title: "SoundPassport", text: shareText };
      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobileDevice && navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        saveBlob(image, file.name);
        setShareNotice(shareFallbackLabel);
      }
      setExportState("idle");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setExportState("idle");
      } else {
        console.error("Unable to share passport page", error);
        setExportState("error");
      }
    }
  };

  const shareOnX = () => {
    if (exportState === "page" || exportState === "all" || exportState === "share") return;
    const postText = `${shareText}\n\n${createYoursLabel}`;
    setIsPlaying(false);
    setShareNotice(null);
    const xIntent = new URL("https://twitter.com/intent/tweet");
    xIntent.searchParams.set("text", postText);
    xIntent.searchParams.set("url", shareUrl);
    window.open(xIntent, "soundpassport-x-share", "popup,width=640,height=520,noopener,noreferrer");
  };

  const isExporting = exportState === "page" || exportState === "all" || exportState === "share";

  return (
    <div className="passport-booklet mx-auto grid w-full max-w-[620px] [perspective:1800px]">
      {pages.map((content, page) => (
        <section
          key={page}
          id={`passport-page-${page + 1}`}
          className={`passport-booklet-sheet col-start-1 row-start-1 ${page === 0 ? "passport-booklet-sheet-initial" : ""}`}
          aria-hidden={activePage !== page}
        >
          <div
            ref={(node) => { pageRefs.current[page] = node; }}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => { swipeRef.current = null; }}
            className="passport-booklet-paper cursor-grab touch-pan-y select-none rounded-[22px] bg-[#081a2b] p-1.5 shadow-[0_24px_70px_rgba(8,26,43,0.26)] active:cursor-grabbing sm:rounded-[30px] sm:p-2 sm:shadow-[0_38px_100px_rgba(8,26,43,0.3)]"
          >
            <div className="h-[720px] overflow-hidden rounded-[17px] border border-[#e6c979]/60 bg-[#112a42] text-[#f1d77f] sm:h-[700px] sm:rounded-[24px]">
              <div className="h-full overflow-hidden">
                {content}
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5" aria-label={shareSocialLabel}>
            <span className="w-full text-center text-[11px] font-semibold text-muted sm:mr-1 sm:w-auto sm:text-xs">{shareSocialLabel}</span>
            <button
              type="button"
              onClick={shareToInstagram}
              disabled={isExporting}
              className="group relative inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[radial-gradient(circle_at_20%_130%,#fdf497_0%,#fd5949_36%,#d6249f_62%,#285aeb_100%)] px-4 text-xs font-bold text-white shadow-[0_7px_20px_rgba(214,36,159,0.3)] transition duration-200 hover:scale-[1.03] hover:shadow-[0_9px_24px_rgba(214,36,159,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d6249f] disabled:cursor-wait disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.4" cy="6.7" r="1" fill="currentColor" stroke="none" />
              </svg>
              {exportState === "share" ? downloadingLabel : shareInstagramLabel}
            </button>
            <button
              type="button"
              onClick={shareOnX}
              disabled={isExporting}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-black px-4 text-xs font-bold text-white shadow-sm transition hover:scale-[1.03] hover:bg-[#222] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:cursor-wait disabled:opacity-50"
            >
              <span className="text-base leading-none" aria-hidden="true">𝕏</span>
              {shareXLabel}
            </button>
            <button
              type="button"
              onClick={exportPage}
              disabled={isExporting}
              className="group relative grid size-10 cursor-pointer place-items-center rounded-full border border-black/[0.09] bg-white text-ink shadow-sm transition hover:border-black/[0.18] hover:bg-black/[0.02] disabled:cursor-wait disabled:opacity-50"
              aria-label={downloadPageLabel}
              title={downloadPageLabel}
            >
              <Download className="size-4" aria-hidden="true" />
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#111827] px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{downloadPageLabel}</span>
            </button>
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

          <nav className="mt-3 flex items-center justify-between gap-2" aria-label={pageLabel}>
            {page === 0 ? (
              <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-black/[0.09] bg-white px-3 text-sm font-semibold text-ink opacity-35 sm:px-4">← <span className="hidden sm:ml-1 sm:inline">{previousLabel}</span></span>
            ) : (
              <a href={`#passport-page-${page}`} onClick={() => selectPageManually(page - 1)} aria-label={previousLabel} className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-black/[0.09] bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:border-black/[0.16] sm:px-4">← <span className="hidden sm:ml-1 sm:inline">{previousLabel}</span></a>
            )}

            <div className="flex items-center gap-2">
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
                  onClick={() => selectPageManually(index)}
                  aria-label={`${pageLabel} ${index + 1}`}
                  aria-current={page === index ? "page" : undefined}
                  className="hidden size-2.5 rounded-full bg-black/15 transition aria-[current=page]:scale-125 aria-[current=page]:bg-[#112a42] sm:block"
                />
              ))}
              <span className="ml-2 text-xs font-medium tabular-nums text-muted">{page + 1} / {pages.length}</span>
              <span className="sr-only" aria-live="polite">{isExporting ? downloadingLabel : exportState === "error" ? downloadErrorLabel : shareNotice ?? ""}</span>
            </div>

            {page === pages.length - 1 ? (
              <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-black/[0.09] bg-white px-3 text-sm font-semibold text-ink opacity-35 sm:px-4"><span className="hidden sm:mr-1 sm:inline">{nextLabel}</span> →</span>
            ) : (
              <a href={`#passport-page-${page + 2}`} onClick={() => selectPageManually(page + 1)} aria-label={nextLabel} className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-black/[0.09] bg-white px-3 text-sm font-semibold text-ink shadow-sm transition hover:border-black/[0.16] sm:px-4"><span className="hidden sm:mr-1 sm:inline">{nextLabel}</span> →</a>
            )}
          </nav>
          {shareNotice ? (
            <div className="fixed bottom-6 left-1/2 z-50 w-[min(90vw,420px)] -translate-x-1/2 rounded-xl bg-[#111827] px-4 py-3 text-center text-xs font-medium leading-5 text-white shadow-2xl" role="status">
              {shareNotice}
            </div>
          ) : null}
        </section>
      ))}
    </div>
  );
}
