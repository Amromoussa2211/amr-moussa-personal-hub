"use client";

import Image from "next/image";
import { useState } from "react";

export type GalleryPhoto = { src: string; alt: string };

export function PhotoGallery({ photos }: { photos: GalleryPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-3">
        {photos.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-hairline bg-surface"
            aria-label={`Enlarge photo ${i + 1}`}
          >
            <Image
              src={p.src}
              alt={p.alt}
              fill
              sizes="(min-width: 640px) 240px, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 p-5"
          role="dialog"
          aria-modal="true"
          aria-label="Photo viewer"
          onClick={() => setOpen(null)}
        >
          <div className="relative max-h-[85vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={photos[open].src}
              alt={photos[open].alt}
              width={1200}
              height={900}
              className="max-h-[85vh] w-auto rounded-2xl object-contain"
            />
            <p className="mt-3 text-center text-[13px] text-paper/80">{photos[open].alt}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(null)}
            aria-label="Close photo viewer"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full border border-paper/30 text-paper transition-colors hover:bg-paper/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
}
