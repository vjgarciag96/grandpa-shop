import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  darkMagician,
  failingCatalogue,
  fakeCatalogue,
} from "./test/fakeCatalogue";

type User = ReturnType<typeof userEvent.setup>;

function renderApp(catalogue = fakeCatalogue().catalogue) {
  render(<App catalogue={catalogue} />);
  return userEvent.setup();
}

const panel = () => screen.getByRole("complementary", { name: "Catalogue" });
const panelTitle = () =>
  within(panel()).getByRole("heading", { level: 2 }).textContent;
const status = () =>
  panel().querySelector(".catalogue__announcement")?.textContent;
const slot = (name: string) => screen.getByRole("button", { name });
const isAimed = (name: string) => slot(name).classList.contains("slot--aimed");

async function search(user: User, query: string) {
  await user.type(
    screen.getByRole("searchbox", { name: "Search cards and sets" }),
    query,
  );
}

async function openCard(user: User, query: string, card: RegExp) {
  await search(user, query);
  await user.click(await screen.findByRole("button", { name: card }));
}

async function searchFromFirstSlot(user: User, query: string) {
  await user.click(slot("Page 1, slot 1, empty"));
  await search(user, query);
}

async function holdFromAddCards(user: User, setCode: RegExp) {
  await user.click(screen.getByRole("button", { name: "Add cards" }));
  await openCard(user, "dark", /Dark Magician/);
  await user.click(screen.getByRole("button", { name: setCode }));
}

describe("the binder spread", () => {
  it("opens on page 1 with its nine slots empty", () => {
    renderApp();

    const page = screen.getByRole("region", { name: "Page 1" });

    expect(
      within(page).getAllByRole("button", { name: /^Page 1, slot \d, empty$/ }),
    ).toHaveLength(9);
  });

  it("starts with the catalogue panel closed", () => {
    renderApp();

    expect(screen.queryByRole("complementary", { name: "Catalogue" })).toBe(
      null,
    );
  });
});

describe("adding a card to a target slot", () => {
  it("opens the catalogue panel aimed at the empty slot that was tapped", async () => {
    const user = renderApp();

    await user.click(slot("Page 1, slot 3, empty"));

    expect(panelTitle()).toBe("Adding to page 1, slot 3");
  });

  it("puts the chosen printing's card in the target slot", async () => {
    const user = renderApp();
    await user.click(slot("Page 1, slot 1, empty"));
    await openCard(user, "dark", /Dark Magician/);

    await user.click(screen.getByRole("button", { name: /LOB-EN005/ }));

    expect(slot("Page 1, slot 1: Dark Magician")).toBeTruthy();
  });

  it("shows the card's image from the catalogue in the slot", async () => {
    const user = renderApp();
    await user.click(slot("Page 1, slot 1, empty"));
    await openCard(user, "dark", /Dark Magician/);

    await user.click(screen.getByRole("button", { name: /LOB-EN005/ }));

    const filled = slot("Page 1, slot 1: Dark Magician");
    expect(within(filled).getByRole("img").getAttribute("src")).toBe(
      "/images/46986414.jpg",
    );
  });

  it("keeps the panel open, no longer aimed, after a placement", async () => {
    const user = renderApp();
    await user.click(slot("Page 1, slot 1, empty"));
    await openCard(user, "dark", /Dark Magician/);

    await user.click(screen.getByRole("button", { name: /LOB-EN005/ }));

    expect(panelTitle()).toBe("Add cards");
  });

  it("announces the placement", async () => {
    const user = renderApp();
    await user.click(slot("Page 1, slot 4, empty"));
    await openCard(user, "dark", /Dark Magician/);

    await user.click(screen.getByRole("button", { name: /SDY-006/ }));

    expect(status()?.trim()).toBe("Placed SDY-006 in page 1, slot 4.");
  });

  it("clears the target with Escape and leaves the slot empty", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "dark");

    await user.keyboard("{Escape}");

    expect([panelTitle(), isAimed("Page 1, slot 1, empty")]).toEqual([
      "Add cards",
      false,
    ]);
  });
});

