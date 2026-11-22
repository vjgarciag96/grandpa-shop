import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { fakeCatalogue } from "./test/fakeCatalogue";
import { prefersReducedMotion } from "./test/media";

function renderApp() {
  render(<App catalogue={fakeCatalogue().catalogue} />);
  return userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
}

const shownPages = () =>
  screen
    .getAllByRole("region", { name: /^Page \d+$/ })
    .map((p) => p.getAttribute("aria-label"));
const turningPage = () => document.querySelector(".page-turn");

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  prefersReducedMotion(false);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("turning the binder", () => {
  it("shows pages 2 and 3 after turning forward from page 1", async () => {
    const user = renderApp();

    await user.click(screen.getByRole("button", { name: "Next spread" }));

    expect(shownPages()).toEqual(["Page 2", "Page 3"]);
  });

  it("comes back to page 1 when turning back", async () => {
    const user = renderApp();
    await user.click(screen.getByRole("button", { name: "Next spread" }));

    await user.click(screen.getByRole("button", { name: "Previous spread" }));

    expect(shownPages()).toEqual(["Page 1"]);
  });

  it("cannot turn back from the first spread", () => {
    renderApp();

    const previous = screen.getByRole("button", {
      name: "Previous spread",
    }) as HTMLButtonElement;

    expect(previous.disabled).toBe(true);
  });

  it("cannot turn forward from the last spread, page 40 alone", async () => {
    const user = renderApp();
    await user.keyboard("{ArrowRight>20/}");

    const next = screen.getByRole("button", {
      name: "Next spread",
    }) as HTMLButtonElement;

    expect([shownPages(), next.disabled]).toEqual([["Page 40"], true]);
  });

  it("turns forward with the right arrow key", async () => {
    const user = renderApp();

    await user.keyboard("{ArrowRight}");

    expect(shownPages()).toEqual(["Page 2", "Page 3"]);
  });

  it("does not turn while a search is being typed", async () => {
    const user = renderApp();
    await user.click(
      screen.getByRole("button", { name: "Page 1, slot 1, empty" }),
    );
    await user.type(
      screen.getByRole("searchbox", { name: "Search cards" }),
      "dark",
    );

    await user.keyboard("{ArrowRight}");
    await user.keyboard("{Escape}");

    expect(shownPages()).toEqual(["Page 1"]);
  });

  it("turns forward with a swipe to the left across the spread", () => {
    renderApp();
    const spread = screen.getByTestId("spread");

    fireEvent.pointerDown(spread, {
      clientX: 300,
      clientY: 200,
      isPrimary: true,
    });
    fireEvent.pointerUp(spread, { clientX: 200, clientY: 205 });

    expect(shownPages()).toEqual(["Page 2", "Page 3"]);
  });

  it("does not turn for a swipe shorter than the threshold", () => {
    renderApp();
    const spread = screen.getByTestId("spread");

    fireEvent.pointerDown(spread, {
      clientX: 300,
      clientY: 200,
      isPrimary: true,
    });
    fireEvent.pointerUp(spread, { clientX: 260, clientY: 200 });

    expect(shownPages()).toEqual(["Page 1"]);
  });

  it("does not open a slot when a swipe ends on the same slot at the binder edge", () => {
    renderApp();
    const slot = screen.getByRole("button", { name: "Page 1, slot 1, empty" });

    fireEvent.pointerDown(slot, {
      clientX: 200,
      clientY: 200,
      isPrimary: true,
    });
    fireEvent.pointerUp(slot, { clientX: 300, clientY: 200, isPrimary: true });
    fireEvent.click(slot, { detail: 1 });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("fills a slot on the page it turned to", async () => {
    const user = renderApp();
    await user.click(screen.getByRole("button", { name: "Next spread" }));
    await user.click(
      screen.getByRole("button", { name: "Page 3, slot 9, empty" }),
    );
    await user.type(
      screen.getByRole("searchbox", { name: "Search cards" }),
      "pot",
    );
    await user.click(
      await screen.findByRole("button", { name: /Pot of Greed/ }),
    );

    await user.click(screen.getByRole("button", { name: /LOB-EN119/ }));

    expect(
      screen.getByRole("button", { name: "Page 3, slot 9: Pot of Greed" }),
    ).toBeTruthy();
  });
});

describe("the page-turn motion", () => {
  it("lifts the turning page for 480ms and then lets it go", async () => {
    const user = renderApp();
    await user.click(screen.getByRole("button", { name: "Next spread" }));
    const during = turningPage() !== null;

    act(() => vi.advanceTimersByTime(480));

    expect([during, turningPage()]).toEqual([true, null]);
  });

  it("cuts without lifting a page when reduced motion is asked for", async () => {
    prefersReducedMotion(true);
    const user = renderApp();

    await user.click(screen.getByRole("button", { name: "Next spread" }));

    expect(turningPage()).toBeNull();
  });
});
