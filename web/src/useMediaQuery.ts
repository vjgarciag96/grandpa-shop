import { useSyncExternalStore } from 'react';

/** Whether the media query matches now, updated when it changes. False where matchMedia does not exist. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => watchMediaQuery(query, onChange),
    () => window.matchMedia?.(query).matches ?? false,
  );
}

export function useMinimumViewportWidth(
  minimum: number,
  { excludeScrollbar }: { excludeScrollbar: boolean },
): boolean {
  const query = `(width >= ${minimum}px)`;
  return useSyncExternalStore(
    (onChange) =>
      excludeScrollbar ? watchViewportWidth(onChange) : watchMediaQuery(query, onChange),
    () =>
      excludeScrollbar
        ? (document.documentElement.clientWidth || window.innerWidth) >= minimum
        : (window.matchMedia?.(query).matches ?? false),
  );
}

function watchMediaQuery(query: string, onChange: () => void): () => void {
  const list = window.matchMedia?.(query);
  list?.addEventListener('change', onChange);
  return () => list?.removeEventListener('change', onChange);
}

function watchViewportWidth(onChange: () => void): () => void {
  const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onChange);
  observer?.observe(document.documentElement);
  window.addEventListener('resize', onChange);
  return () => {
    observer?.disconnect();
    window.removeEventListener('resize', onChange);
  };
}
