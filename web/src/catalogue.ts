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

export interface Catalogue {
  search(query: string, signal?: AbortSignal): Promise<Card[]>;
  imageUrl(passcode: number): string;
}

export const MIN_QUERY_LENGTH = 2;
const RESULT_LIMIT = 24;

export const httpCatalogue: Catalogue = {
  async search(query, signal) {
    const params = new URLSearchParams({
      q: query,
      limit: String(RESULT_LIMIT),
    });
    const response = await fetch(`/api/cards?${params}`, { signal });
    if (!response.ok) {
      throw new Error(`The catalogue answered ${response.status}`);
    }
    const body: { cards: Card[] } = await response.json();
    return body.cards;
  },
  imageUrl: (passcode) => `/api/cards/${passcode}/image`,
};
