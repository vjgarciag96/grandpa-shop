import {
  MIN_QUERY_LENGTH,
  type Card,
  type CardSet,
  type Catalogue,
} from "./catalogue";
import { countOf } from "./catalogueStrings";
import { RetryMessage, SearchIcon } from "./CatalogueStatus";

/** What the panel shows in place of the search: one card's printings, or one set's. */
export type Opened =
  | { readonly kind: "card"; readonly card: Card }
  | { readonly kind: "set"; readonly set: CardSet };
import type { CatalogueSearchResult } from "./useCatalogueSearch";

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
          <strong>Find a card or a set in the catalogue</strong>
          <p>
            Enter at least {MIN_QUERY_LENGTH} characters, such as Dark Magician,
            The Lost Millennium, or LOB-EN005.
          </p>
        </div>
      </div>
    );
  }
  const cards = Array.isArray(answer.cards) ? answer.cards : null;
  const sets = Array.isArray(answer.sets) ? answer.sets : null;
  if (cards?.length === 0 && sets?.length === 0) {
    return (
      <div className="catalogue__message" role="status">
        <strong>Nothing matches “{query}”.</strong>
        <p>Try another card or set name, or check the set code.</p>
      </div>
    );
  }
  const cardsFailed = answer.cards === "failed";
  const setsFailed = answer.sets === "failed";
  const cardsPending = answer.cards === "pending";
  const setsPending = answer.sets === "pending";
  const counts = [
    sets && countOf(sets.length, "set"),
    cards && countOf(cards.length, "card"),
  ].filter(Boolean);
  return (
    <>
      {(cardsFailed || setsFailed) && (
        <RetryMessage
          message={
            cardsFailed && setsFailed
              ? "The card catalogue did not answer."
              : cardsFailed
                ? "Card search did not answer."
                : "Set search did not answer."
          }
          onRetry={onRetry}
        />
      )}
      {(cardsPending || setsPending) && (
        <p className="catalogue__result-count" role="status">
          {cardsPending && setsPending
            ? "Searching the catalogue…"
            : cardsPending
              ? "Searching for cards…"
              : "Searching for sets…"}
        </p>
      )}
      {counts.length > 0 && (
        <p className="catalogue__result-count" role="status">
          {counts.join(" and ")} found
        </p>
      )}
      {sets && sets.length > 0 && (
        <>
          <h3 className="catalogue__group">Sets</h3>
          <ul className="catalogue__results" aria-label="Matching sets">
            {sets.map((set, index) => {
              const id = `${resultId}-set-${index}`;
              return (
                <li key={set.name}>
                  <button
                    id={id}
                    type="button"
                    className="catalogue__card catalogue__card--set"
                    onClick={() => onOpen({ kind: "set", set }, id)}
                  >
                    <span className="catalogue__card-label">
                      <strong>{set.name}</strong>
                      <span>
                        {set.prefix} · {countOf(set.printings, "printing")}
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
          <h3 className="catalogue__group">Cards</h3>
          <ul className="catalogue__results" aria-label="Matching cards">
            {cards.map((card) => {
              const id = `${resultId}-${card.passcode}`;
              return (
                <li key={card.passcode}>
                  <button
                    id={id}
                    type="button"
                    className="catalogue__card"
                    onClick={() => onOpen({ kind: "card", card }, id)}
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
                        {card.kind} ·{" "}
                        {countOf(card.printings.length, "printing")}
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
