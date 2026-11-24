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
