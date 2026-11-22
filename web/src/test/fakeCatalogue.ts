import type { Card, CardSet, Catalogue, SetPrinting } from "../catalogue";

export const darkMagician: Card = {
  passcode: 46986414,
  name: "Dark Magician",
  kind: "Monster",
  type: "Normal Monster",
  text: "''The ultimate wizard in terms of attack and defense.''",
  monster: {
    attribute: "DARK",
    race: "Spellcaster",
    level: 7,
    atk: 2500,
    def: 2100,
  },
  printings: [
    {
      setCode: "LOB-EN005",
      setName: "Legend of Blue Eyes White Dragon",
      rarity: "Ultra Rare",
    },
    {
      setCode: "SDY-006",
      setName: "Starter Deck: Yugi",
      rarity: "Common",
    },
  ],
};

export const potOfGreed: Card = {
  passcode: 55144522,
  name: "Pot of Greed",
  kind: "Spell",
  type: "Spell Card",
  text: "Draw 2 cards.",
  printings: [
    {
      setCode: "LOB-EN119",
      setName: "Legend of Blue Eyes White Dragon",
      rarity: "Rare",
    },
  ],
};

/** A catalogue that answers from a fixed list and records every query it is asked. */
export function fakeCatalogue(cards: Card[] = [darkMagician, potOfGreed]) {
  const queries: string[] = [];
  const sets = setsOf(cards);
  const catalogue: Catalogue = {
    async searchSets(query) {
      const needle = query.toLowerCase();
      return [...sets.values()]
        .map(({ set }) => set)
        .filter(
          (set) =>
            set.name.toLowerCase().includes(needle) ||
            set.prefix.toLowerCase().startsWith(needle),
        );
    },
    async setPrintings(name) {
      const found = sets.get(name);
      if (!found) throw new Error(`No set named ${name}`);
      return found.printings;
    },
    async search(query) {
      queries.push(query);
      const needle = query.toLowerCase();
      return cards.filter(
        (card) =>
          card.name.toLowerCase().includes(needle) ||
          card.printings.some((printing) =>
            printing.setCode.toLowerCase().includes(needle),
          ),
      );
    },
    imageUrl: (passcode) => `/images/${passcode}.jpg`,
  };
  return { catalogue, queries };
}

/** Groups the cards' printings by set, in set-code order, as the server does. */
function setsOf(cards: Card[]) {
  const sets = new Map<string, { set: CardSet; printings: SetPrinting[] }>();
  const printings = cards
    .flatMap((card) => card.printings.map((printing) => ({ card, printing })))
    .sort((a, b) => a.printing.setCode.localeCompare(b.printing.setCode));
  for (const entry of printings) {
    const name = entry.printing.setName;
    const inSet = [...(sets.get(name)?.printings ?? []), entry];
    sets.set(name, {
      set: {
        name,
        prefix: entry.printing.setCode.split("-")[0],
        printings: inSet.length,
      },
      printings: inSet,
    });
  }
  return sets;
}

export const failingCatalogue: Catalogue = {
  search: () => Promise.reject(new Error("the server is down")),
  searchSets: () => Promise.reject(new Error("the server is down")),
  setPrintings: () => Promise.reject(new Error("the server is down")),
  imageUrl: (passcode) => `/images/${passcode}.jpg`,
};
