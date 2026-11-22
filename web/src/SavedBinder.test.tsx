import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { darkMagician, fakeCatalogue } from "./test/fakeCatalogue";

const SAVED_BINDER_KEY = "grandpa-shop.dev-binder.v1";

function openApp() {
  const view = render(<App catalogue={fakeCatalogue().catalogue} />);
  return { user: userEvent.setup(), close: view.unmount };
}

const savedDarkMagician = {
  card: darkMagician,
  printing: darkMagician.printings[0],
  condition: "Near Mint",
};

/** A saved binder of 360 slots with the given copy in the first slot. */
function saveBinderStartingWith(copy: unknown) {
  const slots: unknown[] = Array(360).fill(null);
  slots[0] = copy;
  localStorage.setItem(SAVED_BINDER_KEY, JSON.stringify({ slots }));
}

const slot = (name: string) => screen.getByRole("button", { name });

async function placeDarkMagicianInFirstSlot(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.click(slot("Page 1, slot 1, empty"));
  await user.type(
    screen.getByRole("searchbox", { name: "Search cards and sets" }),
    "dark",
  );
  await user.click(
    await screen.findByRole("button", { name: /Dark Magician/ }),
  );
  await user.click(screen.getByRole("button", { name: /LOB-EN005/ }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("the binder across reloads", () => {
  it("keeps a placed card when the app is opened again", async () => {
    const first = openApp();
    await placeDarkMagicianInFirstSlot(first.user);
    first.close();

    openApp();

    expect(slot("Page 1, slot 1: Dark Magician")).toBeTruthy();
  });

  it("keeps a changed condition when the app is opened again", async () => {
    const first = openApp();
    await placeDarkMagicianInFirstSlot(first.user);
    await first.user.click(slot("Page 1, slot 1: Dark Magician"));
    await first.user.selectOptions(
      screen.getByRole("combobox", { name: "Condition" }),
      "Heavily Played",
    );
    first.close();

    const second = openApp();
    await second.user.click(slot("Page 1, slot 1: Dark Magician"));

    expect(
      (screen.getByRole("combobox", { name: "Condition" }) as HTMLSelectElement)
        .value,
    ).toBe("Heavily Played");
  });

  it("keeps a removed copy gone when the app is opened again", async () => {
    const first = openApp();
    await placeDarkMagicianInFirstSlot(first.user);
    await first.user.click(slot("Page 1, slot 1: Dark Magician"));
    await first.user.click(
      screen.getByRole("button", { name: "Remove from slot" }),
    );
    first.close();

    openApp();

    expect(slot("Page 1, slot 1, empty")).toBeTruthy();
  });

  it("starts with an empty binder when the saved binder is unreadable", () => {
    localStorage.setItem(SAVED_BINDER_KEY, "{not json");

    openApp();

    expect(screen.getAllByRole("button", { name: /, empty$/ })).toHaveLength(9);
  });

  it("restores a saved binder of 360 slots", () => {
    saveBinderStartingWith(savedDarkMagician);

    openApp();

    expect(slot("Page 1, slot 1: Dark Magician")).toBeTruthy();
  });

  it("starts with an empty binder when the saved binder has too few slots", () => {
    localStorage.setItem(
      SAVED_BINDER_KEY,
      JSON.stringify({ slots: [savedDarkMagician] }),
    );

    openApp();

    expect(slot("Page 1, slot 1, empty")).toBeTruthy();
  });

  it("starts with an empty binder when a saved copy has an unknown condition", () => {
    saveBinderStartingWith({ ...savedDarkMagician, condition: "Mint" });

    openApp();

    expect(slot("Page 1, slot 1, empty")).toBeTruthy();
  });

  it("starts with an empty binder when a saved card's text is not text", () => {
    saveBinderStartingWith({
      ...savedDarkMagician,
      card: { ...darkMagician, text: { en: "The ultimate wizard" } },
    });

    openApp();

    expect(slot("Page 1, slot 1, empty")).toBeTruthy();
  });

  it("starts with an empty binder when a saved monster stat is not text or a number", () => {
    saveBinderStartingWith({
      ...savedDarkMagician,
      card: {
        ...darkMagician,
        monster: { ...darkMagician.monster, atk: { value: 2500 } },
      },
    });

    openApp();

    expect(slot("Page 1, slot 1, empty")).toBeTruthy();
  });

  it("still places cards when the browser refuses storage", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage is disabled", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage is disabled", "SecurityError");
    });
    const { user } = openApp();

    await placeDarkMagicianInFirstSlot(user);

    expect(slot("Page 1, slot 1: Dark Magician")).toBeTruthy();
  });
});
