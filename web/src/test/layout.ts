import { vi } from "vitest";
import type { Rect, Size } from "../pocketGeometry";

export type Layout = {
  /** Gives [element] this box. */
  place(element: Element, rect: Rect): void;
  /** Moves every pocket by (dx, dy), as a scroll would. */
  shiftPockets(dx: number, dy: number): void;
};

/**
 * jsdom does no layout, so this lays the binder out in fixed numbers. Pockets are [pocket] in size,
 * 100×146 unless given, with 10px gaps, in a grid whose top is at y 100. Page 1 and every left
 * (even) page start their grid at x 100; a right (odd) page after page 1 starts at x 450.
 * The open spread is the box around both grids with a 12px page padding: x 88 to 12px past the right
 * page's grid, and y 88 to 12px below the grid; x 88–782 and y 88–570 with the default pockets.
 * A catalogue printing row is 320×56 centred on (900, 300), at the panel's side of the screen.
 * Elements given a box with `place` keep it; everything else is 0×0. Shifting the pockets shifts the spread too.
 * The shared test setup restores the real method after each test.
 */
export function stubLayout(pocket: Size = { width: 100, height: 146 }): Layout {
  const placed = new Map<Element, Rect>();
  let shift = { dx: 0, dy: 0 };
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const own = placed.get(this);
      if (own) return new DOMRect(own.left, own.top, own.width, own.height);
      const slot = pocketRect(this, pocket);
      if (slot) {
        return new DOMRect(
          slot.left + shift.dx,
          slot.top + shift.dy,
          slot.width,
          slot.height,
        );
      }
      if (this.hasAttribute("data-binder")) {
        const spread = spreadRect(pocket);
        return new DOMRect(
          spread.left + shift.dx,
          spread.top + shift.dy,
          spread.width,
          spread.height,
        );
      }
      if (this.classList.contains("catalogue__printing")) {
        return new DOMRect(740, 272, 320, 56);
      }
      return new DOMRect(0, 0, 0, 0);
    },
  );
  return {
    place: (element, rect) => placed.set(element, rect),
    shiftPockets: (dx, dy) => {
      shift = { dx, dy };
    },
  };
}

/** The centre of [element]'s box. */
export function centreOf(element: Element): { x: number; y: number } {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2 };
}

/** A pocket is found by its accessible name, such as "Page 1, slot 3, empty". */
function pocketRect(element: Element, { width, height }: Size): Rect | null {
  if (element.tagName !== "BUTTON") return null;
  const name = /^Page (\d+), slot (\d+)/.exec(
    element.getAttribute("aria-label") ?? "",
  );
  if (!name) return null;
  const page = Number(name[1]);
  const index = Number(name[2]) - 1;
  const rightPage = page > 1 && page % 2 === 1;
  return {
    left: (rightPage ? 450 : 100) + (index % 3) * (width + 10),
    top: 100 + Math.floor(index / 3) * (height + 10),
    width,
    height,
  };
}

/** The open spread around both pages' grids of pockets of [size], with a 12px page padding. */
function spreadRect({ width, height }: Size): Rect {
  const padding = 12;
  const gridWidth = 3 * width + 2 * 10;
  const gridHeight = 3 * height + 2 * 10;
  return {
    left: 100 - padding,
    top: 100 - padding,
    width: 450 + gridWidth + padding - (100 - padding),
    height: gridHeight + 2 * padding,
  };
}
