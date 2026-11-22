import type { SlotAddress } from "./binder";
import {
  visiblePart,
  type Pocket,
  type Rect,
  type Size,
} from "./pocketGeometry";

const pocketAttribute = "data-pocket";
const filledAttribute = "data-filled";

/** Attributes that let a drag find this pocket. */
export function pocketMarker(
  { page, position }: SlotAddress,
  filled: boolean,
): Record<string, string> {
  return {
    [pocketAttribute]: `${page}:${position}`,
    ...(filled ? { [filledAttribute]: "" } : {}),
  };
}

/** Every marked pocket you can see now, with the part of it that shows. A hidden pocket is left out. */
export function pocketsOnScreen(): Pocket[] {
  const area = visibleArea();
  return Array.from(document.querySelectorAll(`[${pocketAttribute}]`)).flatMap(
    (element) => {
      const rect = visiblePart(element.getBoundingClientRect(), area);
      if (!rect) return [];
      const [page, position] = (element.getAttribute(pocketAttribute) ?? "")
        .split(":")
        .map(Number);
      return [
        {
          address: { page, position },
          filled: element.hasAttribute(filledAttribute),
          rect,
        },
      ];
    },
  );
}

/** A pocket's whole size, hidden or not. Every pocket on a spread is one size; null when none is marked. */
export function pocketSizeOnScreen(): Size | null {
  const pocket = document.querySelector(`[${pocketAttribute}]`);
  if (!pocket) return null;
  const { width, height } = pocket.getBoundingClientRect();
  return { width, height };
}

/** The window, above the catalogue's bottom sheet when it is open. */
function visibleArea(): Rect {
  const sheet = document.querySelector(".catalogue--sheet");
  const bottom = sheet
    ? Math.min(window.innerHeight, sheet.getBoundingClientRect().top)
    : window.innerHeight;
  return { left: 0, top: 0, width: window.innerWidth, height: bottom };
}
