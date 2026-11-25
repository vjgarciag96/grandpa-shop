import { text } from './strings';
import { MIN_QUERY_LENGTH, type Card, type CardSet, type Catalogue } from './catalogue';
import { RetryMessage, SearchIcon } from './CatalogueStatus';

/** What the panel shows in place of the search: one card's printings, or one set's. */
export type Opened =
  { readonly kind: 'card'; readonly card: Card } | { readonly kind: 'set'; readonly set: CardSet };
import type { CatalogueSearchResult } from './useCatalogueSearch';

export function CatalogueResults({
  answer,
  canSearch,
  query,
  catalogue,
  resultId,
  onRetry,
  onOpen,
}: {
  answer: CatalogueSearchResult;
  canSearch: boolean;
  query: string;
  catalogue: Catalogue;
  resultId: string;
  onRetry: () => void;
  onOpen: (opened: Opened, id: string) => void;
}) {
  if (!canSearch) {
    return (
      <div className="catalogue__message">
        <SearchIcon />
        <div>
          <strong>{text.catalogue.start}</strong>
          <p>{text.catalogue.searchHint(MIN_QUERY_LENGTH)}</p>
        </div>
      </div>
    );
  }
  const cards = Array.isArray(answer.cards) ? answer.cards : null;
  const sets = Array.isArray(answer.sets) ? answer.sets : null;
  if (cards?.length === 0 && sets?.length === 0) {
    return (
      <div className="catalogue__message" role="status">
        <strong>{text.catalogue.noMatches(query)}</strong>
        <p>{text.catalogue.tryAnother}</p>
      </div>
    );
  }
  const cardsFailed = answer.cards === 'failed';
  const setsFailed = answer.sets === 'failed';
  const cardsPending = answer.cards === 'pending';
  const setsPending = answer.sets === 'pending';
  const counts = [
    ...(sets ? [text.catalogue.setCount(sets.length)] : []),
    ...(cards ? [text.catalogue.cardCount(cards.length)] : []),
  ];
  return (
    <>
      {(cardsFailed || setsFailed) && (
        <RetryMessage
          message={
            cardsFailed && setsFailed
              ? text.catalogue.catalogueFailed
              : cardsFailed
                ? text.catalogue.cardSearchFailed
                : text.catalogue.setSearchFailed
          }
          onRetry={onRetry}
        />
      )}
      {(cardsPending || setsPending) && (
        <p className="catalogue__result-count" role="status">
          {cardsPending && setsPending
            ? text.catalogue.cataloguePending
            : cardsPending
              ? text.catalogue.cardsPending
              : text.catalogue.setsPending}
        </p>
      )}
      {counts.length > 0 && (
        <p className="catalogue__result-count" role="status">
          {text.catalogue.found(counts)}
        </p>
      )}
      {sets && sets.length > 0 && (
        <>
          <h3 className="catalogue__group">{text.catalogue.sets}</h3>
          <ul className="catalogue__results" aria-label={text.catalogue.matchingSets}>
            {sets.map((set, index) => {
              const id = `${resultId}-set-${index}`;
              return (
                <li key={set.name}>
                  <button
                    id={id}
                    type="button"
                    className="catalogue__card catalogue__card--set"
                    onClick={() => onOpen({ kind: 'set', set }, id)}
                  >
                    <span className="catalogue__card-label">
                      <strong>{set.name}</strong>
                      <span>
                        {set.prefix} · {text.catalogue.printingCount(set.printings)}
                      </span>
                    </span>
                    <span className="chevron" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
      {cards && cards.length > 0 && (
        <>
          <h3 className="catalogue__group">{text.catalogue.cards}</h3>
          <ul className="catalogue__results" aria-label={text.catalogue.matchingCards}>
            {cards.map((card) => {
              const id = `${resultId}-${card.passcode}`;
              return (
                <li key={card.passcode}>
                  <button
                    id={id}
                    type="button"
                    className="catalogue__card"
                    onClick={() => onOpen({ kind: 'card', card }, id)}
                  >
                    <img
                      className="catalogue__thumb"
                      src={catalogue.imageUrl(card.passcode)}
                      alt=""
                      loading="lazy"
                    />
                    <span className="catalogue__card-label">
                      <strong>{card.name}</strong>
                      <span>
                        {card.kind} · {text.catalogue.printingCount(card.printings.length)}
                      </span>
                    </span>
                    <span className="chevron" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
