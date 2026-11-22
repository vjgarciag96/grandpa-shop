/** Makes window.matchMedia answer as a browser whose user asked for reduced motion, or not. */
export function prefersReducedMotion(reduce: boolean) {
  window.matchMedia = (query: string) =>
    ({
      matches: reduce && query.includes("prefers-reduced-motion: reduce"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }) as unknown as MediaQueryList;
}

/** Makes window.matchMedia answer width range queries as a viewport [width] pixels wide. */
export function viewportWidth(width: number) {
  window.matchMedia = (query: string) => {
    const range = /\(width (<|>=) (\d+)px\)/.exec(query);
    const matches =
      range !== null &&
      (range[1] === "<" ? width < Number(range[2]) : width >= Number(range[2]));
    return {
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    } as unknown as MediaQueryList;
  };
}
