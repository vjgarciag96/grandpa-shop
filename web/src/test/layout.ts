import { vi } from "vitest";
import type { Rect, Size } from "../pocketGeometry";

export type Layout = {
  /** Gives [element] this box. */
  place(element: Element, rect: Rect): void;
  /** Moves every pocket by (dx, dy), as a scroll would. */
  shiftPockets(dx: number, dy: number): void;
};

// The stub's grid: where each page's pockets start, the gap between them, and the padding around a page's grid.
const GRID_TOP = 100;
const LEFT_GRID = 100;
const RIGHT_GRID = 450;
const GAP = 10;
const COLUMNS = 3;
const PAGE_PADDING = 12;

/**
 * jsdom does no layout, so this lays the binder out in fixed numbers. Pockets are [pocket] in size,
 * 100×146 unless given, with 10px gaps, in a grid whose top is at y 100. Page 1 and every left
 * (even) page start their grid at x 100; a right (odd) page after page 1 starts at x 450.
 * A page is its grid with a 12px padding: x 88–432 on the left and 438–782 on the right, y 88–570,
 * with the default pockets. The spine fills the space between the two, x 432–438.
 * The stub draws a lone page on the left, so an inside cover takes the right page's box.
 * A catalogue printing row is 320×56 centred on (900, 300), at the panel's side of the screen.
 * Elements given a box with `place` keep it; everything else is 0×0.
 * Shifting the pockets shifts the pages, the spine and the cover too.
 * The shared test setup restores the real method after each test.
 */
export function stubLayout(pocket: Size = { width: 100, height: 146 }): Layout {
  const placed = new Map<Element, Rect>();
  let shift = { dx: 0, dy: 0 };
  vi.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(
    function (this: Element) {
      const own = placed.get(this);
      if (own) return new DOMRect(own.left, own.top, own.width, own.height);
      const box = pocketRect(this, pocket) ?? binderPartRect(this, pocket);
      if (box) {
        return new DOMRect(
          box.left + shift.dx,
          box.top + shift.dy,
          box.width,
          box.height,
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
    left:
      (rightPage ? RIGHT_GRID : LEFT_GRID) + (index % COLUMNS) * (width + GAP),
    top: GRID_TOP + Math.floor(index / COLUMNS) * (height + GAP),
    width,
    height,
  };
}

/** A page is found by its "Page N" label, the spine and an inside cover by their class. */
function binderPartRect(element: Element, pocket: Size): Rect | null {
  if (element.classList.contains("spine")) {
    const left = pageRect(LEFT_GRID, pocket);
    const right = pageRect(RIGHT_GRID, pocket);
    const spineLeft = left.left + left.width;
    return {
      left: spineLeft,
      top: left.top,
      width: Math.max(0, right.left - spineLeft),
      height: left.height,
    };
  }
  if (element.classList.contains("page-side--cover")) {
    return pageRect(RIGHT_GRID, pocket);
  }
  if (element.tagName !== "SECTION") return null;
  const name = /^Page (\d+)$/.exec(element.getAttribute("aria-label") ?? "");
  if (!name) return null;
  const page = Number(name[1]);
  return pageRect(page > 1 && page % 2 === 1 ? RIGHT_GRID : LEFT_GRID, pocket);
}

/** A page whose grid of pockets of [size] starts at [gridLeft], with its padding around the grid. */
function pageRect(gridLeft: number, { width, height }: Size): Rect {
  return {
    left: gridLeft - PAGE_PADDING,
    top: GRID_TOP - PAGE_PADDING,
    width: COLUMNS * width + (COLUMNS - 1) * GAP + 2 * PAGE_PADDING,
    height: COLUMNS * height + (COLUMNS - 1) * GAP + 2 * PAGE_PADDING,
  };
}
