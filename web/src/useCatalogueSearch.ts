import type { Card, CardSet, Catalogue } from './catalogue';
import { useCatalogueRequest } from './useCatalogueRequest';

type SearchResult<T> = T[] | 'pending' | 'failed';
export type CatalogueSearchResult = {
  cards: SearchResult<Card>;
  sets: SearchResult<CardSet>;
};
const pendingResult: CatalogueSearchResult = {
  cards: 'pending',
  sets: 'pending',
};
const SEARCH_DELAY_MS = 180;

function search(
  catalogue: Catalogue,
  query: string,
  signal: AbortSignal,
  publish: (update: (previous: CatalogueSearchResult) => CatalogueSearchResult) => void,
) {
  void catalogue.search(query, signal).then(
    (cards) => publish((result) => ({ ...result, cards })),
    () => publish((result) => ({ ...result, cards: 'failed' })),
  );
  void catalogue.searchSets(query, signal).then(
    (sets) => publish((result) => ({ ...result, sets })),
    () => publish((result) => ({ ...result, sets: 'failed' })),
  );
}

export function useCatalogueSearch(catalogue: Catalogue, query: string | null) {
  return useCatalogueRequest(catalogue, query, search, pendingResult, SEARCH_DELAY_MS);
}
