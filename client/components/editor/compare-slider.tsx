"use client";

import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type CompareMode = "after" | "before" | "compare";

type CompareSliderProps = {
  beforeSrc: string;
  afterSrc: string | null;
  alt: string;
  mode: CompareMode;
  /** Fires once the "after" image is decoded, with its intrinsic size. */
  onAfterLoad?: (size: { width: number; height: number }) => void;
  onAfterError?: () => void;
  className?: string;
};

/**
 * Before/after view. Both renditions are laid out in the same box with
 * `object-contain`; in compare mode the "after" image is clipped at a
 * draggable divider that is also keyboard operable.
 */
export function CompareSlider({
  beforeSrc,
  afterSrc,
  alt,
  mode,
  onAfterLoad,
  onAfterError,
  className,
}: CompareSliderProps) {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const labelId = useId();

  const updateFromPointer = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }, []);

  const showAfter = mode !== "before" && afterSrc !== null;
  const showBefore = mode !== "after" || afterSrc === null;
  const compare = mode === "compare" && afterSrc !== null;

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full touch-none select-none", className)}
      onPointerDown={(event) => {
        if (!compare) return;
        draggingRef.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        updateFromPointer(event.clientX);
      }}
      onPointerMove={(event) => {
        if (draggingRef.current) updateFromPointer(event.clientX);
      }}
      onPointerUp={(event) => {
        draggingRef.current = false;
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      {showBefore && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={beforeSrc}
          alt={compare ? `${alt} (before)` : alt}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
        />
      )}
      {afterSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={afterSrc}
          src={afterSrc}
          alt={compare ? `${alt} (after)` : alt}
          className={cn(
            "absolute inset-0 h-full w-full object-contain",
            !showAfter && "invisible",
          )}
          style={compare ? { clipPath: `inset(0 0 0 ${position}%)` } : undefined}
          draggable={false}
          onLoad={(event) => {
            const img = event.currentTarget;
            onAfterLoad?.({ width: img.naturalWidth, height: img.naturalHeight });
          }}
          onError={() => onAfterError?.()}
        />
      )}

      {compare && (
        <>
          <span className="pointer-events-none absolute top-3 left-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            Before
          </span>
          <span className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            After
          </span>
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.35)]"
            style={{ left: `${position}%` }}
            aria-hidden="true"
          />
          <span id={labelId} className="sr-only">
            Comparison divider
          </span>
          <button
            type="button"
            role="slider"
            aria-labelledby={labelId}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            aria-valuetext={`${Math.round(position)}% before`}
            onKeyDown={(event) => {
              const delta = event.shiftKey ? 10 : 2;
              if (event.key === "ArrowLeft") setPosition((p) => Math.max(0, p - delta));
              if (event.key === "ArrowRight") setPosition((p) => Math.min(100, p + delta));
              if (event.key === "Home") setPosition(0);
              if (event.key === "End") setPosition(100);
            }}
            className="absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-black/20 bg-white text-black shadow-md outline-none focus-visible:ring-2 focus-visible:ring-primary"
            style={{ left: `${position}%` }}
          >
            <svg viewBox="0 0 20 20" className="size-4" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M7 5l-4 5 4 5M13 5l4 5-4 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </>
      )}
    </div>
  );
}
