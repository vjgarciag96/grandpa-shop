import { describe, expect, it } from "vitest";
import {
  coveredMost,
  ghostAt,
  grabFraction,
  visiblePart,
  type Pocket,
  type Rect,
} from "./pocketGeometry";

// Pockets are 100×146 with 10px gaps. A page's grid starts at its left edge and y 100.
const columns = [0, 110, 220];
const rows = [100, 256, 412];

/** The pocket at visible [slot] (1–9) of a page whose grid starts at [pageLeft]. */
function pocket(
  page: number,
  slot: number,
  filled = false,
  pageLeft = 100,
): Pocket {
  return {
    address: { page, position: slot - 1 },
    filled,
    rect: {
      left: pageLeft + columns[(slot - 1) % 3],
      top: rows[Math.floor((slot - 1) / 3)],
      width: 100,
      height: 146,
    },
  };
}

/** Page 1's nine pockets, with the given visible slots filled. */
function pageOne(...filled: number[]): Pocket[] {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9].map((slot) =>
    pocket(1, slot, filled.includes(slot)),
  );
}

function ghost(left: number, top: number): Rect {
  return { left, top, width: 100, height: 146 };
}

/** The address of the pocket [card] covers most among [pockets]. */
// A pocket counts only when the card covers at least a fifth of the card's own area with it: 2920px² of 14600.
const minShare = 0.2;

function coveredBy(card: Rect, pockets: Pocket[]) {
  return coveredMost(card, pockets, minShare)?.address ?? null;
}

describe("the pocket a dragged card covers most", () => {
  it("is the pocket covered most when the card straddles a gap", () => {
    expect(coveredBy(ghost(156, 100), pageOne())).toEqual({
      page: 1,
      position: 1,
    });
  });

  it("is the pocket the card covers when its edge is over the page margin", () => {
    expect(coveredBy(ghost(85, 100), pageOne())).toEqual({
      page: 1,
      position: 0,
    });
  });

  it("is the pocket with the largest area when the card covers a corner of four", () => {
    expect(coveredBy(ghost(170, 200), pageOne())).toEqual({
      page: 1,
      position: 4,
    });
  });

  it("is a filled pocket when the card covers it most", () => {
    expect(coveredMost(ghost(140, 100), pageOne(1), minShare)).toEqual(
      pocket(1, 1, true),
    );
  });

  it("is the empty neighbour once the card covers it more than a filled pocket", () => {
    expect(coveredBy(ghost(170, 100), pageOne(1))).toEqual({
      page: 1,
      position: 1,
    });
  });

  it("is the earlier slot when two pockets are covered equally", () => {
    expect(coveredBy(ghost(155, 100), pageOne())).toEqual({
      page: 1,
      position: 0,
    });
  });

  it("is the earlier slot on a tie even when that pocket is filled", () => {
    expect(coveredMost(ghost(155, 100), pageOne(1), minShare)).toEqual(
      pocket(1, 1, true),
    );
  });

  it("is none when the card covers no pocket", () => {
    expect(coveredMost(ghost(900, 100), pageOne(), minShare)).toBeNull();
  });

  it("is none when there are no pockets", () => {
    expect(coveredMost(ghost(156, 100), [], minShare)).toBeNull();
  });

  it("is none when the card only touches a pocket's edge", () => {
    expect(coveredMost(ghost(420, 100), pageOne(), minShare)).toBeNull();
  });
});

describe("a pocket the card only grazes", () => {
  // Slot 3 is the right-hand column, x 320–420, with nothing beyond it.
  it("is none when the card covers it by 19px, under a fifth of the card", () => {
    expect(coveredBy(ghost(401, 100), pageOne())).toBeNull();
  });

  it("counts once the card covers it by 20px, a fifth of the card", () => {
    expect(coveredBy(ghost(400, 100), pageOne())).toEqual({
      page: 1,
      position: 2,
    });
  });

  it("still leaves a pocket when the card is centred on a crossing of four gaps", () => {
    expect(coveredBy(ghost(155, 178), pageOne())).toEqual({
      page: 1,
      position: 0,
    });
  });
});

