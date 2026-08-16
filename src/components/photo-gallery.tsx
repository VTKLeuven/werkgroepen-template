"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { photoUrl } from "@/lib/format";

export type GalleryPhoto = {
  id: string;
  width: number;
  height: number;
  originalName: string;
};

/**
 * The photo grid plus its lightbox.
 *
 * Thumbnails carry their real aspect ratio so the grid does not reflow as the
 * images arrive, and the full-size file is only requested when a photo is
 * actually opened -- a visitor browsing an album of 300 photos downloads 300
 * thumbnails of ~40 KB, not 300 JPEGs of ~600 KB.
 */
export function PhotoGallery({
  photos,
  labels,
}: {
  photos: GalleryPhoto[];
  labels: {
    open: string;
    close: string;
    previous: string;
    next: string;
  };
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const isOpen = openIndex !== null;

  const close = useCallback(() => setOpenIndex(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenIndex((current) =>
        current === null
          ? current
          : (current + delta + photos.length) % photos.length,
      ),
    [photos.length],
  );

  useEffect(() => {
    if (!isOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }

    // Stop the page behind the lightbox from scrolling with it.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, close, step]);

  const active = openIndex === null ? null : photos[openIndex];

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(index)}
            aria-label={`${labels.open} ${index + 1}`}
            className="group aspect-square overflow-hidden rounded-2xl bg-[var(--surface)] shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl(photo.id, "thumb") ?? ""}
              alt=""
              loading="lazy"
              width={photo.width}
              height={photo.height}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.originalName}
          onClick={close}
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoUrl(active.id) ?? ""}
            alt={active.originalName}
            onClick={(event) => event.stopPropagation()}
            className="max-h-[88vh] max-w-full rounded-lg object-contain"
          />

          <button
            type="button"
            onClick={close}
            aria-label={labels.close}
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <X size={22} />
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                aria-label={labels.previous}
                className="absolute left-3 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white sm:left-6"
              >
                <ChevronLeft size={26} />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                aria-label={labels.next}
                className="absolute right-3 grid h-12 w-12 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white sm:right-6"
              >
                <ChevronRight size={26} />
              </button>
              <p className="absolute bottom-5 rounded-full bg-black/50 px-4 py-1.5 text-sm font-semibold text-white">
                {(openIndex ?? 0) + 1} / {photos.length}
              </p>
            </>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
