import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  openApp,
  openCatalogueResult,
  openPotOfGreedOverDarkMagician,
} from "./test/app";
import {
  detailOf,
  saveBinderWith,
  savedDarkMagician,
  savedPlayedSdyDarkMagician,
  savedPotOfGreed,
} from "./test/binder";
import {
  dragCopy,
  awayFromBinder,
  moveOnto,
  moveTo,
  press,
  release,
  releaseCopy,
  releaseOnto,
  releaseSecondary,
} from "./test/drag";
import { centreOf, stubLayout, type Layout } from "./test/layout";
import { prefersReducedMotion, viewportWidth } from "./test/media";
import { PAGE_FLIP_MS } from "./tokens";

const slot = (name: string) => screen.getByRole("button", { name });
const printing = (code: RegExp) => screen.getByRole("button", { name: code });

async function openResultsAt(width: number, query: string, result: RegExp) {
  const { user } = openApp(width);
  await openCatalogueResult(user, query, result);
  return user;
}

function openDarkMagicianAt(width: number) {
  return openResultsAt(width, "dark", /Dark Magician/);
}

/** The centre of [element] as pointer event coordinates. */
function pointAt(element: Element) {
  const { x, y } = centreOf(element);
  return { clientX: x, clientY: y };
}

const catalogueAnnouncement = () =>
  document.querySelector(".catalogue__announcement")?.textContent?.trim();

/** The label of the pocket whose name starts with `name`, filled or empty. */
const labelOf = (name: string) =>
  screen
    .getByRole("button", { name: new RegExp(`^${name}[:,]`) })
    .getAttribute("aria-label");

let layout: Layout;