describe("how much a card covers a pocket", () => {
  it("is measured by area, not by the overlap's width and height", () => {
    const card = { left: 0, top: 0, width: 100, height: 146 };
    const narrowAndTall = {
      address: { page: 1, position: 0 },
      filled: false,
      rect: { left: 78, top: 0, width: 100, height: 146 },
    };
    const square = {
      address: { page: 1, position: 1 },
      filled: false,
      rect: { left: -70, top: 76, width: 140, height: 100 },
    };

    expect(coveredBy(card, [narrowAndTall, square])).toEqual({
      page: 1,
      position: 1,
    });
  });
});

describe("a card dragged across the spine", () => {
  // Page 2's grid starts at x 100 and page 3's at x 450.
  const spread = [pocket(2, 3, false, 100), pocket(3, 1, false, 450)];

  it("covers the left pocket most when more of it is covered", () => {
    expect(coveredBy(ghost(380, 100), spread)).toEqual({
      page: 2,
      position: 2,
    });
  });

  it("covers the right pocket most when more of it is covered", () => {
    expect(coveredBy(ghost(400, 100), spread)).toEqual({
      page: 3,
      position: 0,
    });
  });

  it("goes to the left page when it covers both equally", () => {
    expect(coveredBy(ghost(385, 100), [...spread].reverse())).toEqual({
      page: 2,
      position: 2,
    });
  });
});

describe("the part of a pocket you can see", () => {
  const screenAboveSheet = { left: 0, top: 0, width: 1024, height: 300 };

  it("is the whole pocket when nothing covers it", () => {
    expect(
      visiblePart(
        { left: 100, top: 100, width: 100, height: 146 },
        screenAboveSheet,
      ),
    ).toEqual({ left: 100, top: 100, width: 100, height: 146 });
  });

  it("is the strip above the sheet when the sheet covers the rest", () => {
    expect(
      visiblePart(
        { left: 210, top: 256, width: 100, height: 146 },
        screenAboveSheet,
      ),
    ).toEqual({ left: 210, top: 256, width: 100, height: 44 });
  });

  it("is the part inside the window when the pocket hangs off its edge", () => {
    expect(
      visiblePart(
        { left: -40, top: 100, width: 100, height: 146 },
        screenAboveSheet,
      ),
    ).toEqual({ left: 0, top: 100, width: 60, height: 146 });
  });

  it("is none when the sheet hides the whole pocket", () => {
    expect(
      visiblePart(
        { left: 100, top: 412, width: 100, height: 146 },
        screenAboveSheet,
      ),
    ).toBeNull();
  });
});

describe("where a press grabs the pressed element", () => {
  it("is the press offset as a fraction of the element's size", () => {
    expect(
      grabFraction(
        { x: 980, y: 294 },
        { left: 900, top: 280, width: 320, height: 56 },
      ),
    ).toEqual({ x: 0.25, y: 0.25 });
  });

  it("is the centre on an axis where the element has no size", () => {
    expect(
      grabFraction(
        { x: 980, y: 294 },
        { left: 0, top: 0, width: 0, height: 0 },
      ),
    ).toEqual({ x: 0.5, y: 0.5 });
  });
});

describe("the card that follows the pointer", () => {
  it("keeps a row's grab point on a pocket-sized card", () => {
    expect(
      ghostAt(
        { x: 400, y: 300 },
        { x: 0.25, y: 0.25 },
        {
          width: 100,
          height: 146,
        },
      ),
    ).toEqual({ left: 375, top: 263.5, width: 100, height: 146 });
  });

  it("starts over the pocket a copy was pressed in", () => {
    expect(
      ghostAt(
        { x: 130, y: 150 },
        { x: 0.3, y: 50 / 146 },
        {
          width: 100,
          height: 146,
        },
      ),
    ).toEqual({ left: 100, top: 100, width: 100, height: 146 });
  });
});