describe("picking up a printing and placing it", () => {
  it("opens the catalogue panel with no target from Add cards", async () => {
    const user = renderApp();

    await user.click(screen.getByRole("button", { name: "Add cards" }));

    expect(panelTitle()).toBe("Add cards");
  });

  it("holds the chosen printing when no slot is targeted", async () => {
    const user = renderApp();

    await holdFromAddCards(user, /LOB-EN005/);

    expect([
      panelTitle(),
      screen
        .getByRole("button", { name: /LOB-EN005/ })
        .getAttribute("aria-pressed"),
    ]).toEqual(["Holding LOB-EN005", "true"]);
  });

  it("places the held printing in the empty slot tapped next", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);

    await user.click(slot("Page 1, slot 2, empty"));

    expect(slot("Page 1, slot 2: Dark Magician")).toBeTruthy();
  });

  it("puts the printing down once it is placed", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);

    await user.click(slot("Page 1, slot 2, empty"));

    expect(panelTitle()).toBe("Add cards");
  });

  it("places with the keyboard alone", async () => {
    const user = renderApp();
    await user.click(screen.getByRole("button", { name: "Add cards" }));
    await openCard(user, "dark", /Dark Magician/);
    screen.getByRole("button", { name: /LOB-EN005/ }).focus();
    await user.keyboard("{Enter}");
    slot("Page 1, slot 5, empty").focus();

    await user.keyboard("{Enter}");

    expect(slot("Page 1, slot 5: Dark Magician")).toBeTruthy();
  });

  it("puts the printing down with Escape", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);

    await user.keyboard("{Escape}");

    expect(
      screen
        .getByRole("button", { name: /LOB-EN005/ })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("puts the printing down when its row is chosen again", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);

    await user.click(screen.getByRole("button", { name: /LOB-EN005/ }));

    expect(panelTitle()).toBe("Add cards");
  });

  it("holds the other printing when another row is chosen", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);

    await user.click(screen.getByRole("button", { name: /SDY-006/ }));

    expect(panelTitle()).toBe("Holding SDY-006");
  });

  it("aims at an empty slot tapped after the printing is put down", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);
    await user.keyboard("{Escape}");

    await user.click(slot("Page 1, slot 2, empty"));

    expect([panelTitle(), isAimed("Page 1, slot 2, empty")]).toEqual([
      "Adding to page 1, slot 2",
      true,
    ]);
  });

  it("refuses a filled slot and keeps holding", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);
    await user.click(slot("Page 1, slot 1, empty"));
    await user.click(screen.getByRole("button", { name: /SDY-006/ }));

    await user.click(slot("Page 1, slot 1: Dark Magician"));

    expect([
      panelTitle(),
      screen.queryByRole("dialog"),
      status()?.trim(),
    ]).toEqual(["Holding SDY-006", null, "Page 1, slot 1 is filled."]);
  });

  it("drops what it held when the panel closes", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);

    await user.click(
      within(panel()).getByRole("button", { name: "Close catalogue" }),
    );
    await user.click(screen.getByRole("button", { name: "Add cards" }));

    expect(panelTitle()).toBe("Add cards");
  });

  it("places the printing that was held, not another of the card", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /SDY-006/);
    await user.click(slot("Page 1, slot 2, empty"));

    await user.click(slot("Page 1, slot 2: Dark Magician"));

    expect(
      within(screen.getByRole("dialog")).getByRole("list", { name: "Printing" })
        .textContent,
    ).toBe("SDY-006CommonStarter Deck: Yugi");
  });

  it("outlines every empty slot, and no filled one, while holding", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);
    await user.click(slot("Page 1, slot 1, empty"));
    await user.click(screen.getByRole("button", { name: /SDY-006/ }));

    expect([
      isAimed("Page 1, slot 1: Dark Magician"),
      isAimed("Page 1, slot 2, empty"),
      isAimed("Page 1, slot 9, empty"),
    ]).toEqual([false, true, true]);
  });

  it("outlines only the target slot while nothing is held", async () => {
    const user = renderApp();

    await user.click(slot("Page 1, slot 3, empty"));

    expect([
      isAimed("Page 1, slot 3, empty"),
      isAimed("Page 1, slot 4, empty"),
    ]).toEqual([true, false]);
  });

  it("says a filled slot is filled again when it is chosen twice", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);
    await user.click(slot("Page 1, slot 1, empty"));
    await user.click(screen.getByRole("button", { name: /SDY-006/ }));
    await user.click(slot("Page 1, slot 1: Dark Magician"));
    const first = status();

    await user.click(slot("Page 1, slot 1: Dark Magician"));

    expect([first?.trim(), status()?.trim(), status() === first]).toEqual([
      "Page 1, slot 1 is filled.",
      "Page 1, slot 1 is filled.",
      false,
    ]);
  });

  it("clears what it said with Escape", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);
    await user.click(slot("Page 1, slot 1, empty"));

    await user.keyboard("{Escape}");

    expect(status()?.trim()).toBe("");
  });

  it("drops the target when Add cards is chosen", async () => {
    const user = renderApp();
    await user.click(slot("Page 1, slot 3, empty"));

    await user.click(screen.getByRole("button", { name: "Add cards" }));

    expect(panelTitle()).toBe("Add cards");
  });

  it("says nothing left over when the panel is opened again", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);
    await user.click(slot("Page 1, slot 2, empty"));

    await user.click(
      within(panel()).getByRole("button", { name: "Close catalogue" }),
    );
    await user.click(screen.getByRole("button", { name: "Add cards" }));

    expect(status()).toBe("");
  });

  it("returns focus to Add cards when the panel closes", async () => {
    const user = renderApp();
    await user.click(screen.getByRole("button", { name: "Add cards" }));

    await user.click(
      within(panel()).getByRole("button", { name: "Close catalogue" }),
    );

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Add cards" }),
    );
  });

  it("turns the binder with the arrow keys while a printing row has focus", async () => {
    const user = renderApp();
    await holdFromAddCards(user, /LOB-EN005/);

    await user.keyboard("{ArrowRight}");

    expect(
      screen.getByRole("navigation", { name: "Turn the binder" }).textContent,
    ).toBe("Pages 2–3");
  });
});