beforeEach(() => {
  layout = stubLayout();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("dragging a printing onto a slot", () => {
  it("fills the empty slot it is dropped on", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    const target = slot("Page 1, slot 2, empty");

    press(row);
    moveOnto(target);
    releaseOnto(row, target);

    expect(slot("Page 1, slot 2: Dark Magician")).toBeTruthy();
  });

  it("files a printing dragged directly from a set", async () => {
    await openResultsAt(1200, "legend", /Legend of Blue Eyes White Dragon/);
    const row = await screen.findByRole("button", { name: /LOB-EN119/ });

    press(row);
    moveOnto(slot("Page 1, slot 2, empty"));
    releaseOnto(row, slot("Page 1, slot 2, empty"));

    expect(slot("Page 1, slot 2: Pot of Greed")).toBeTruthy();
  });

  it("places the dragged printing, not another of the card", async () => {
    const user = await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveOnto(slot("Page 1, slot 2, empty"));
    releaseOnto(row, slot("Page 1, slot 2, empty"));

    await user.click(slot("Page 1, slot 2: Dark Magician"));

    const detail = within(screen.getByRole("dialog")).getByRole("list", {
      name: "Printing",
    });
    expect(within(detail).getByText("SDY-006")).toBeTruthy();
  });

  it("does not also pick the printing up when the drag ends", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);

    press(row);
    moveOnto(slot("Page 1, slot 2, empty"));
    releaseOnto(row, slot("Page 1, slot 2, empty"));

    expect(row.getAttribute("aria-pressed")).toBe("false");
  });

  it("lights the empty slot under the pointer", async () => {
    await openDarkMagicianAt(1200);
    const target = slot("Page 1, slot 4, empty");

    press(printing(/SDY-006/));
    moveOnto(target);

    expect(slot("Page 1, slot 4, empty").classList.contains("slot--drop")).toBe(
      true,
    );
  });

  it("shows the card at pocket size while dragging", async () => {
    layout = stubLayout({ width: 120, height: 175 });
    await openDarkMagicianAt(1200);

    press(printing(/SDY-006/));
    moveTo(420, 310);

    const ghost = document.querySelector<HTMLImageElement>(".drag-ghost");
    expect([
      ghost?.getAttribute("src"),
      ghost?.style.width,
      ghost?.style.height,
    ]).toEqual(["/images/46986414.jpg", "120px", "175px"]);
  });

  it("holds the card where the row was grabbed", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    layout.place(row, { left: 900, top: 280, width: 320, height: 56 });
    fireEvent.pointerDown(row, {
      pointerType: "mouse",
      pointerId: 1,
      isPrimary: true,
      button: 0,
      buttons: 1,
      clientX: 980,
      clientY: 294,
    });

    moveTo(400, 300);

    const ghost = document.querySelector<HTMLImageElement>(".drag-ghost");
    expect([ghost?.style.left, ghost?.style.top]).toEqual(["375px", "263.5px"]);
  });

  it("shows no card while every page is turning", async () => {
    const user = await openDarkMagicianAt(1200);
    await user.click(slot("Next spread"));

    press(printing(/SDY-006/));
    moveTo(420, 310);

    expect(document.querySelector(".drag-ghost")).toBeNull();
  });

  it("does not let the browser drag the row's thumbnail away instead", async () => {
    await openDarkMagicianAt(1200);

    const thumbnail = printing(/SDY-006/).querySelector("img");

    expect(thumbnail?.draggable).toBe(false);
  });

  it("files a Near Mint copy of the printing dropped on a filled slot", async () => {
    const { user } = await openPotOfGreedOverDarkMagician();
    const row = printing(/LOB-EN119/);

    press(row);
    moveOnto(slot("Page 1, slot 1: Dark Magician"));
    releaseOnto(row, slot("Page 1, slot 1: Dark Magician"));

    expect(await detailOf(user, slot("Page 1, slot 1: Pot of Greed"))).toEqual({
      printing: "LOB-EN119",
      condition: "Near Mint",
    });
  });

  it("says which copy a dropped printing replaced", async () => {
    await openPotOfGreedOverDarkMagician();
    const row = printing(/LOB-EN119/);

    press(row);
    moveOnto(slot("Page 1, slot 1: Dark Magician"));
    releaseOnto(row, slot("Page 1, slot 1: Dark Magician"));

    expect(catalogueAnnouncement()).toBe(
      "Placed LOB-EN119 in page 1, slot 1, replacing SDY-006.",
    );
  });

  it("outlines the filled slot under the pointer", async () => {
    await openPotOfGreedOverDarkMagician();

    press(printing(/LOB-EN119/));
    moveOnto(slot("Page 1, slot 1: Dark Magician"));

    expect(
      slot("Page 1, slot 1: Dark Magician").classList.contains("slot--aimed"),
    ).toBe(true);
  });

  it("does not outline a filled slot away from the pointer", async () => {
    await openPotOfGreedOverDarkMagician();

    press(printing(/LOB-EN119/));
    moveOnto(slot("Page 1, slot 2, empty"));

    expect(
      slot("Page 1, slot 1: Dark Magician").classList.contains("slot--aimed"),
    ).toBe(false);
  });

  it("fills an empty slot with a printing dragged by touch", async () => {
    await openPotOfGreedOverDarkMagician();
    const row = printing(/LOB-EN119/);

    press(row, "touch");
    moveOnto(slot("Page 1, slot 2, empty"));
    releaseOnto(row, slot("Page 1, slot 2, empty"));

    expect(labelOf("Page 1, slot 2")).toBe("Page 1, slot 2: Pot of Greed");
  });

  it("keeps a filled slot when a printing dragged by touch is released on it", async () => {
    await openPotOfGreedOverDarkMagician();
    const row = printing(/LOB-EN119/);

    press(row, "touch");
    moveOnto(slot("Page 1, slot 1: Dark Magician"));
    releaseOnto(row, slot("Page 1, slot 1: Dark Magician"));

    expect([labelOf("Page 1, slot 1"), catalogueAnnouncement()]).toEqual([
      "Page 1, slot 1: Dark Magician",
      "",
    ]);
  });

  it("does not outline a filled slot under a printing dragged by touch", async () => {
    await openPotOfGreedOverDarkMagician();

    press(printing(/LOB-EN119/), "touch");
    moveOnto(slot("Page 1, slot 1: Dark Magician"));

    expect(
      slot("Page 1, slot 1: Dark Magician").classList.contains("slot--aimed"),
    ).toBe(false);
  });

  it("keeps a filled slot when the primary button was let go before a secondary click on it", async () => {
    await openPotOfGreedOverDarkMagician();
    const filled = slot("Page 1, slot 1: Dark Magician");
    press(printing(/LOB-EN119/));
    moveOnto(filled);
    moveTo(410, 300, 0);

    fireEvent.pointerDown(filled, {
      pointerType: "mouse",
      pointerId: 1,
      isPrimary: true,
      button: 2,
      buttons: 2,
    });
    releaseSecondary(410, 300);

    expect([labelOf("Page 1, slot 1"), catalogueAnnouncement()]).toEqual([
      "Page 1, slot 1: Dark Magician",
      "",
    ]);
  });

  it("keeps a filled slot when a drag ends on the secondary button", async () => {
    await openPotOfGreedOverDarkMagician();
    press(printing(/LOB-EN119/));
    moveOnto(slot("Page 1, slot 1: Dark Magician"));
    moveOnto(slot("Page 1, slot 1: Dark Magician"), 3);
    moveOnto(slot("Page 1, slot 1: Dark Magician"), 2);

    releaseSecondary(400, 300);

    expect([labelOf("Page 1, slot 1"), catalogueAnnouncement()]).toEqual([
      "Page 1, slot 1: Dark Magician",
      "",
    ]);
  });

  it("drops nothing on a pocket the spread turned under a still pointer", async () => {
    // Page 2, slot 1 sits where page 1, slot 1 was, so the still pointer is over a filled pocket after the turn.
    await openPotOfGreedOverDarkMagician(1200, { 9: savedDarkMagician });
    const row = printing(/LOB-EN119/);
    press(row);
    moveOnto(slot("Page 1, slot 1: Dark Magician"));
    vi.useFakeTimers();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    act(() => vi.advanceTimersByTime(PAGE_FLIP_MS));

    releaseOnto(row, slot("Page 2, slot 1: Dark Magician"));

    expect([labelOf("Page 2, slot 1"), catalogueAnnouncement()]).toEqual([
      "Page 2, slot 1: Dark Magician",
      "",
    ]);
  });

  it("highlights no pocket after the spread turns away and back under a still pointer", async () => {
    await openPotOfGreedOverDarkMagician();
    press(printing(/LOB-EN119/));
    moveOnto(slot("Page 1, slot 1: Dark Magician"));
    vi.useFakeTimers();

    fireEvent.keyDown(document, { key: "ArrowRight" });
    act(() => vi.advanceTimersByTime(PAGE_FLIP_MS));
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    act(() => vi.advanceTimersByTime(PAGE_FLIP_MS));

    expect(
      slot("Page 1, slot 1: Dark Magician").classList.contains("slot--aimed"),
    ).toBe(false);
  });

  it("drops nothing when released after the spread turns away and back under a still pointer", async () => {
    await openPotOfGreedOverDarkMagician();
    press(printing(/LOB-EN119/));
    moveOnto(slot("Page 1, slot 1: Dark Magician"));
    vi.useFakeTimers();
    fireEvent.keyDown(document, { key: "ArrowRight" });
    act(() => vi.advanceTimersByTime(PAGE_FLIP_MS));
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    act(() => vi.advanceTimersByTime(PAGE_FLIP_MS));

    releaseOnto(printing(/LOB-EN119/), slot("Page 1, slot 1: Dark Magician"));

    expect([labelOf("Page 1, slot 1"), catalogueAnnouncement()]).toEqual([
      "Page 1, slot 1: Dark Magician",
      "",
    ]);
  });

  it("ends a printing drag when a move comes without the primary button", async () => {
    await openPotOfGreedOverDarkMagician();
    press(printing(/LOB-EN119/));
    moveOnto(slot("Page 1, slot 1: Dark Magician"));

    moveTo(410, 300, 0);

    expect([
      document.querySelector(".drag-ghost"),
      slot("Page 1, slot 1: Dark Magician").classList.contains("slot--aimed"),
    ]).toEqual([null, false]);
  });

  it("drops nothing on a later primary click after the drag lost its primary button", async () => {
    await openPotOfGreedOverDarkMagician();
    press(printing(/LOB-EN119/));
    moveOnto(slot("Page 1, slot 1: Dark Magician"));
    moveTo(410, 300, 0);

    fireEvent.pointerDown(document.body, {
      pointerType: "mouse",
      pointerId: 1,
      isPrimary: true,
      button: 0,
      buttons: 1,
    });
    fireEvent.pointerUp(window, { pointerId: 1, button: 0 });

    expect([labelOf("Page 1, slot 1"), catalogueAnnouncement()]).toEqual([
      "Page 1, slot 1: Dark Magician",
      "",
    ]);
  });

  it("keeps a filled slot when a printing is released away from the binder", async () => {
    await openPotOfGreedOverDarkMagician();
    const row = printing(/LOB-EN119/);

    press(row);
    moveTo(awayFromBinder.x, awayFromBinder.y);
    release(row, awayFromBinder.x, awayFromBinder.y);

    expect([labelOf("Page 1, slot 1"), catalogueAnnouncement()]).toEqual([
      "Page 1, slot 1: Dark Magician",
      "",
    ]);
  });

  it("keeps a filled slot when Escape is pressed mid-drag", async () => {
    await openPotOfGreedOverDarkMagician();
    const row = printing(/LOB-EN119/);
    press(row);
    moveOnto(slot("Page 1, slot 1: Dark Magician"));

    fireEvent.keyDown(window, { key: "Escape" });
    releaseOnto(row, slot("Page 1, slot 1: Dark Magician"));

    expect([labelOf("Page 1, slot 1"), catalogueAnnouncement()]).toEqual([
      "Page 1, slot 1: Dark Magician",
      "",
    ]);
  });

  it("drops nothing when released away from the binder", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);

    press(row);
    moveTo(awayFromBinder.x, awayFromBinder.y);
    release(row, awayFromBinder.x, awayFromBinder.y);

    expect(
      screen.queryAllByRole("button", { name: /: Dark Magician$/ }),
    ).toEqual([]);
  });

  it("drops nothing when Escape is pressed mid-drag", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveOnto(slot("Page 1, slot 2, empty"));

    fireEvent.keyDown(window, { key: "Escape" });
    releaseOnto(row, slot("Page 1, slot 2, empty"));

    expect(slot("Page 1, slot 2, empty")).toBeTruthy();
  });

  it("does not pick up the printing when released after Escape", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(890, 300);

    fireEvent.keyDown(window, { key: "Escape" });
    release(row, 900, 300);

    expect(row.getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps dragging when another pointer is canceled", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveOnto(slot("Page 1, slot 2, empty"));

    fireEvent.pointerCancel(window, { pointerId: 2 });
    releaseOnto(row, slot("Page 1, slot 2, empty"));

    expect(slot("Page 1, slot 2: Dark Magician")).toBeTruthy();
  });

  it("drops nothing when the catalogue closes during a drag", async () => {
    const user = await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveOnto(slot("Page 1, slot 2, empty"));

    screen.getByRole("button", { name: "Close catalogue" }).focus();
    await user.keyboard("{Enter}");
    fireEvent.pointerUp(window, {
      pointerId: 1,
      ...pointAt(slot("Page 1, slot 2, empty")),
    });

    expect(slot("Page 1, slot 2, empty")).toBeTruthy();
  });

  it("treats a press that moves less than the drag distance as a tap", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);

    press(row);
    moveTo(904, 302);
    release(row, 904, 302);

    expect([
      row.getAttribute("aria-pressed"),
      slot("Page 1, slot 2, empty").getAttribute("aria-label"),
    ]).toEqual(["true", "Page 1, slot 2, empty"]);
  });

  it("is not offered while the panel is a bottom sheet", async () => {
    await openDarkMagicianAt(959);
    const row = printing(/SDY-006/);

    press(row);
    moveOnto(slot("Page 1, slot 2, empty"));
    expect(document.querySelector(".drag-ghost")).toBeNull();

    fireEvent.pointerUp(window, {
      pointerId: 1,
      ...pointAt(slot("Page 1, slot 2, empty")),
    });

    expect(slot("Page 1, slot 2, empty")).toBeTruthy();
  });

  it("does not replace a filled slot while the panel is a bottom sheet", async () => {
    await openPotOfGreedOverDarkMagician(959);
    const row = printing(/LOB-EN119/);

    press(row);
    moveOnto(slot("Page 1, slot 1: Dark Magician"));
    fireEvent.pointerUp(window, {
      pointerId: 1,
      ...pointAt(slot("Page 1, slot 1: Dark Magician")),
    });

    expect([
      document.querySelector(".drag-ghost"),
      labelOf("Page 1, slot 1"),
    ]).toEqual([null, "Page 1, slot 1: Dark Magician"]);
  });
});

