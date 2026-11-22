import { describe, expect, it } from "vitest";
import {
  emptyBinder,
  pageSlots,
  place,
  spreadPages,
  type Copy,
} from "./binder";
import { darkMagician } from "./test/fakeCatalogue";

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
