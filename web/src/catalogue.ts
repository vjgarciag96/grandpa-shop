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

/** What a printing is worth on Cardmarket on the day of the guide. See GET /api/printings/price. */
export type Price = {
  readonly cents: number;
  readonly currency: "EUR";
  /** The guide's date as Cardmarket writes it, such as 2026-11-23. */
  readonly guideDate: string;
};

export interface Catalogue {
  search(query: string, signal?: AbortSignal): Promise<Card[]>;
  searchSets(query: string, signal?: AbortSignal): Promise<CardSet[]>;
  /** Every printing of the set with exactly this name, in set-code order. */
  setPrintings(name: string, signal?: AbortSignal): Promise<SetPrinting[]>;
  /** The printing's price, or null when the server has none for it today or has no guide at all. */
  price(
    printing: Pick<Printing, "setCode" | "rarity">,
    signal?: AbortSignal,
  ): Promise<Price | null>;
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
  async price({ setCode, rarity }, signal) {
    const params = new URLSearchParams({ setCode, rarity });
    const response = await fetch(`/api/printings/price?${params}`, {
      signal,
    });
    if (response.status === NO_PRICE || response.status === NO_GUIDE) {
      return null;
    }
    const body: Price & { product: number } = await bodyOf(response);
    return {
      cents: body.cents,
      currency: body.currency,
      guideDate: body.guideDate,
    };
  },
  imageUrl: (passcode) => `/api/cards/${passcode}/image`,
};

/** The price route's answer for a printing it has no price for. */
const NO_PRICE = 404;
/** The price route's answer while the server has no price guide. */
const NO_GUIDE = 503;

async function get<T>(url: string, signal?: AbortSignal): Promise<T> {
  return bodyOf(await fetch(url, { signal }));
}

async function bodyOf<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`The catalogue answered ${response.status}`);
  }
  return response.json();
}
