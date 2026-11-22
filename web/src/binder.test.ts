import { describe, expect, it } from "vitest";
import {
  changeCondition,
  emptyBinder,
  moveCopy,
  pageSlots,
  place,
  remove,
  spreadPages,
  type Copy,
} from "./binder";
import { darkMagician, potOfGreed } from "./test/fakeCatalogue";

const darkMagicianCopy: Copy = {
  card: darkMagician,
  printing: darkMagician.printings[0],
  condition: "Near Mint",
};

describe("spreadPages", () => {
  it("shows page 1 alone on the right of the first spread", () => {
    const pages = spreadPages(0);

    expect(pages).toEqual({ left: null, right: 1 });
  });

  it("puts the back of page 1 and the front of the next sheet together", () => {
    const pages = spreadPages(1);

    expect(pages).toEqual({ left: 2, right: 3 });
  });

  it("shows page 40 alone on the left of the last spread", () => {
    const pages = spreadPages(20);

    expect(pages).toEqual({ left: 40, right: null });
  });
});

describe("place", () => {
  it("puts the copy in the chosen slot of the chosen page", () => {
    const binder = place(
      emptyBinder(),
      { page: 3, position: 5 },
      darkMagicianCopy,
    );

    expect(pageSlots(binder, 3)[5]).toBe(darkMagicianCopy);
  });

  it("leaves the same position on other pages empty", () => {
    const binder = place(
      emptyBinder(),
      { page: 3, position: 5 },
      darkMagicianCopy,
    );

    expect(pageSlots(binder, 2)[5]).toBeNull();
  });

  it("does not change the binder it was given", () => {
    const before = emptyBinder();

    place(before, { page: 1, position: 0 }, darkMagicianCopy);

    expect(pageSlots(before, 1)[0]).toBeNull();
  });
});

describe("remove", () => {
  it("empties the slot", () => {
    const filled = place(
      emptyBinder(),
      { page: 2, position: 4 },
      darkMagicianCopy,
    );

    const binder = remove(filled, { page: 2, position: 4 });

    expect(pageSlots(binder, 2)[4]).toBeNull();
  });
});

describe("changeCondition", () => {
  it("keeps the copy's printing and changes only its condition", () => {
    const filled = place(
      emptyBinder(),
      { page: 2, position: 4 },
      darkMagicianCopy,
    );

    const binder = changeCondition(
      filled,
      { page: 2, position: 4 },
      "Heavily Played",
    );

    expect(pageSlots(binder, 2)[4]).toEqual({
      ...darkMagicianCopy,
      condition: "Heavily Played",
    });
  });

  it("leaves an empty slot empty", () => {
    const binder = changeCondition(
      emptyBinder(),
      { page: 2, position: 4 },
      "Damaged",
    );

    expect(pageSlots(binder, 2)[4]).toBeNull();
  });
});

describe("moveCopy", () => {
  const playedCopy: Copy = {
    card: darkMagician,
    printing: darkMagician.printings[1],
    condition: "Lightly Played",
  };
  const potOfGreedCopy: Copy = {
    card: potOfGreed,
    printing: potOfGreed.printings[0],
    condition: "Near Mint",
  };

  it("puts the same printing and condition in the destination", () => {
    const filled = place(emptyBinder(), { page: 2, position: 4 }, playedCopy);

    const binder = moveCopy(
      filled,
      { page: 2, position: 4 },
      { page: 3, position: 1 },
      playedCopy,
    );

    expect(pageSlots(binder, 3)[1]).toEqual({
      card: darkMagician,
      printing: {
        setCode: "SDY-006",
        setName: "Starter Deck: Yugi",
        rarity: "Common",
      },
      condition: "Lightly Played",
    });
  });

  it("empties the source slot", () => {
    const filled = place(emptyBinder(), { page: 2, position: 4 }, playedCopy);

    const binder = moveCopy(
      filled,
      { page: 2, position: 4 },
      { page: 3, position: 1 },
      playedCopy,
    );

    expect(pageSlots(binder, 2)[4]).toBeNull();
  });

  it("refuses a copy that is no longer in the source slot", () => {
    const filled = place(emptyBinder(), { page: 2, position: 4 }, playedCopy);

    const binder = moveCopy(
      filled,
      { page: 2, position: 4 },
      { page: 3, position: 1 },
      { ...playedCopy, condition: "Damaged" },
    );

    expect([pageSlots(binder, 2)[4], pageSlots(binder, 3)[1]]).toEqual([
      playedCopy,
      null,
    ]);
  });

  it("refuses a filled destination and keeps both copies", () => {
    const filled = place(
      place(emptyBinder(), { page: 2, position: 4 }, playedCopy),
      { page: 3, position: 1 },
      potOfGreedCopy,
    );

    const binder = moveCopy(
      filled,
      { page: 2, position: 4 },
      { page: 3, position: 1 },
      playedCopy,
    );

    expect([pageSlots(binder, 2)[4], pageSlots(binder, 3)[1]]).toEqual([
      playedCopy,
      potOfGreedCopy,
    ]);
  });
});