/** Names of the empty pockets lit as the drop target. */
function litPockets() {
  return Array.from(document.querySelectorAll(".slot--drop"), (pocket) =>
    pocket.getAttribute("aria-label"),
  );
}

/** Names of the filled pockets outlined as the drop target. */
function outlinedFilledPockets() {
  return Array.from(
    document.querySelectorAll(".slot--filled.slot--aimed"),
    (pocket) => pocket.getAttribute("aria-label"),
  );
}

/** Names of the pockets holding Dark Magician. */
function darkMagicianPockets() {
  return screen
    .queryAllByRole("button", { name: /: Dark Magician$/ })
    .map((pocket) => pocket.getAttribute("aria-label"));
}

/** Lets a page turn finish. */
function finishTurn() {
  return act(
    () => new Promise((resolve) => setTimeout(resolve, PAGE_FLIP_MS + 50)),
  );
}

// A printing row is pressed at its centre, so the card spans 50px either side of the pointer and 73px above and below.
describe("the pocket a dragged printing lands in", () => {
  it.each([
    ["straddles a gap", 206, 173, "Page 1, slot 2"],
    ["hangs over the page margin", 135, 173, "Page 1, slot 1"],
    ["covers the corner of four pockets", 220, 273, "Page 1, slot 5"],
    ["covers two pockets equally", 205, 173, "Page 1, slot 1"],
  ])("is lit and filled when the card %s", async (_layout, x, y, expected) => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(x, y);
    const lit = litPockets();

    release(row, x, y);

    expect([lit, darkMagicianPockets()]).toEqual([
      [`${expected}, empty`],
      [`${expected}: Dark Magician`],
    ]);
  });

  it("is none when the card covers no pocket", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(950, 173);
    const lit = litPockets();

    release(row, 950, 173);

    expect([lit, darkMagicianPockets()]).toEqual([[], []]);
  });

  // At (190, 173) the card covers 60px of slot 1 and 30px of slot 2.
  it("replaces the filed copy in the pocket the card covers most", async () => {
    await openPotOfGreedOverDarkMagician();
    const row = printing(/LOB-EN119/);
    press(row);
    moveTo(190, 173);
    const outlined = outlinedFilledPockets();
    const lit = litPockets();

    release(row, 190, 173);

    expect([outlined, lit, catalogueAnnouncement()]).toEqual([
      ["Page 1, slot 1: Dark Magician"],
      [],
      "Placed LOB-EN119 in page 1, slot 1, replacing SDY-006.",
    ]);
  });

  it("drops nothing by touch when the card covers a filed copy most", async () => {
    await openPotOfGreedOverDarkMagician();
    const row = printing(/LOB-EN119/);
    press(row, "touch");
    moveTo(190, 173);
    const shown = [...outlinedFilledPockets(), ...litPockets()];

    release(row, 190, 173);

    expect([
      shown,
      labelOf("Page 1, slot 1"),
      labelOf("Page 1, slot 2"),
      catalogueAnnouncement(),
    ]).toEqual([
      [],
      "Page 1, slot 1: Dark Magician",
      "Page 1, slot 2, empty",
      "",
    ]);
  });

  it("drops nothing when released over a pocket other than the one shown", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveOnto(slot("Page 1, slot 2, empty"));

    releaseOnto(row, slot("Page 1, slot 5, empty"));

    expect(darkMagicianPockets()).toEqual([]);
  });

  it("is filled and announced when released with the pointer in a gap", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(206, 173);

    release(row, 206, 173);

    expect(catalogueAnnouncement()).toBe("Placed SDY-006 in page 1, slot 2.");
  });

  it("follows the pockets when the desk scrolls under a still pointer", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(260, 173);
    layout.shiftPockets(-110, 0);

    fireEvent.scroll(window);
    const lit = litPockets();
    release(row, 260, 173);

    expect([lit, darkMagicianPockets()]).toEqual([
      ["Page 1, slot 3, empty"],
      ["Page 1, slot 3: Dark Magician"],
    ]);
  });

  it("follows the pockets when the window resizes under a still pointer", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(260, 173);
    layout.shiftPockets(-110, 0);

    fireEvent(window, new Event("resize"));
    const lit = litPockets();
    release(row, 260, 173);

    expect([lit, darkMagicianPockets()]).toEqual([
      ["Page 1, slot 3, empty"],
      ["Page 1, slot 3: Dark Magician"],
    ]);
  });

  it("is never on a page that is turning", async () => {
    const user = await openDarkMagicianAt(1200);
    await user.click(slot("Next spread"));
    const row = printing(/SDY-006/);
    press(row);
    moveTo(150, 173);
    const lit = litPockets();

    release(row, 150, 173);

    expect([lit, darkMagicianPockets()]).toEqual([[], []]);
  });
});

