import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Dialog } from "./Dialog";
import {
  MIN_QUERY_LENGTH,
  type Card,
  type Catalogue,
  type Printing,
} from "./catalogue";

type Props = {
  catalogue: Catalogue;
  destination: string;
  replacing?: string;
  onPick: (card: Card, printing: Printing) => void;
  onClose: () => void;
};

type Result = { cards: Card[] } | { failed: true };
type Answer = {
  catalogue: Catalogue;
  query: string;
  attempt: number;
  result: Result;
};
const SEARCH_DELAY_MS = 180;

export function CardPicker({
  catalogue,
  destination,
  replacing,
  onPick,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [chosen, setChosen] = useState<Card | null>(null);
  const results = useRef<HTMLDivElement>(null);
  const lastResult = useRef<{ id: string; scrollTop: number } | null>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const resultId = useId();
  const trimmed = query.trim();
  const canSearch = trimmed.length >= MIN_QUERY_LENGTH;
  const currentResult =
    answer?.catalogue === catalogue &&
    answer.query === trimmed &&
    answer.attempt === attempt
      ? answer.result
      : null;

  useEffect(() => {
    if (!canSearch) return;
    const request = new AbortController();
    const receive = (result: Result) => {
      if (!request.signal.aborted) {
        setAnswer({ catalogue, query: trimmed, attempt, result });
      }
    };
    const timeout = window.setTimeout(() => {
      catalogue.search(trimmed, request.signal).then(
        (cards) => receive({ cards }),
        () => receive({ failed: true }),
      );
    }, SEARCH_DELAY_MS);
    return () => {
      window.clearTimeout(timeout);
      request.abort();
    };
  }, [attempt, canSearch, catalogue, trimmed]);

  useLayoutEffect(() => {
    if (chosen) return;
    const previous = lastResult.current;
    if (previous && results.current) {
      results.current.scrollTop = previous.scrollTop;
      document.getElementById(previous.id)?.focus({ preventScroll: true });
    } else {
      searchInput.current?.focus();
    }
  }, [chosen]);

  const action = replacing ? "Replace card" : "Add to pocket";

  return (
    <Dialog
      className="picker"
      title={replacing ? "Replace card" : "Add card to pocket"}
      subtitle={destination}
      onClose={onClose}
    >
      {chosen ? (
        <PrintingList
          card={chosen}
          catalogue={catalogue}
          query={trimmed}
          action={action}
          onBack={() => setChosen(null)}
          onPick={(printing) => onPick(chosen, printing)}
        />
      ) : (
        <>
          <div className="picker__controls">
            <label className="picker__field">
              <SearchIcon />
              <input
                ref={searchInput}
                type="search"
                aria-label="Search cards"
                autoComplete="off"
                placeholder="Card name or set code"
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value.trim() !== trimmed) {
                    setAnswer(null);
                    if (results.current) results.current.scrollTop = 0;
                  }
                  setQuery(value);
                }}
              />
            </label>
            {replacing && (
              <p className="picker__context">Replacing {replacing}</p>
            )}
          </div>
          <div className="picker__scroll" ref={results}>
            <Results
              answer={currentResult}
              canSearch={canSearch}
              query={trimmed}
              catalogue={catalogue}
              resultId={resultId}
              onRetry={() => {
                searchInput.current?.focus();
                setAnswer(null);
                setAttempt((current) => current + 1);
              }}
              onChoose={(card, id) => {
                lastResult.current = {
                  id,
                  scrollTop: results.current?.scrollTop ?? 0,
                };
                setChosen(card);
              }}
            />
          </div>
        </>
      )}
    </Dialog>
  );
}

function SearchIcon() {
  return <span className="picker__magnifier" aria-hidden="true" />;
}

