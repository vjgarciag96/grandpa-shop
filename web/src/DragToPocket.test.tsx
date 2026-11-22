import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { darkMagician, fakeCatalogue } from "./test/fakeCatalogue";
import { prefersReducedMotion, viewportWidth } from "./test/media";

const slot = (name: string) => screen.getByRole("button", { name });
const printing = (code: RegExp) => screen.getByRole("button", { name: code });

/** jsdom does no layout, so the element under the pointer is whatever the test says it is. */
function pointerIsOver(element: Element | null) {
  document.elementFromPoint = () => element;
}

async function openResultsAt(width: number, query: string, result: RegExp) {
  viewportWidth(width);
  render(<App catalogue={fakeCatalogue().catalogue} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", { name: "Add cards" }));
  await user.type(
    screen.getByRole("searchbox", { name: "Search cards and sets" }),
    query,
  );
  await user.click(await screen.findByRole("button", { name: result }));
  return user;
}

function openDarkMagicianAt(width: number) {
  return openResultsAt(width, "dark", /Dark Magician/);
}

function press(row: Element) {
  fireEvent.pointerDown(row, {
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: 900,
    clientY: 300,
  });
}

function moveTo(x: number, y: number, buttons = 1) {
  fireEvent.pointerMove(window, {
    pointerId: 1,
    clientX: x,
    clientY: y,
    buttons,
  });
}

/** Releases the pointer; the browser then clicks the row the press began on. */
function release(row: Element, x: number, y: number) {
  fireEvent.pointerUp(window, { pointerId: 1, clientX: x, clientY: y });
  fireEvent.click(row, { detail: 1 });
}

afterEach(() => {
  pointerIsOver(null);
});

describe("dragging a printing onto a slot", () => {
  it("fills the empty slot it is dropped on", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    const target = slot("Page 1, slot 2, empty");
    document.elementFromPoint = (x, y) =>
      x === 400 && y === 300 ? target : null;

    press(row);
    moveTo(400, 300);
    release(row, 400, 300);

    expect(slot("Page 1, slot 2: Dark Magician")).toBeTruthy();
  });

  it("files a printing dragged directly from a set", async () => {
    await openResultsAt(1200, "legend", /Legend of Blue Eyes White Dragon/);
    const row = await screen.findByRole("button", { name: /LOB-EN119/ });
    pointerIsOver(slot("Page 1, slot 2, empty"));

    press(row);
    moveTo(400, 300);
    release(row, 400, 300);

    expect(slot("Page 1, slot 2: Pot of Greed")).toBeTruthy();
  });

  it("places the dragged printing, not another of the card", async () => {
    const user = await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    pointerIsOver(slot("Page 1, slot 2, empty"));
    press(row);
    moveTo(400, 300);
    release(row, 400, 300);

    await user.click(slot("Page 1, slot 2: Dark Magician"));

    const detail = within(screen.getByRole("dialog")).getByRole("list", {
      name: "Printing",
    });
    expect(within(detail).getByText("SDY-006")).toBeTruthy();
  });

  it("does not also pick the printing up when the drag ends", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    pointerIsOver(slot("Page 1, slot 2, empty"));

    press(row);
    moveTo(400, 300);
    release(row, 400, 300);

    expect(row.getAttribute("aria-pressed")).toBe("false");
  });

  it("lights the empty slot under the pointer", async () => {
    await openDarkMagicianAt(1200);
    const target = slot("Page 1, slot 4, empty");
    document.elementFromPoint = (x, y) =>
      x === 400 && y === 300 ? target : null;

    press(printing(/SDY-006/));
    moveTo(400, 300);

    expect(slot("Page 1, slot 4, empty").classList.contains("slot--drop")).toBe(
      true,
    );
  });

  it("shows the card following the pointer", async () => {
    await openDarkMagicianAt(1200);
    pointerIsOver(null);

    press(printing(/SDY-006/));
    moveTo(420, 310);

    const ghost = document.querySelector<HTMLImageElement>(".drag-ghost");
    expect([
      ghost?.getAttribute("src"),
      ghost?.style.left,
      ghost?.style.top,
    ]).toEqual(["/images/46986414.jpg", "420px", "310px"]);
  });

  it("leaves a filled slot as it was", async () => {
    const user = await openDarkMagicianAt(1200);
    await user.click(slot("Page 1, slot 1, empty"));
    await user.click(printing(/LOB-EN005/));
    await user.click(
      screen.getByRole("button", { name: /Pot of Greed|Back to results/ }),
    );
    await user.clear(
      screen.getByRole("searchbox", { name: "Search cards and sets" }),
    );
    await user.type(
      screen.getByRole("searchbox", { name: "Search cards and sets" }),
      "pot",
    );
    await user.click(
      await screen.findByRole("button", { name: /Pot of Greed/ }),
    );
    const row = printing(/LOB-EN119/);
    pointerIsOver(slot("Page 1, slot 1: Dark Magician"));

    press(row);
    moveTo(400, 300);
    release(row, 400, 300);

    expect(slot("Page 1, slot 1: Dark Magician")).toBeTruthy();
  });

  it("drops nothing when released away from the binder", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    pointerIsOver(document.body);

    press(row);
    moveTo(400, 300);
    release(row, 400, 300);

    expect(
      screen.queryAllByRole("button", { name: /: Dark Magician$/ }),
    ).toEqual([]);
  });

  it("drops nothing when Escape is pressed mid-drag", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    pointerIsOver(slot("Page 1, slot 2, empty"));
    press(row);
    moveTo(400, 300);

    fireEvent.keyDown(window, { key: "Escape" });
    release(row, 400, 300);

    expect(slot("Page 1, slot 2, empty")).toBeTruthy();
  });

  it("does not pick up the printing when released after Escape", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    pointerIsOver(row);
    press(row);
    moveTo(890, 300);

    fireEvent.keyDown(window, { key: "Escape" });
    release(row, 900, 300);

    expect(row.getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps dragging when another pointer is canceled", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    pointerIsOver(slot("Page 1, slot 2, empty"));
    press(row);
    moveTo(400, 300);

    fireEvent.pointerCancel(window, { pointerId: 2 });
    release(row, 400, 300);

    expect(slot("Page 1, slot 2: Dark Magician")).toBeTruthy();
  });

  it("drops nothing when the catalogue closes during a drag", async () => {
    const user = await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    pointerIsOver(slot("Page 1, slot 2, empty"));
    press(row);
    moveTo(400, 300);

    screen.getByRole("button", { name: "Close catalogue" }).focus();
    await user.keyboard("{Enter}");
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 400, clientY: 300 });

    expect(slot("Page 1, slot 2, empty")).toBeTruthy();
  });

  it("treats a press that moves less than the drag distance as a tap", async () => {
    await openDarkMagicianAt(1200);
    const row = printing(/SDY-006/);
    pointerIsOver(slot("Page 1, slot 2, empty"));

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
    pointerIsOver(slot("Page 1, slot 2, empty"));

    press(row);
    moveTo(400, 300);
    expect(document.querySelector(".drag-ghost")).toBeNull();

    fireEvent.pointerUp(window, { pointerId: 1, clientX: 400, clientY: 300 });

    expect(slot("Page 1, slot 2, empty")).toBeTruthy();
  });
});