// The pointer stays at (206, 173): over the gap between slots 1 and 2, nearer slot 2.
describe("the pocket a dragged printing lands in when the spread turns under it", () => {
  it("is none while the spread turns", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(206, 173);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    const lit = litPockets();
    release(row, 206, 173);
    await finishTurn();

    expect([lit, darkMagicianPockets()]).toEqual([[], []]);
  });

  it("is none after the turn until the pointer moves", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(206, 173);
    fireEvent.keyDown(document, { key: "ArrowRight" });

    await finishTurn();
    const lit = litPockets();
    release(row, 206, 173);

    expect([lit, darkMagicianPockets()]).toEqual([[], []]);
  });

  it("is none after the turn when the desk scrolls before the pointer moves", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(206, 173);
    fireEvent.keyDown(document, { key: "ArrowRight" });
    await finishTurn();

    fireEvent.scroll(window);
    const lit = litPockets();
    release(row, 206, 173);

    expect([lit, darkMagicianPockets()]).toEqual([[], []]);
  });

  it("is the pocket under the card once the pointer moves after the turn", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(206, 173);
    fireEvent.keyDown(document, { key: "ArrowRight" });
    await finishTurn();

    moveTo(206, 173);
    const lit = litPockets();
    release(row, 206, 173);

    expect([lit, darkMagicianPockets()]).toEqual([
      ["Page 2, slot 2, empty"],
      ["Page 2, slot 2: Dark Magician"],
    ]);
  });

  it("shows the card and the pocket under it once a drag begun mid-turn moves after the turn", async () => {
    const user = await openDarkMagicianAt(1200);
    await user.click(slot("Next spread"));
    const row = printing(/SDY-006/);
    press(row);
    moveTo(206, 173);
    await finishTurn();

    moveTo(206, 173);
    const lit = litPockets();
    const ghost = document.querySelector(".drag-ghost");
    release(row, 206, 173);

    expect([lit, ghost !== null, darkMagicianPockets()]).toEqual([
      ["Page 2, slot 2, empty"],
      true,
      ["Page 2, slot 2: Dark Magician"],
    ]);
  });

  it("is none at once when reduced motion cuts to the next spread", async () => {
    await openDarkMagicianAt(1200);
    viewportWidth(1200, true);
    const row = printing(/SDY-006/);
    press(row);
    moveTo(206, 173);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    const lit = litPockets();
    release(row, 206, 173);

    expect([lit, darkMagicianPockets()]).toEqual([[], []]);
  });
});

