import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { Aim } from "./aim";
import { isHeld } from "./aim";
import { slotName, slotNameInSentence, type Copy } from "./binder";
import {
  MIN_QUERY_LENGTH,
  type Card,
  type Catalogue,
  type Printing,
} from "./catalogue";

type Props = {
  catalogue: Catalogue;
  aim: Aim | null;
  /** The copy in the target slot, when the target is filled and its copy is being replaced. */
  replacing: Copy | null;
  announcement: Announcement;
  beside: boolean;
  inert: boolean;
  /** Each new value moves focus into the panel: to the search, or back to results when a card is open. */
  focusRequest: number;
  onChoose: (card: Card, printing: Printing) => void;
  onClose: () => void;
};

/** What the panel says aloud. Each new message counts up, so a repeated one is read again. */
export type Announcement = { readonly text: string; readonly count: number };

type Result = { cards: Card[] } | { failed: true };
type Answer = {
  catalogue: Catalogue;
  query: string;
  attempt: number;
  result: Result;
};
const SEARCH_DELAY_MS = 180;

/** The catalogue beside the binder: search it, open a card, and choose one of its printings. */
export function CataloguePanel({
  catalogue,
  aim,
  replacing,
  announcement,
  beside,
  inert,
  focusRequest,
  onChoose,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [opened, setOpened] = useState<Card | null>(null);
  const results = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const lastResult = useRef<{ id: string; scrollTop: number } | null>(null);
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
    if (opened) return;
    const previous = lastResult.current;
    if (previous && results.current) {
      results.current.scrollTop = previous.scrollTop;
      document.getElementById(previous.id)?.focus({ preventScroll: true });
    }
  }, [opened]);

  useLayoutEffect(() => {
    (searchInput.current ?? backButton.current)?.focus();
  }, [focusRequest]);

  function updateQuery(value: string) {
    if (value.trim() !== trimmed) {
      setAnswer(null);
      if (results.current) results.current.scrollTop = 0;
    }
    setQuery(value);
  }

  const { title, hint } = heading(aim, replacing);

  return (
    <aside
      className={
        beside ? "catalogue catalogue--beside" : "catalogue catalogue--sheet"
      }
      aria-label="Catalogue"
      inert={inert}
    >
      <header className="catalogue__head">
        <div>
          <h2>{title}</h2>
          {hint && <p className="catalogue__hint">{hint}</p>}
        </div>
        <button
          type="button"
          className="control control--icon"
          aria-label="Close catalogue"
          onClick={onClose}
        >
          <span className="close-icon" aria-hidden="true" />
        </button>
      </header>
      <p className="catalogue__announcement" role="status">
        {announcement.text}
        {/* A repeated message must still change the text for a screen reader to say it again. */}
        {announcement.text && announcement.count % 2 === 1 && "\u00a0"}
      </p>
      {opened ? (
        <PrintingList
          card={opened}
          catalogue={catalogue}
          query={trimmed}
          aim={aim}
          backButton={backButton}
          onBack={() => setOpened(null)}
          onChoose={(printing) => onChoose(opened, printing)}
        />
      ) : (
        <>
          <div className="catalogue__controls">
            <div className="catalogue__field">
              <SearchIcon />
              <input
                ref={searchInput}
                type="search"
                aria-label="Search cards"
                autoComplete="off"
                placeholder="Card name or set code"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="control control--icon"
                  aria-label="Clear search"
                  onClick={() => {
                    updateQuery("");
                    searchInput.current?.focus();
                  }}
                >
                  <span className="close-icon" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <div className="catalogue__scroll" ref={results}>
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
              onOpen={(card, id) => {
                lastResult.current = {
                  id,
                  scrollTop: results.current?.scrollTop ?? 0,
                };
                setOpened(card);
              }}
            />
          </div>
        </>
      )}
    </aside>
  );
}

