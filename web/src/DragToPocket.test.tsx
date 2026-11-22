import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "./App";
import { fakeCatalogue } from "./test/fakeCatalogue";
import { viewportWidth } from "./test/media";

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

function moveTo(x: number, y: number) {
  fireEvent.pointerMove(window, { pointerId: 1, clientX: x, clientY: y });
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