async function fileDarkMagician() {
  const user = await openDarkMagicianAt(1200);
  await user.click(slot("Page 1, slot 1, empty"));
  await user.click(printing(/SDY-006/));
  return user;
}

function dragCopy(
  source: HTMLElement,
  target: HTMLElement | null,
  pointerType = "mouse",
) {
  pointerIsOver(target);
  fireEvent.pointerDown(source, {
    pointerType,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    clientX: 700,
    clientY: 300,
  });
  moveTo(400, 300);
}

function releaseCopy(source: HTMLElement, target = source) {
  fireEvent.pointerUp(target, {
    pointerId: 1,
    clientX: 400,
    clientY: 300,
  });
  fireEvent.click(source, { detail: 1 });
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

/** Opens a pocket's detail, reads its printings and condition, and closes it again. */
async function detailOf(
  user: ReturnType<typeof userEvent.setup>,
  pocket: HTMLElement,
) {
  await user.click(pocket);
  const dialog = within(screen.getByRole("dialog"));
  const shown = {
    printings: dialog
      .getAllByRole("list", { name: "Printing" })
      .map((list) => within(list).getAllByRole("listitem")[0].textContent),
    condition: dialog.getByRole<HTMLSelectElement>("combobox", {
      name: "Condition",
    }).value,
  };
  await user.click(dialog.getByRole("button", { name: "Close" }));
  return shown;
}

const binderAnnouncement = () =>
  document.querySelector(".binder__announcement")?.textContent?.trim();

/** Opens the app on a saved binder holding the given copies, keyed by slot index from 0. */
function openSavedBinder(copies: Record<number, object>) {
  const slots: unknown[] = Array(360).fill(null);
  for (const [index, copy] of Object.entries(copies)) {
    slots[Number(index)] = copy;
  }
  localStorage.setItem("grandpa-shop.dev-binder.v1", JSON.stringify({ slots }));
  render(<App catalogue={fakeCatalogue().catalogue} />);
  return userEvent.setup();
}

describe("moving a filed copy", () => {
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
    pointerIsOver(target);

    // A vertical press-and-move, so the binder does not take it as a page swipe.
    fireEvent.pointerDown(source, {
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
      button: 0,
      clientX: 400,
      clientY: 0,
    });
    moveTo(400, 300);
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
      printings: ["LOB-EN005"],
      condition: "Near Mint",
    });
    expect(await detailOf(user, occupied)).toEqual({
      printings: ["SDY-006"],
      condition: "Lightly Played",
    });
  });

  it("swaps across the gutter with a pen", async () => {
    prefersReducedMotion(true);
    const user = openSavedBinder({
      17: {
        card: darkMagician,
        printing: darkMagician.printings[1],
        condition: "Lightly Played",
      },
      18: {
        card: darkMagician,
        printing: darkMagician.printings[0],
        condition: "Near Mint",
      },
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
      printings: ["LOB-EN005"],
      condition: "Near Mint",
    });
    expect(await detailOf(user, occupied)).toEqual({
      printings: ["SDY-006"],
      condition: "Lightly Played",
    });
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
    fireEvent.pointerUp(target, { pointerId: 1, clientX: 400, clientY: 300 });

    expect([
      source.getAttribute("aria-label"),
      target.getAttribute("aria-label"),
    ]).toEqual(["Page 1, slot 1: Dark Magician", "Page 1, slot 2, empty"]);
  });

  it("cancels a drag when reduced motion immediately cuts to a new spread", async () => {
    const user = await fileDarkMagician();
    prefersReducedMotion(true);
    const source = slot("Page 1, slot 1: Dark Magician");
    const target = slot("Page 1, slot 2, empty");
    dragCopy(source, target);
    expect(target.classList.contains("slot--drop")).toBe(true);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(document.querySelector(".drag-ghost")).toBeNull();
    const nextSpread = slot("Page 2, slot 1, empty");
    pointerIsOver(nextSpread);
    fireEvent.pointerUp(nextSpread, { pointerId: 1 });

    expect(nextSpread.getAttribute("aria-label")).toBe("Page 2, slot 1, empty");
    await user.click(slot("Previous spread"));
    expect(slot("Page 1, slot 1: Dark Magician")).toBeTruthy();
  });
});