function heading(
  aim: Aim | null,
  replacing: Copy | null,
): { title: string; hint?: string } {
  if (aim?.kind === "holding") {
    return {
      title: `Holding ${aim.printing.setCode}`,
      hint: "Choose an empty slot",
    };
  }
  if (aim?.kind === "target") {
    return replacing
      ? {
          title: `Replacing ${replacing.card.name}`,
          hint: slotName(aim.address),
        }
      : { title: `Adding to ${slotNameInSentence(aim.address)}` };
  }
  return {
    title: "Add cards",
    hint: "Pick up a printing, then choose an empty slot",
  };
}

function SearchIcon() {
  return <span className="catalogue__magnifier" aria-hidden="true" />;
}

function Results({
  answer,
  canSearch,
  query,
  catalogue,
  resultId,
  onRetry,
  onOpen,
}: {
  answer: Result | null;
  canSearch: boolean;
  query: string;
  catalogue: Catalogue;
  resultId: string;
  onRetry: () => void;
  onOpen: (card: Card, id: string) => void;
}) {
  if (!canSearch) {
    return (
      <div className="catalogue__message">
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
      <div className="catalogue__message" role="status">
        <strong>Searching the catalogue…</strong>
      </div>
    );
  }
  if ("failed" in answer) {
    return (
      <div className="catalogue__message">
        <strong role="alert">The card catalogue did not answer.</strong>
        <button
          type="button"
          className="control control--tonal"
          onClick={onRetry}
        >
          Try again
        </button>
      </div>
    );
  }
  if (answer.cards.length === 0) {
    return (
      <div className="catalogue__message" role="status">
        <strong>No card matches “{query}”.</strong>
        <p>Try another card name or check the set code.</p>
      </div>
    );
  }
  const count = answer.cards.length;
  return (
    <>
      <p className="catalogue__result-count" role="status">
        {count} {count === 1 ? "card found" : "cards found"}
      </p>
      <ul className="catalogue__results" aria-label="Matching cards">
        {answer.cards.map((card) => {
          const id = `${resultId}-${card.passcode}`;
          const printingCount = card.printings.length;
          return (
            <li key={card.passcode}>
              <button
                id={id}
                type="button"
                className="catalogue__card"
                onClick={() => onOpen(card, id)}
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
                    {card.kind} · {printingCount}{" "}
                    {printingCount === 1 ? "printing" : "printings"}
                  </span>
                </span>
                <span className="chevron" aria-hidden="true" />
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
  aim,
  backButton,
  onBack,
  onChoose,
}: {
  card: Card;
  catalogue: Catalogue;
  query: string;
  aim: Aim | null;
  backButton: RefObject<HTMLButtonElement | null>;
  onBack: () => void;
  onChoose: (printing: Printing) => void;
}) {
  const needle = query.toLowerCase();
  const matches = (printing: Printing) =>
    printing.setCode.toLowerCase() === needle;
  const printings = [
    ...card.printings.filter(matches),
    ...card.printings.filter((printing) => !matches(printing)),
  ];

  return (
    <>
      <div className="catalogue__controls catalogue__controls--printings">
        <button
          ref={backButton}
          type="button"
          className="control control--text catalogue__back"
          onClick={onBack}
          autoFocus
        >
          <span aria-hidden="true">←</span> Back to results
        </button>
        <div className="catalogue__card-summary">
          <img
            className="catalogue__thumb"
            src={catalogue.imageUrl(card.passcode)}
            alt=""
          />
          <div className="catalogue__card-label">
            <h3>{card.name}</h3>
            <span>{card.type}</span>
          </div>
        </div>
      </div>
      <div className="catalogue__scroll">
        <ul className="catalogue__printings" aria-label="Printings">
          {printings.map((printing) => (
            <li
              key={`${printing.setCode} ${printing.rarity} ${printing.setName}`}
            >
              <button
                type="button"
                className="catalogue__printing"
                aria-pressed={isHeld(aim, card, printing)}
                onClick={() => onChoose(printing)}
              >
                <img
                  className="catalogue__thumb"
                  src={catalogue.imageUrl(card.passcode)}
                  alt=""
                  loading="lazy"
                />
                <span className="catalogue__printing-label">
                  <strong>{printing.setCode}</strong>
                  <span className="catalogue__rarity">{printing.rarity}</span>
                  <span className="catalogue__set">{printing.setName}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
