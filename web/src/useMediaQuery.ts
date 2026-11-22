import { useSyncExternalStore } from "react";
import { STACK_BELOW_PX } from "./tokens";

/** Whether the media query matches now, updated when it changes. False where matchMedia does not exist. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia?.(query);
      list?.addEventListener("change", onChange);
      return () => list?.removeEventListener("change", onChange);
    },
    () => window.matchMedia?.(query).matches ?? false,
  );
}

/** Whether the viewport is too narrow for two pages side by side. */
export function useStackedPages(): boolean {
  return useMediaQuery(`(width < ${STACK_BELOW_PX}px)`);
}
