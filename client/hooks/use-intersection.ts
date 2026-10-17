"use client";

import { useEffect, useRef } from "react";

/**
 * Calls `onIntersect` whenever the returned ref's element enters the viewport.
 * Used for infinite scrolling; the callback is read from a ref so the observer
 * is created only once per element.
 */
export function useIntersection<T extends HTMLElement>(
  onIntersect: () => void,
  options: { enabled?: boolean; rootMargin?: string } = {},
) {
  const { enabled = true, rootMargin = "600px 0px" } = options;
  const ref = useRef<T>(null);
  const callback = useRef(onIntersect);

  useEffect(() => {
    callback.current = onIntersect;
  });

  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          callback.current();
        }
      },
      { rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled, rootMargin]);

  return ref;
}
