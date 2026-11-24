import type { Catalogue } from "./catalogue";
import {
  isCard,
  isCardSet,
  isList,
  isPrice,
  isRecord,
  isSetPrinting,
} from "./catalogueResponse";

const RESULT_LIMIT = 24;
const SET_LIMIT = 8;

export const httpCatalogue: Catalogue = {
  async search(query, signal) {
    const params = new URLSearchParams({
      q: query,
      limit: String(RESULT_LIMIT),
    });
    const body = await get(`/api/cards?${params}`, signal);
    if (!isRecord(body) || !isList(body.cards, isCard)) {
      throw new Error("The catalogue answered malformed cards");
    }
    return body.cards;
  },
  async searchSets(query, signal) {
    const params = new URLSearchParams({ q: query, limit: String(SET_LIMIT) });
    const body = await get(`/api/sets?${params}`, signal);
    if (!isRecord(body) || !isList(body.sets, isCardSet)) {
      throw new Error("The catalogue answered malformed sets");
    }
    return body.sets;
  },
  async setPrintings(name, signal) {
    const params = new URLSearchParams({ name });
    const body = await get(`/api/sets/printings?${params}`, signal);
    if (
      !isRecord(body) ||
      typeof body.name !== "string" ||
      !isList(body.cards, isCard) ||
      !isList(body.printings, isSetPrinting)
    ) {
      throw new Error("The catalogue answered malformed set printings");
    }
    const setName = body.name;
    const cards = new Map(body.cards.map((card) => [card.passcode, card]));
    return body.printings.map(({ setCode, rarity, passcode }) => {
      const card = cards.get(passcode);
      if (!card) throw new Error(`The catalogue omitted card ${passcode}`);
      return { card, printing: { setCode, setName, rarity } };
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
    const body = await bodyOf(response);
    if (!isPrice(body)) {
      throw new Error("The catalogue answered a malformed price");
    }
    return {
      cents: body.cents,
      guideDate: body.guideDate,
    };
  },
  imageUrl: (passcode) => `/api/cards/${passcode}/image`,
};

/** The price route's answer for a printing it has no price for. */
const NO_PRICE = 404;
/** The price route's answer while the server has no price guide. */
const NO_GUIDE = 503;

async function get(url: string, signal?: AbortSignal): Promise<unknown> {
  return bodyOf(await fetch(url, { signal }));
}

async function bodyOf(response: Response): Promise<unknown> {
  if (!response.ok) {
    throw new Error(`The catalogue answered ${response.status}`);
  }
  return response.json();
}
