import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import App from "./App";
import { fakeCatalogue } from "./test/fakeCatalogue";

async function appWithFirstSlotFilled(
  query: string,
  cardName: RegExp,
  setCode: RegExp,
) {
  render(<App catalogue={fakeCatalogue().catalogue} />);
  const user = userEvent.setup();
  await user.click(
    screen.getByRole("button", { name: "Page 1, slot 1, empty" }),
  );
  await user.type(
    screen.getByRole("searchbox", { name: "Search cards" }),
    query,
  );
  await user.click(await screen.findByRole("button", { name: cardName }));
  await user.click(screen.getByRole("radio", { name: setCode }));
  await user.click(screen.getByRole("button", { name: "Add to pocket" }));
  return user;
}

const fillWithDarkMagician = () =>
  appWithFirstSlotFilled("dark", /Dark Magician/, /LOB-EN005/);

describe("a copy's detail", () => {
  it("opens from a filled slot and shows the printing", async () => {
    const user = await fillWithDarkMagician();

    await user.click(
      screen.getByRole("button", { name: "Page 1, slot 1: Dark Magician" }),
    );

    const detail = screen.getByRole("dialog", { name: "Page 1, slot 1" });
    expect(
      within(detail).getByRole("list", { name: "Printing" }).textContent,
    ).toBe("LOB-EN005Ultra RareLegend of Blue Eyes White Dragon");
  });

  it("shows a monster's stats", async () => {
    const user = await fillWithDarkMagician();

    await user.click(
      screen.getByRole("button", { name: "Page 1, slot 1: Dark Magician" }),
    );

    expect(
      screen.getByText("DARK · Spellcaster · Level 7 · ATK 2500 / DEF 2100"),
    ).toBeTruthy();
  });

  it("shows no monster stats for a spell", async () => {
    const user = await appWithFirstSlotFilled(
      "pot",
      /Pot of Greed/,
      /LOB-EN119/,
    );

    await user.click(
      screen.getByRole("button", { name: "Page 1, slot 1: Pot of Greed" }),
    );

    const detail = screen.getByRole("dialog", { name: "Page 1, slot 1" });
    expect([
      within(detail).queryByText("Spell Card") !== null,
      within(detail).queryByText(/ATK/),
    ]).toEqual([true, null]);
  });

  it("starts a new copy at Near Mint", async () => {
    const user = await fillWithDarkMagician();

    await user.click(
      screen.getByRole("button", { name: "Page 1, slot 1: Dark Magician" }),
    );

    const condition = screen.getByRole("combobox", {
      name: "Condition",
    }) as HTMLSelectElement;
    expect(condition.value).toBe("Near Mint");
  });

  it("keeps a changed condition after it is closed and opened again", async () => {
    const user = await fillWithDarkMagician();
    await user.click(
      screen.getByRole("button", { name: "Page 1, slot 1: Dark Magician" }),
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Condition" }),
      "Lightly Played",
    );
    await user.click(screen.getByRole("button", { name: "Close" }));

    await user.click(
      screen.getByRole("button", { name: "Page 1, slot 1: Dark Magician" }),
    );

    const condition = screen.getByRole("combobox", {
      name: "Condition",
    }) as HTMLSelectElement;
    expect(condition.value).toBe("Lightly Played");
  });

  it("removes the copy and leaves the slot empty", async () => {
    const user = await fillWithDarkMagician();
    await user.click(
      screen.getByRole("button", { name: "Page 1, slot 1: Dark Magician" }),
    );

    await user.click(screen.getByRole("button", { name: "Remove from slot" }));

    expect(
      screen.getByRole("button", { name: "Page 1, slot 1, empty" }),
    ).toBeTruthy();
  });

  it("replaces the copy with another card picked from the catalogue", async () => {
    const user = await fillWithDarkMagician();
    await user.click(
      screen.getByRole("button", { name: "Page 1, slot 1: Dark Magician" }),
    );
    await user.click(screen.getByRole("button", { name: "Replace" }));
    await user.type(
      screen.getByRole("searchbox", { name: "Search cards" }),
      "pot",
    );
    await user.click(
      await screen.findByRole("button", { name: /Pot of Greed/ }),
    );

    await user.click(screen.getByRole("radio", { name: /LOB-EN119/ }));
    await user.click(screen.getByRole("button", { name: "Replace card" }));

    expect(
      screen.getByRole("button", { name: "Page 1, slot 1: Pot of Greed" }),
    ).toBeTruthy();
  });
});