/** Files Dark Magician in slot 1 by tapping at 959px, where the catalogue is a bottom sheet whose top edge is at y 300. */
async function fileDarkMagicianUnderSheet() {
  const user = await openDarkMagicianAt(959);
  await user.click(slot("Page 1, slot 1, empty"));
  await user.click(printing(/SDY-006/));
  layout.place(screen.getByRole("complementary", { name: "Catalogue" }), {
    left: 0,
    top: 300,
    width: 1024,
    height: 468,
  });
}

/** Presses a filed copy at (x, y) with the mouse. */
function pressCopyAt(source: Element, x: number, y: number) {
  fireEvent.pointerDown(source, {
    pointerType: "mouse",
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: x,
    clientY: y,
  });
}

async function fileDarkMagician() {
  const user = await openDarkMagicianAt(1200);
  await user.click(slot("Page 1, slot 1, empty"));
  await user.click(printing(/SDY-006/));
  return user;
}

/** Files SDY-006 in page 1, slot 1 in Lightly Played and LOB-EN005 in page 1, slot 2 in Near Mint, with the catalogue still open. */
async function fileTwoDarkMagicians() {
  const user = await fileDarkMagician();
  await user.click(slot("Page 1, slot 2, empty"));
  await user.click(printing(/LOB-EN005/));
  await user.click(slot("Page 1, slot 1: Dark Magician"));
  await user.selectOptions(
    screen.getByRole("combobox", { name: "Condition" }),
    "Lightly Played",
  );
  await user.click(slot("Close"));
  return user;
}

const binderAnnouncement = () =>
  document.querySelector(".binder__announcement")?.textContent?.trim();

/** Opens the app on a saved binder holding the given copies, keyed by slot index from 0. */
function openSavedBinder(copies: Record<number, unknown>) {
  saveBinderWith(copies);
  return openApp().user;
}

