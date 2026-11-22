/** A card as the server's catalogue describes it. See GET /api/cards. */
export type Card = {
  readonly passcode: number;
  readonly name: string;
  readonly kind: "Monster" | "Spell" | "Trap";
  readonly type: string;
  readonly text: string;
  readonly monster?: MonsterStats;
  readonly printings: readonly Printing[];
};

export type MonsterStats = {
  readonly attribute: string;
  readonly race: string;
  readonly level?: number;
  readonly rank?: number;
  readonly linkRating?: number;
  readonly atk?: number;
  readonly def?: number;
};

export type Printing = {
  readonly setCode: string;
  readonly setName: string;
  readonly rarity: string;
};

/** A product printings come from. See GET /api/sets. */
export type CardSet = {
  readonly name: string;
  /** The most common start of its set codes, such as TLM. */
  readonly prefix: string;
  readonly printings: number;
};

/** One printing in a set, with the card it is a printing of. */
export type SetPrinting = { readonly card: Card; readonly printing: Printing };

export interface Catalogue {
  search(query: string, signal?: AbortSignal): Promise<Card[]>;
  searchSets(query: string, signal?: AbortSignal): Promise<CardSet[]>;
  /** Every printing of the set with exactly this name, in set-code order. */
  setPrintings(name: string, signal?: AbortSignal): Promise<SetPrinting[]>;
  imageUrl(passcode: number): string;
}

export const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 24;
const SET_LIMIT = 8;

export const httpCatalogue: Catalogue = {
  async search(query, signal) {
    const params = new URLSearchParams({
      q: query,
      limit: String(RESULT_LIMIT),
    });
    const body: { cards: Card[] } = await get(`/api/cards?${params}`, signal);
    return body.cards;
  },
  async searchSets(query, signal) {
    const params = new URLSearchParams({ q: query, limit: String(SET_LIMIT) });
    const body: { sets: CardSet[] } = await get(`/api/sets?${params}`, signal);
    return body.sets;
  },
  async setPrintings(name, signal) {
    const params = new URLSearchParams({ name });
    const body: {
      name: string;
      cards: Card[];
      printings: { setCode: string; rarity: string; passcode: number }[];
    } = await get(`/api/sets/printings?${params}`, signal);
    const cards = new Map(body.cards.map((card) => [card.passcode, card]));
    return body.printings.map(({ setCode, rarity, passcode }) => {
      const card = cards.get(passcode);
      if (!card) throw new Error(`The catalogue omitted card ${passcode}`);
      return { card, printing: { setCode, setName: body.name, rarity } };
    });
  },
  imageUrl: (passcode) => `/api/cards/${passcode}/image`,
};

async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`The catalogue answered ${response.status}`);
  }
  return response.json();
}
