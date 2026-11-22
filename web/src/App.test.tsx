import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import {
  darkMagician,
  failingCatalogue,
  fakeCatalogue,
} from "./test/fakeCatalogue";

function renderApp(catalogue = fakeCatalogue().catalogue) {
  render(<App catalogue={catalogue} />);
  return userEvent.setup();
}

async function searchFromFirstSlot(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
) {
  await user.click(
    screen.getByRole("button", { name: "Page 1, slot 1, empty" }),
  );
  await user.type(
    screen.getByRole("searchbox", { name: "Search cards" }),
    query,
  );
}

describe("the binder spread", () => {
  it("opens on page 1 with its nine slots empty", () => {
    renderApp();

    const page = screen.getByRole("region", { name: "Page 1" });

    expect(
      within(page).getAllByRole("button", { name: /^Page 1, slot \d, empty$/ }),
    ).toHaveLength(9);
  });
});

describe("filling a slot", () => {
  it("puts the picked printing's card in the slot", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "dark");
    await user.click(
      await screen.findByRole("button", { name: /Dark Magician/ }),
    );

    await user.click(screen.getByRole("radio", { name: /LOB-EN005/ }));
    await user.click(screen.getByRole("button", { name: "Add to pocket" }));

    expect(
      screen.getByRole("button", { name: "Page 1, slot 1: Dark Magician" }),
    ).toBeTruthy();
  });

  it("shows the card's image from the catalogue in the slot", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "dark");
    await user.click(
      await screen.findByRole("button", { name: /Dark Magician/ }),
    );

    await user.click(screen.getByRole("radio", { name: /LOB-EN005/ }));
    await user.click(screen.getByRole("button", { name: "Add to pocket" }));

    const slot = screen.getByRole("button", {
      name: "Page 1, slot 1: Dark Magician",
    });
    expect(within(slot).getByRole("img").getAttribute("src")).toBe(
      "/images/46986414.jpg",
    );
  });

  it("lists every printing of the chosen card with its set and rarity", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "dark");

    await user.click(
      await screen.findByRole("button", { name: /Dark Magician/ }),
    );

    expect(
      screen
        .getAllByRole("radio", { name: /^(LOB-EN005|SDY-006)/ })
        .map((radio) => (radio as HTMLInputElement).labels?.[0].textContent),
    ).toEqual([
      "LOB-EN005Ultra RareLegend of Blue Eyes White Dragon",
      "SDY-006CommonStarter Deck: Yugi",
    ]);
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

    const search = screen.getByRole<HTMLInputElement>("searchbox");
    expect(search.value).toBe("");
    expect(document.activeElement).toBe(search);
    expect(screen.queryByRole("list", { name: "Matching cards" })).toBeNull();
  });

  it("says so when no card matches", async () => {
    const user = renderApp();

    await searchFromFirstSlot(user, "zzz");

    expect(await screen.findByText("No card matches “zzz”.")).toBeTruthy();
  });

  it("says so when the catalogue cannot be reached", async () => {
    const user = renderApp(failingCatalogue);

    await searchFromFirstSlot(user, "dark");

    expect(
      await screen.findByText("The card catalogue did not answer."),
    ).toBeTruthy();
  });

  it("leaves the slot empty when the search is closed without a pick", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "dark");

    await user.keyboard("{Escape}");

    expect(
      screen.getByRole("button", { name: "Page 1, slot 1, empty" }),
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
    expect(document.activeElement).toBe(result);
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe(
      "dark",
    );
  });

  it("puts an exact set code first and still asks for confirmation", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "sdy-006");

    await user.click(
      await screen.findByRole("button", { name: /Dark Magician/ }),
    );

    const printings = screen.getAllByRole("radio") as HTMLInputElement[];
    expect(printings[0].labels?.[0].textContent).toContain("SDY-006");
    expect(
      (
        screen.getByRole("button", {
          name: "Add to pocket",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("returns focus to the same empty pocket when a selected printing is cancelled", async () => {
    const user = renderApp();
    await searchFromFirstSlot(user, "dark");
    await user.click(
      await screen.findByRole("button", { name: /Dark Magician/ }),
    );
    await user.click(screen.getByRole("radio", { name: /LOB-EN005/ }));

    await user.keyboard("{Escape}");

    expect(document.activeElement).toBe(
      screen.getByRole("button", { name: "Page 1, slot 1, empty" }),
    );
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