describe("moving a filed copy", () => {
  it("starts the card over the pocket it was pressed in", async () => {
    const user = await fileDarkMagician();
    await user.click(slot("Close catalogue"));
    pressCopyAt(slot("Page 1, slot 1: Dark Magician"), 130, 150);

    moveTo(180, 150);

    const ghost = document.querySelector<HTMLImageElement>(".drag-ghost");
    expect([
      ghost?.getAttribute("src"),
      ghost?.style.left,
      ghost?.style.top,
      ghost?.style.width,
      ghost?.style.height,
    ]).toEqual(["/images/46986414.jpg", "150px", "100px", "100px", "146px"]);
  });

  // Pressed at its centre, a copy's card at (220, 173) covers 30px of its own pocket and 60px of slot 2.
  it("swaps with the filed copy in the pocket the card covers most", async () => {
    openSavedBinder({ 0: savedDarkMagician, 1: savedPotOfGreed });
    const source = slot("Page 1, slot 1: Dark Magician");
    pressCopyAt(source, 150, 173);
    moveTo(220, 173);
    const outlined = outlinedFilledPockets();

    fireEvent.pointerUp(window, {
      pointerId: 1,
      button: 0,
      clientX: 220,
      clientY: 173,
    });

    expect([outlined, binderAnnouncement()]).toEqual([
      ["Page 1, slot 2: Pot of Greed"],
      "Swapped LOB-EN005 to page 1, slot 2 and LOB-EN119 to page 1, slot 1.",
    ]);
  });

  // At (190, 173) the card covers 60px of its own pocket and 30px of empty slot 2.
  it("drops nothing while the card still covers its own pocket most", async () => {
    openSavedBinder({ 0: savedDarkMagician });
    const source = slot("Page 1, slot 1: Dark Magician");
    pressCopyAt(source, 150, 173);
    moveTo(190, 173);
    const shown = [...outlinedFilledPockets(), ...litPockets()];

    fireEvent.pointerUp(window, {
      pointerId: 1,
      button: 0,
      clientX: 190,
      clientY: 173,
    });

    expect([shown, darkMagicianPockets()]).toEqual([
      [],
      ["Page 1, slot 1: Dark Magician"],
    ]);
  });

  it("does not move a copy into a pocket the bottom sheet hides", async () => {
    await fileDarkMagicianUnderSheet();
    const source = slot("Page 1, slot 1: Dark Magician");
    const hidden = slot("Page 1, slot 7, empty");

    dragCopy(source, hidden);
    const lit = litPockets();
    releaseCopy(source, hidden);

    expect([lit, darkMagicianPockets()]).toEqual([
      [],
      ["Page 1, slot 1: Dark Magician"],
    ]);
  });

  // The card spans x 210–310 and y 200–346: 46px of slot 2, and 90px of slot 5 of which 44px shows above the sheet.
  it("moves a copy by the part of each pocket showing above the bottom sheet", async () => {
    await fileDarkMagicianUnderSheet();
    const source = slot("Page 1, slot 1: Dark Magician");
    pressCopyAt(source, 150, 173);
    moveTo(260, 273);
    const lit = litPockets();

    fireEvent.pointerUp(window, {
      pointerId: 1,
      button: 0,
      clientX: 260,
      clientY: 273,
    });

    expect([lit, darkMagicianPockets()]).toEqual([
      ["Page 1, slot 2, empty"],
      ["Page 1, slot 2: Dark Magician"],
    ]);
  });

  it("opens the copy on the first mouse click after a touch swipe without a click", async () => {
    const user = await fileDarkMagician();
    await user.click(slot("Close catalogue"));
    const source = slot("Page 1, slot 1: Dark Magician");
    fireEvent.pointerDown(source, {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      clientX: 400,
      clientY: 300,
    });
    fireEvent.pointerUp(source, {
      pointerId: 2,
      pointerType: "touch",
      isPrimary: true,
      clientX: 550,
      clientY: 300,
    });

    await user.click(source);

    expect(screen.getByRole("dialog", { name: "Page 1, slot 1" })).toBeTruthy();
  });

  it("does not drag a copy pressed and moved by touch", async () => {
    const user = await fileDarkMagician();
    await user.click(slot("Close catalogue"));
    const source = slot("Page 1, slot 1: Dark Magician");
    const target = slot("Page 1, slot 2, empty");

    // A vertical press-and-move, so the binder does not take it as a page swipe.
    fireEvent.pointerDown(source, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      clientX: 260,
      clientY: 0,
    });
    moveOnto(target);
    const ghost = document.querySelector(".drag-ghost");
    releaseCopy(source, target);

    expect(ghost).toBeNull();
    expect([
      source.getAttribute("aria-label"),
      target.getAttribute("aria-label"),
    ]).toEqual(["Page 1, slot 1: Dark Magician", "Page 1, slot 2, empty"]);
  });

  it("moves the printing and edited condition into an empty pocket", async () => {
    const user = await fileDarkMagician();
    const source = slot("Page 1, slot 1: Dark Magician");
    await user.click(source);
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Condition" }),
      "Lightly Played",
    );
    await user.click(slot("Close"));
    await user.click(slot("Close catalogue"));
    const target = slot("Page 1, slot 3, empty");

    dragCopy(source, target);
    releaseCopy(source, target);

    expect(source.getAttribute("aria-label")).toBe("Page 1, slot 1, empty");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("status").textContent?.trim()).toBe(
      "Moved SDY-006 to page 1, slot 3.",
    );
    await user.click(slot("Page 1, slot 3: Dark Magician"));
    expect(
      within(screen.getByRole("list", { name: "Printing" })).getByText(
        "SDY-006",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole<HTMLSelectElement>("combobox", { name: "Condition" })
        .value,
    ).toBe("Lightly Played");
  });

  it("swaps two filed copies with their printings and conditions", async () => {
    const user = await fileTwoDarkMagicians();
    await user.click(slot("Close catalogue"));
    const source = slot("Page 1, slot 1: Dark Magician");
    const occupied = slot("Page 1, slot 2: Dark Magician");

    dragCopy(source, occupied);
    releaseCopy(source, occupied);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(binderAnnouncement()).toBe(
      "Swapped SDY-006 to page 1, slot 2 and LOB-EN005 to page 1, slot 1.",
    );
    expect(await detailOf(user, source)).toEqual({
      printing: "LOB-EN005",
      condition: "Near Mint",
    });
    expect(await detailOf(user, occupied)).toEqual({
      printing: "SDY-006",
      condition: "Lightly Played",
    });
  });

  it("swaps across the gutter with a pen", async () => {
    prefersReducedMotion(true);
    const user = openSavedBinder({
      17: savedPlayedSdyDarkMagician,
      18: savedDarkMagician,
    });
    await user.click(slot("Next spread"));
    const source = slot("Page 2, slot 9: Dark Magician");
    const occupied = slot("Page 3, slot 1: Dark Magician");

    dragCopy(source, occupied, "pen");
    releaseCopy(source, occupied);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(binderAnnouncement()).toBe(
      "Swapped SDY-006 to page 3, slot 1 and LOB-EN005 to page 2, slot 9.",
    );
    expect(await detailOf(user, source)).toEqual({
      printing: "LOB-EN005",
      condition: "Near Mint",
    });
    expect(await detailOf(user, occupied)).toEqual({
      printing: "SDY-006",
      condition: "Lightly Played",
    });
  });

  it("keeps a catalogue target on the pocket a copy moves out of to an empty pocket", async () => {
    const user = await fileDarkMagician();
    const source = slot("Page 1, slot 1: Dark Magician");
    await user.click(source);
    await user.click(screen.getByRole("button", { name: "Replace" }));
    const panel = within(
      screen.getByRole("complementary", { name: "Catalogue" }),
    );

    dragCopy(source, slot("Page 1, slot 3, empty"));
    releaseCopy(source, slot("Page 1, slot 3, empty"));

    expect(panel.getByRole("heading", { level: 2 }).textContent).toBe(
      "Adding to page 1, slot 1",
    );
  });

  it("outlines the filled pocket under the pointer", async () => {
    const user = await fileTwoDarkMagicians();
    await user.click(slot("Close catalogue"));
    const occupied = slot("Page 1, slot 2: Dark Magician");

    dragCopy(slot("Page 1, slot 1: Dark Magician"), occupied);

    expect(occupied.classList.contains("slot--aimed")).toBe(true);
  });

  it("does not outline a filled pocket away from the pointer", async () => {
    const user = await fileTwoDarkMagicians();
    await user.click(slot("Page 1, slot 3, empty"));
    await user.click(printing(/SDY-006/));
    await user.click(slot("Close catalogue"));

    dragCopy(
      slot("Page 1, slot 1: Dark Magician"),
      slot("Page 1, slot 2: Dark Magician"),
    );

    expect(
      slot("Page 1, slot 3: Dark Magician").classList.contains("slot--aimed"),
    ).toBe(false);
  });

  it("never outlines the pocket the copy is dragged from", async () => {
    const user = await fileTwoDarkMagicians();
    await user.click(slot("Close catalogue"));
    const source = slot("Page 1, slot 1: Dark Magician");

    dragCopy(source, source);

    expect(source.classList.contains("slot--aimed")).toBe(false);
  });

  it("clears a catalogue target that a swap moves away", async () => {
    const user = await fileTwoDarkMagicians();
    const occupied = slot("Page 1, slot 2: Dark Magician");
    await user.click(occupied);
    await user.click(screen.getByRole("button", { name: "Replace" }));
    const panel = within(
      screen.getByRole("complementary", { name: "Catalogue" }),
    );

    dragCopy(slot("Page 1, slot 1: Dark Magician"), occupied);
    releaseCopy(slot("Page 1, slot 1: Dark Magician"), occupied);

    expect(panel.getByRole("heading", { level: 2 }).textContent).toBe(
      "Add cards",
    );
  });

  it("clears a catalogue target on the copy that is dragged into a swap", async () => {
    const user = await fileTwoDarkMagicians();
    const source = slot("Page 1, slot 1: Dark Magician");
    await user.click(source);
    await user.click(screen.getByRole("button", { name: "Replace" }));
    const panel = within(
      screen.getByRole("complementary", { name: "Catalogue" }),
    );

    dragCopy(source, slot("Page 1, slot 2: Dark Magician"));
    releaseCopy(source, slot("Page 1, slot 2: Dark Magician"));

    expect(panel.getByRole("heading", { level: 2 }).textContent).toBe(
      "Add cards",
    );
  });

  it("keeps a catalogue target when Escape cancels an active drag", async () => {
    const user = await fileDarkMagician();
    const target = slot("Page 1, slot 2, empty");
    await user.click(target);
    const source = slot("Page 1, slot 1: Dark Magician");

    dragCopy(source, target);
    fireEvent.keyDown(target, { key: "Escape" });
    releaseCopy(source, target);

    expect(screen.queryByRole("dialog")).toBeNull();
    expect(target.getAttribute("aria-label")).toBe("Page 1, slot 2, empty");
    await user.click(printing(/LOB-EN005/));
    expect(slot("Page 1, slot 2: Dark Magician")).toBeTruthy();
  });

  it("preserves the catalogue target through Escape repeats until a new press", async () => {
    const user = await fileDarkMagician();
    const target = slot("Page 1, slot 2, empty");
    await user.click(target);
    dragCopy(slot("Page 1, slot 1: Dark Magician"), target);
    const panel = within(
      screen.getByRole("complementary", { name: "Catalogue" }),
    );

    fireEvent.keyDown(target, { key: "Escape" });
    fireEvent.keyDown(target, { key: "Escape", repeat: true });
    fireEvent.pointerUp(target, { pointerId: 1 });
    fireEvent.keyDown(target, { key: "Escape", repeat: true });

    expect(panel.getByRole("heading", { level: 2 }).textContent).toBe(
      "Adding to page 1, slot 2",
    );

    fireEvent.keyUp(target, { key: "Escape" });
    fireEvent.keyDown(target, { key: "Escape" });

    expect(panel.getByRole("heading", { level: 2 }).textContent).toBe(
      "Add cards",
    );
  });

  it("cancels a drag when only the secondary button remains held", async () => {
    await fileDarkMagician();
    const source = slot("Page 1, slot 1: Dark Magician");
    const target = slot("Page 1, slot 2, empty");
    dragCopy(source, target);

    moveTo(410, 300, 2);
    releaseCopy(source, target);

    expect(document.querySelector(".drag-ghost")).toBeNull();
    expect([
      source.getAttribute("aria-label"),
      target.getAttribute("aria-label"),
    ]).toEqual(["Page 1, slot 1: Dark Magician", "Page 1, slot 2, empty"]);
  });

  it("does not drop a copy on a secondary button release", async () => {
    await fileDarkMagician();
    const source = slot("Page 1, slot 1: Dark Magician");
    const target = slot("Page 1, slot 2, empty");
    dragCopy(source, target);

    fireEvent.pointerUp(target, { pointerId: 1, button: 2 });

    expect(target.getAttribute("aria-label")).toBe("Page 1, slot 2, empty");
    expect(source.getAttribute("aria-label")).toBe(
      "Page 1, slot 1: Dark Magician",
    );
  });

  it("clears a catalogue target when the moved copy fills it", async () => {
    const user = await fileDarkMagician();
    const target = slot("Page 1, slot 2, empty");
    await user.click(target);
    const source = slot("Page 1, slot 1: Dark Magician");
    const otherPrinting = printing(/LOB-EN005/);

    dragCopy(source, target);
    releaseCopy(source, target);
    await user.click(otherPrinting);

    expect(otherPrinting.getAttribute("aria-pressed")).toBe("true");
    expect(source.getAttribute("aria-label")).toBe("Page 1, slot 1, empty");
  });

  it("does not drop a copy after another copy's detail opens mid-drag", async () => {
    const user = await fileDarkMagician();
    await user.click(slot("Page 1, slot 3, empty"));
    await user.click(printing(/LOB-EN005/));
    await user.click(slot("Close catalogue"));
    const source = slot("Page 1, slot 1: Dark Magician");
    const target = slot("Page 1, slot 2, empty");
    dragCopy(source, target);

    fireEvent.click(slot("Page 1, slot 3: Dark Magician"), { detail: 0 });
    expect(document.querySelector(".drag-ghost")).toBeNull();
    fireEvent.pointerUp(target, { pointerId: 1, ...pointAt(target) });

    expect([
      source.getAttribute("aria-label"),
      target.getAttribute("aria-label"),
    ]).toEqual(["Page 1, slot 1: Dark Magician", "Page 1, slot 2, empty"]);
  });

  it("cancels a drag when reduced motion immediately cuts to a new spread", async () => {
    const user = await fileDarkMagician();
    viewportWidth(1200, true);
    const source = slot("Page 1, slot 1: Dark Magician");
    const target = slot("Page 1, slot 2, empty");
    dragCopy(source, target);
    expect(target.classList.contains("slot--drop")).toBe(true);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(document.querySelector(".drag-ghost")).toBeNull();
    const nextSpread = slot("Page 2, slot 1, empty");
    fireEvent.pointerUp(nextSpread, { pointerId: 1, ...pointAt(nextSpread) });

    expect(nextSpread.getAttribute("aria-label")).toBe("Page 2, slot 1, empty");
    await user.click(slot("Previous spread"));
    expect(slot("Page 1, slot 1: Dark Magician")).toBeTruthy();
  });
});