function Results({
  answer,
  canSearch,
  query,
  catalogue,
  resultId,
  onRetry,
  onChoose,
}: {
  answer: Result | null;
  canSearch: boolean;
  query: string;
  catalogue: Catalogue;
  resultId: string;
  onRetry: () => void;
  onChoose: (card: Card, id: string) => void;
}) {
  if (!canSearch) {
    return (
      <div className="picker__message" role="status">
        <SearchIcon />
        <div>
          <strong>Find a card in the catalogue</strong>
          <p>
            Enter at least {MIN_QUERY_LENGTH} characters, such as Dark Magician
            or LOB-EN005.
          </p>
        </div>
      </div>
    );
  }
  if (!answer) {
    return (
      <div className="picker__message" role="status">
        <strong>Searching the catalogue…</strong>
      </div>
    );
  }
  if ("failed" in answer) {
    return (
      <div className="picker__message">
        <strong role="alert">The card catalogue did not answer.</strong>
        <button type="button" className="picker__secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    );
  }
  if (answer.cards.length === 0) {
    return (
      <div className="picker__message" role="status">
        <strong>No card matches “{query}”.</strong>
        <p>Try another card name or check the set code.</p>
      </div>
    );
  }
  const count = answer.cards.length;
  return (
    <>
      <p className="picker__result-count" role="status">
        {count} {count === 1 ? "card found" : "cards found"}
      </p>
      <ul className="picker__results" aria-label="Matching cards">
        {answer.cards.map((card) => {
          const id = `${resultId}-${card.passcode}`;
          const printingCount = card.printings.length;
          return (
            <li key={card.passcode}>
              <button
                id={id}
                type="button"
                className="picker__card"
                onClick={() => onChoose(card, id)}
              >
                <img
                  className="picker__thumb"
                  src={catalogue.imageUrl(card.passcode)}
                  alt=""
                  loading="lazy"
                />
                <span className="picker__card-label">
                  <strong>{card.name}</strong>
                  <span>
                    {card.kind} · {printingCount}{" "}
                    {printingCount === 1 ? "printing" : "printings"}
                  </span>
                </span>
                <span className="picker__chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}

function PrintingList({
  card,
  catalogue,
  query,
  action,
  onBack,
  onPick,
}: {
  card: Card;
  catalogue: Catalogue;
  query: string;
  action: string;
  onBack: () => void;
  onPick: (printing: Printing) => void;
}) {
  const [selected, setSelected] = useState<Printing | null>(null);
  const groupName = useId();
  const needle = query.toLowerCase();
  const matches = (printing: Printing) =>
    printing.setCode.toLowerCase() === needle;
  const printings = [
    ...card.printings.filter(matches),
    ...card.printings.filter((printing) => !matches(printing)),
  ];

  return (
    <>
      <div className="picker__controls picker__controls--printings">
        <button
          type="button"
          className="picker__back"
          onClick={onBack}
          autoFocus
        >
          <span aria-hidden="true">←</span> Back to results
        </button>
        <div className="picker__card-summary">
          <img
            className="picker__thumb"
            src={catalogue.imageUrl(card.passcode)}
            alt=""
          />
          <div className="picker__card-label">
            <h3>{card.name}</h3>
            <span>{card.type}</span>
          </div>
        </div>
      </div>
      <div className="picker__scroll">
        <fieldset className="picker__printings">
          <legend>Choose a printing</legend>
          {printings.map((printing) => (
            <label
              className="picker__printing"
              key={`${printing.setCode} ${printing.rarity} ${printing.setName}`}
            >
              <input
                type="radio"
                name={groupName}
                checked={selected === printing}
                onChange={() => setSelected(printing)}
              />
              <span className="picker__printing-label">
                <strong>{printing.setCode}</strong>
                <span className="picker__rarity">{printing.rarity}</span>
                <span className="picker__set">{printing.setName}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>
      <footer className="picker__footer">
        <p className="picker__selection" aria-live="polite">
          {selected ? (
            <>
              <strong>{selected.setCode}</strong>
              <span>{selected.rarity}</span>
            </>
          ) : (
            "Select a printing to continue"
          )}
        </p>
        <button
          type="button"
          className="picker__confirm"
          disabled={!selected}
          onClick={() => selected && onPick(selected)}
        >
          {action}
        </button>
      </footer>
    </>
  );
}
