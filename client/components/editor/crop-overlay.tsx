"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Photo } from "@/lib/api";
import { cn } from "@/lib/utils";

export type CropRect = { x: number; y: number; width: number; height: number };

type Handle = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

type CropOverlayProps = {
  photo: Photo;
  value: CropRect;
  /** Width / height to lock the region to, or null for free-form. */
  aspect: number | null;
  onChange: (rect: CropRect, transient: boolean) => void;
};

const MIN_SIZE = 8;

function clampRect(rect: CropRect, bounds: { width: number; height: number }): CropRect {
  const width = Math.max(MIN_SIZE, Math.min(rect.width, bounds.width));
  const height = Math.max(MIN_SIZE, Math.min(rect.height, bounds.height));
  const x = Math.min(Math.max(0, rect.x), bounds.width - width);
  const y = Math.min(Math.max(0, rect.y), bounds.height - height);
  return { x: Math.round(x), y: Math.round(y), width: Math.round(width), height: Math.round(height) };
}

/** Fits a rectangle to the aspect ratio by shrinking the longer side, keeping the anchor corner fixed. */
function applyAspect(rect: CropRect, aspect: number, handle: Handle): CropRect {
  let { width, height } = rect;
  if (width / height > aspect) width = height * aspect;
  else height = width / aspect;
  const x = handle.includes("w") ? rect.x + rect.width - width : rect.x;
  const y = handle.includes("n") ? rect.y + rect.height - height : rect.y;
  return { x, y, width, height };
}

const handles: Array<{ id: Handle; className: string; cursor: string }> = [
  { id: "nw", className: "-top-1.5 -left-1.5", cursor: "cursor-nwse-resize" },
  { id: "ne", className: "-top-1.5 -right-1.5", cursor: "cursor-nesw-resize" },
  { id: "sw", className: "-bottom-1.5 -left-1.5", cursor: "cursor-nesw-resize" },
  { id: "se", className: "-bottom-1.5 -right-1.5", cursor: "cursor-nwse-resize" },
  { id: "n", className: "-top-1.5 left-1/2 -translate-x-1/2", cursor: "cursor-ns-resize" },
  { id: "s", className: "-bottom-1.5 left-1/2 -translate-x-1/2", cursor: "cursor-ns-resize" },
  { id: "w", className: "top-1/2 -left-1.5 -translate-y-1/2", cursor: "cursor-ew-resize" },
  { id: "e", className: "top-1/2 -right-1.5 -translate-y-1/2", cursor: "cursor-ew-resize" },
];

/**
 * Interactive crop region drawn over the original image. Coordinates are kept
 * in original-image pixels; the overlay converts to and from the rendered size.
 */
export function CropOverlay({ photo, value, aspect, onChange }: CropOverlayProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [rendered, setRendered] = useState({ width: 0, height: 0 });
  const [natural, setNatural] = useState({ width: photo.width ?? 0, height: photo.height ?? 0 });
  const dragRef = useRef<{
    mode: "move" | Handle;
    startX: number;
    startY: number;
    origin: CropRect;
  } | null>(null);

  // Track the rendered size of the image so the overlay scales with the viewport.
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    const update = () => setRendered({ width: img.clientWidth, height: img.clientHeight });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(img);
    return () => observer.disconnect();
  }, []);

  const scale = natural.width > 0 && rendered.width > 0 ? rendered.width / natural.width : 0;
  const bounds = natural;

  const commit = useCallback(
    (rect: CropRect, transient: boolean) => onChange(clampRect(rect, bounds), transient),
    [bounds, onChange],
  );

  const onPointerMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || scale === 0) return;
    const dx = (event.clientX - drag.startX) / scale;
    const dy = (event.clientY - drag.startY) / scale;
    const { origin } = drag;

    if (drag.mode === "move") {
      commit({ ...origin, x: origin.x + dx, y: origin.y + dy }, true);
      return;
    }

    let { x, y, width, height } = origin;
    const handle = drag.mode;
    if (handle.includes("e")) width = Math.max(MIN_SIZE, origin.width + dx);
    if (handle.includes("s")) height = Math.max(MIN_SIZE, origin.height + dy);
    if (handle.includes("w")) {
      width = Math.max(MIN_SIZE, origin.width - dx);
      x = origin.x + origin.width - width;
    }
    if (handle.includes("n")) {
      height = Math.max(MIN_SIZE, origin.height - dy);
      y = origin.y + origin.height - height;
    }
    // Keep the region inside the image before applying the ratio so it never escapes.
    if (x < 0) {
      width += x;
      x = 0;
    }
    if (y < 0) {
      height += y;
      y = 0;
    }
    width = Math.min(width, bounds.width - x);
    height = Math.min(height, bounds.height - y);

    let next: CropRect = { x, y, width, height };
    if (aspect) next = applyAspect(next, aspect, handle);
    commit(next, true);
  };

  const endDrag = (event: React.PointerEvent) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    (event.currentTarget as HTMLElement).releasePointerCapture?.(event.pointerId);
    commit(value, false);
  };

  const beginDrag = (event: React.PointerEvent, mode: "move" | Handle) => {
    event.preventDefault();
    event.stopPropagation();
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragRef.current = { mode, startX: event.clientX, startY: event.clientY, origin: value };
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 10 : 1;
    const moves: Record<string, Partial<CropRect>> = {
      ArrowLeft: { x: value.x - step },
      ArrowRight: { x: value.x + step },
      ArrowUp: { y: value.y - step },
      ArrowDown: { y: value.y + step },
    };
    const patch = moves[event.key];
    if (!patch) return;
    event.preventDefault();
    commit({ ...value, ...patch }, false);
  };

  const box = {
    left: value.x * scale,
    top: value.y * scale,
    width: value.width * scale,
    height: value.height * scale,
  };

  return (
    <div className="relative inline-block max-h-full max-w-full overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={photo.url}
        alt={photo.fileName}
        className="block max-h-[calc(100svh-14rem)] max-w-full object-contain select-none lg:max-h-[calc(100svh-9rem)]"
        draggable={false}
        onLoad={(event) => {
          const img = event.currentTarget;
          if (!photo.width || !photo.height) {
            setNatural({ width: img.naturalWidth, height: img.naturalHeight });
          }
          setRendered({ width: img.clientWidth, height: img.clientHeight });
        }}
      />
      {scale > 0 && (
        <div
          className="absolute inset-0"
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <div
            role="group"
            aria-label={`Crop region ${value.width} by ${value.height} pixels at ${value.x}, ${value.y}. Use arrow keys to move.`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={(event) => beginDrag(event, "move")}
            className={cn(
              "absolute cursor-move border border-white outline-none",
              "shadow-[0_0_0_9999px_rgba(0,0,0,0.55)] focus-visible:border-primary",
            )}
            style={box}
          >
            {/* Rule-of-thirds guide. */}
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3" aria-hidden="true">
              {Array.from({ length: 9 }).map((_, index) => (
                <span key={index} className="border border-white/25" />
              ))}
            </div>
            {handles.map((handle) => (
              <span
                key={handle.id}
                onPointerDown={(event) => beginDrag(event, handle.id)}
                className={cn(
                  "absolute size-3 rounded-sm border border-black/40 bg-white",
                  handle.className,
                  handle.cursor,
                )}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