describe("searching the catalogue panel", () => {
  it("lists every printing of the chosen card with its set and rarity", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "dark");

    await user.click(
      await screen.findByRole("button", { name: /Dark Magician/ }),
    );

    expect(
      within(screen.getByRole("list", { name: "Printings" }))
        .getAllByRole("button")
        .map((printing) => printing.textContent),
    ).toEqual([
      "LOB-EN005Ultra RareLegend of Blue Eyes White Dragon",
      "SDY-006CommonStarter Deck: Yugi",
    ]);
  });

  it("shows the card's image on each of its printings", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "dark");

    await user.click(
      await screen.findByRole("button", { name: /Dark Magician/ }),
    );

    expect(
      within(screen.getByRole("list", { name: "Printings" }))
        .getAllByRole("button")
        .map((row) => row.querySelector("img")?.getAttribute("src")),
    ).toEqual(["/images/46986414.jpg", "/images/46986414.jpg"]);
  });

  it("does not ask the catalogue until the query has two characters", async () => {
    const { catalogue, queries } = fakeCatalogue();
    const user = renderApp(catalogue);

    await searchFromFirstSlot(user, "d");

    expect(queries).toEqual([]);
  });

  it("clears the search and brings focus back to the search field", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "dark");
    await screen.findByRole("button", { name: /Dark Magician/ });

    await user.click(screen.getByRole("button", { name: "Clear search" }));

    const field = screen.getByRole<HTMLInputElement>("searchbox");
    expect([field.value, document.activeElement === field]).toEqual(["", true]);
  });

  it("says so when neither cards nor sets match", async () => {
    const user = renderApp();

    await searchFromFirstSlot(user, "zzz");

    expect(await screen.findByText("Nothing matches “zzz”.")).toBeTruthy();
  });

  it("says so when the catalogue cannot be reached", async () => {
    const user = renderApp(failingCatalogue);

    await searchFromFirstSlot(user, "dark");

    expect(
      await screen.findByText("The card catalogue did not answer."),
    ).toBeTruthy();
  });

  it("goes back from the printings to the search results", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "dark");
    await user.click(
      await screen.findByRole("button", { name: /Dark Magician/ }),
    );

    await user.click(screen.getByRole("button", { name: "Back to results" }));

    const result = screen.getByRole("button", { name: /Dark Magician/ });
    expect([
      document.activeElement === result,
      screen.getByRole<HTMLInputElement>("searchbox").value,
    ]).toEqual([true, "dark"]);
  });

  it("puts an exact set code first among a card's printings", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "sdy-006");

    await user.click(
      await screen.findByRole("button", { name: /Dark Magician/ }),
    );

    expect(
      within(screen.getByRole("list", { name: "Printings" })).getAllByRole(
        "button",
      )[0].textContent,
    ).toContain("SDY-006");
  });

  it("can retry the same query after the catalogue fails", async () => {
    const catalogue = {
      ...failingCatalogue,
      search: vi
        .fn()
        .mockRejectedValueOnce(new Error("the server is down"))
        .mockResolvedValueOnce([darkMagician]),
    };
    const user = renderApp(catalogue);
    await searchFromFirstSlot(user, "dark");

    await user.click(await screen.findByRole("button", { name: "Try again" }));

    expect(
      await screen.findByRole("button", { name: /Dark Magician/ }),
    ).toBeTruthy();
  });
});