/** Dark Magician is still in page 1, slot 1, Pot of Greed in slot 2, and the binder said nothing. */
function expectNothingSwapped() {
  expect([
    labelOf("Page 1, slot 1"),
    labelOf("Page 1, slot 2"),
    binderAnnouncement(),
  ]).toEqual([
    "Page 1, slot 1: Dark Magician",
    "Page 1, slot 2: Pot of Greed",
    "",
  ]);
}

describe("a cancelled drag onto a filled pocket", () => {
  it("swaps nothing when released on the copy's own pocket", () => {
    openSavedBinder({ 0: savedDarkMagician, 1: savedPotOfGreed });
    const source = slot("Page 1, slot 1: Dark Magician");

    dragCopy(source, source);
    releaseCopy(source, source);

    expectNothingSwapped();
  });

  it("swaps nothing when released outside the binder", () => {
    openSavedBinder({ 0: savedDarkMagician, 1: savedPotOfGreed });
    const source = slot("Page 1, slot 1: Dark Magician");
    dragCopy(source, slot("Page 1, slot 2: Pot of Greed"));

    releaseCopy(source, document.body);

    expectNothingSwapped();
  });

  it("swaps nothing when Escape is pressed mid-drag", () => {
    openSavedBinder({ 0: savedDarkMagician, 1: savedPotOfGreed });
    const source = slot("Page 1, slot 1: Dark Magician");
    const occupied = slot("Page 1, slot 2: Pot of Greed");
    dragCopy(source, occupied);

    fireEvent.keyDown(occupied, { key: "Escape" });
    releaseCopy(source, occupied);

    expectNothingSwapped();
  });

  it("swaps nothing on a secondary button release", () => {
    openSavedBinder({ 0: savedDarkMagician, 1: savedPotOfGreed });
    const source = slot("Page 1, slot 1: Dark Magician");
    const occupied = slot("Page 1, slot 2: Pot of Greed");
    dragCopy(source, occupied);

    fireEvent.pointerUp(occupied, { pointerId: 1, button: 2 });

    expectNothingSwapped();
  });

  it("swaps nothing when the primary button is no longer held", () => {
    openSavedBinder({ 0: savedDarkMagician, 1: savedPotOfGreed });
    const source = slot("Page 1, slot 1: Dark Magician");
    const occupied = slot("Page 1, slot 2: Pot of Greed");
    dragCopy(source, occupied);

    moveTo(410, 300, 0);
    releaseCopy(source, occupied);

    expectNothingSwapped();
  });

  it("swaps nothing after another copy's detail opens mid-drag", () => {
    openSavedBinder({
      0: savedDarkMagician,
      1: savedPotOfGreed,
      2: savedPotOfGreed,
    });
    const source = slot("Page 1, slot 1: Dark Magician");
    const occupied = slot("Page 1, slot 2: Pot of Greed");
    dragCopy(source, occupied);

    fireEvent.click(slot("Page 1, slot 3: Pot of Greed"), { detail: 0 });
    fireEvent.pointerUp(occupied, { pointerId: 1, ...pointAt(occupied) });

    expectNothingSwapped();
  });

  it("swaps nothing when the spread turns mid-drag", () => {
    prefersReducedMotion(true);
    openSavedBinder({ 0: savedDarkMagician, 1: savedPotOfGreed });
    dragCopy(
      slot("Page 1, slot 1: Dark Magician"),
      slot("Page 1, slot 2: Pot of Greed"),
    );

    fireEvent.keyDown(document, { key: "ArrowRight" });
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    const occupied = slot("Page 1, slot 2: Pot of Greed");
    fireEvent.pointerUp(occupied, { pointerId: 1, ...pointAt(occupied) });

    expectNothingSwapped();
  });

  it("swaps nothing when a copy is pressed and moved by touch", () => {
    openSavedBinder({ 0: savedDarkMagician, 1: savedPotOfGreed });
    const source = slot("Page 1, slot 1: Dark Magician");
    const occupied = slot("Page 1, slot 2: Pot of Greed");

    // A vertical press-and-move, so the binder does not take it as a page swipe.
    fireEvent.pointerDown(source, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      clientX: 260,
      clientY: 0,
    });
    moveOnto(occupied);
    releaseCopy(source, occupied);

    expectNothingSwapped();
  });
});
