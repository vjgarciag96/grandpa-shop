import type {
  Card,
  CardSet,
  Catalogue,
  Price,
  SetPrinting,
} from "../catalogue";

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

/** Spell Ruler Relinquished, the printing whose price is known from Víctor's own Cardmarket page. */
export const relinquished: Card = {
  passcode: 64631466,
  name: "Relinquished",
  kind: "Monster",
  type: "Ritual Monster",
  text: 'You can Ritual Summon this card with "Black Illusion Ritual".',
  monster: {
    attribute: "DARK",
    race: "Spellcaster",
    level: 1,
    atk: 0,
    def: 0,
  },
  printings: [
    { setCode: "SRL-029", setName: "Spell Ruler", rarity: "Ultra Rare" },
  ],
};

/** The price of Relinquished SRL-029 Ultra Rare in the 2026-11-23 guide. */
export const relinquishedPrice: Price = {
  cents: 4006,
  currency: "EUR",
  guideDate: "2026-11-23",
};

/**
 * A catalogue that answers from a fixed list and records every query it is asked.
 * `prices` is keyed `setCode|rarity`; a printing not in it has no price.
 */
export function fakeCatalogue(
  cards: Card[] = [darkMagician, potOfGreed],
  prices: Record<string, Price> = {},
) {
  const queries: string[] = [];
  const sets = setsOf(cards);
  const catalogue: Catalogue = {
    async price({ setCode, rarity }) {
      return prices[`${setCode}|${rarity}`] ?? null;
    },
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
      return [...found.printings];
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
  price: () => Promise.reject(new Error("the server is down")),
  imageUrl: (passcode) => `/images/${passcode}.jpg`,
};
