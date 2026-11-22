import { afterEach, expect, it, vi } from "vitest";
import { httpCatalogue } from "./catalogue";
import { darkMagician } from "./test/fakeCatalogue";

afterEach(() => {
  vi.unstubAllGlobals();
});

it("reads set search results from the sets endpoint", async () => {
  const sets = [{ name: "The Lost Millennium", prefix: "TLM", printings: 85 }];
  const fetch = vi.fn().mockResolvedValue(Response.json({ sets }));
  vi.stubGlobal("fetch", fetch);

  const result = await httpCatalogue.searchSets("lost millennium");

  expect(fetch).toHaveBeenCalledWith("/api/sets?q=lost+millennium&limit=8", {
    signal: undefined,
  });
  expect(result).toEqual(sets);
});

it("requests an exact set name and joins each printing to its card in response order", async () => {
  const fetch = vi.fn().mockResolvedValue(
    Response.json({
      name: "Legendary 5D's Decks",
      cards: [darkMagician],
      printings: [
        { setCode: "L5DD-001", rarity: "Common", passcode: 46986414 },
        { setCode: "L5DD-001", rarity: "Ultra Rare", passcode: 46986414 },
      ],
    }),
  );
  vi.stubGlobal("fetch", fetch);

  const result = await httpCatalogue.setPrintings("Legendary 5D's Decks");

  expect(fetch).toHaveBeenCalledWith(
    "/api/sets/printings?name=Legendary+5D%27s+Decks",
    { signal: undefined },
  );
  expect(result).toEqual([
    {
      card: darkMagician,
      printing: {
        setCode: "L5DD-001",
        setName: "Legendary 5D's Decks",
        rarity: "Common",
      },
    },
    {
      card: darkMagician,
      printing: {
        setCode: "L5DD-001",
        setName: "Legendary 5D's Decks",
        rarity: "Ultra Rare",
      },
    },
  ]);
});
