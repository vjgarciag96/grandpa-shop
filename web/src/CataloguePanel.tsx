import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type RefObject,
} from "react";
import type { Aim } from "./aim";
import { isHeld } from "./aim";
import { slotName, slotNameInSentence, type Copy } from "./binder";
import {
  MIN_QUERY_LENGTH,
  type Card,
  type CardSet,
  type Catalogue,
  type Printing,
  type SetPrinting,
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
  /** Tracks a printing press when dragging is available. */
  onPrintingPress?: (
    card: Card,
    printing: Printing,
    event: PointerEvent,
  ) => void;
  onChoose: (card: Card, printing: Printing) => void;
  onClose: () => void;
};

/** What the panel says aloud. Each new message counts up, so a repeated one is read again. */
export type Announcement = { readonly text: string; readonly count: number };

type Result = { cards: Card[] | null; sets: CardSet[] | null };
/** What the panel shows in place of the search: one card's printings, or one set's. */
type Opened =
  | { readonly kind: "card"; readonly card: Card }
  | { readonly kind: "set"; readonly set: CardSet };
type Answer = {
  catalogue: Catalogue;
  query: string;
  attempt: number;
  result: Result;
};
const SEARCH_DELAY_MS = 180;

/** The catalogue beside the binder: search it, open a card or a set, and choose one of its printings. */
export function CataloguePanel({
  catalogue,
  aim,
  replacing,
  announcement,
  beside,
  inert,
  focusRequest,
  onPrintingPress,
  onChoose,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [opened, setOpened] = useState<Opened | null>(null);
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
      Promise.allSettled([
        catalogue.search(trimmed, request.signal),
        catalogue.searchSets(trimmed, request.signal),
      ]).then(([cards, sets]) =>
        receive({
          cards: cards.status === "fulfilled" ? cards.value : null,
          sets: sets.status === "fulfilled" ? sets.value : null,
        }),
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
      {opened?.kind === "card" && (
        <PrintingList
          card={opened.card}
          catalogue={catalogue}
          query={trimmed}
          aim={aim}
          backButton={backButton}
          onBack={() => setOpened(null)}
          onPrintingPress={onPrintingPress}
          onChoose={onChoose}
        />
      )}
      {opened?.kind === "set" && (
        <SetPrintingList
          set={opened.set}
          catalogue={catalogue}
          aim={aim}
          backButton={backButton}
          onBack={() => setOpened(null)}
          onPrintingPress={onPrintingPress}
          onChoose={onChoose}
        />
      )}
      {!opened && (
        <>
          <div className="catalogue__controls">
            <div className="catalogue__field">
              <SearchIcon />
              <input
                ref={searchInput}
                type="search"
                aria-label="Search cards and sets"
                autoComplete="off"
                placeholder="Card, set, or set code"
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
              onOpen={(next, id) => {
                lastResult.current = {
                  id,
                  scrollTop: results.current?.scrollTop ?? 0,
                };
                setOpened(next);
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
  if (!answer) {
    return (
      <div className="catalogue__message" role="status">
        <strong>Searching the catalogue…</strong>
      </div>
    );
  }
  const { cards, sets } = answer;
  if (cards?.length === 0 && sets?.length === 0) {
    return (
      <div className="catalogue__message" role="status">
        <strong>Nothing matches “{query}”.</strong>
        <p>Try another card or set name, or check the set code.</p>
      </div>
    );
  }
  const searchError = cards
    ? "Set search did not answer."
    : sets
      ? "Card search did not answer."
      : "The card catalogue did not answer.";
  const counts = [
    sets && countOf(sets.length, "set"),
    cards && countOf(cards.length, "card"),
  ].filter(Boolean);
  return (
    <>
      {(!cards || !sets) && (
        <RetryMessage message={searchError} onRetry={onRetry} />
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

function countOf(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

type ChooseProps = {
  aim: Aim | null;
  backButton: RefObject<HTMLButtonElement | null>;
  onBack: () => void;
  onPrintingPress?: (
    card: Card,
    printing: Printing,
    event: PointerEvent,
  ) => void;
  onChoose: (card: Card, printing: Printing) => void;
};

function PrintingList({
  card,
  catalogue,
  query,
  aim,
  backButton,
  onBack,
  onPrintingPress,
  onChoose,
}: { card: Card; catalogue: Catalogue; query: string } & ChooseProps) {
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
        <BackToResults backButton={backButton} onBack={onBack} />
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
            <PrintingRow
              key={`${printing.setCode} ${printing.rarity} ${printing.setName}`}
              entry={{ card, printing }}
              detail={printing.setName}
              catalogue={catalogue}
              aim={aim}
              onPrintingPress={onPrintingPress}
              onChoose={onChoose}
            />
          ))}
        </ul>
      </div>
    </>
  );
}

type SetAnswer = {
  catalogue: Catalogue;
  set: CardSet;
  result: SetPrinting[] | "failed";
};

function SetPrintingList({
  set,
  catalogue,
  aim,
  backButton,
  onBack,
  onPrintingPress,
  onChoose,
}: { set: CardSet; catalogue: Catalogue } & ChooseProps) {
  const [answer, setAnswer] = useState<SetAnswer | null>(null);
  const [attempt, setAttempt] = useState(0);
  const result =
    answer?.catalogue === catalogue && answer.set === set
      ? answer.result
      : null;

  useEffect(() => {
    const request = new AbortController();
    catalogue.setPrintings(set.name, request.signal).then(
      (printings) => {
        if (!request.signal.aborted)
          setAnswer({ catalogue, set, result: printings });
      },
      () => {
        if (!request.signal.aborted)
          setAnswer({ catalogue, set, result: "failed" });
      },
    );
    return () => request.abort();
  }, [attempt, catalogue, set]);

  return (
    <>
      <div className="catalogue__controls catalogue__controls--printings">
        <BackToResults backButton={backButton} onBack={onBack} />
        <div className="catalogue__card-summary catalogue__card-summary--set">
          <div className="catalogue__card-label">
            <h3>{set.name}</h3>
            <span>
              {set.prefix} · {countOf(set.printings, "printing")}
            </span>
          </div>
        </div>
      </div>
      <div className="catalogue__scroll">
        {result === null && (
          <div className="catalogue__message" role="status">
            <strong>Opening the set…</strong>
          </div>
        )}
        {result === "failed" && (
          <RetryMessage
            message="The set did not load."
            onRetry={() => {
              backButton.current?.focus();
              setAnswer(null);
              setAttempt((current) => current + 1);
            }}
          />
        )}
        {Array.isArray(result) && (
          <ul className="catalogue__printings" aria-label="Printings">
            {result.map((entry) => (
              <PrintingRow
                key={`${entry.card.passcode} ${entry.printing.setCode} ${entry.printing.rarity}`}
                entry={entry}
                detail={entry.card.name}
                catalogue={catalogue}
                aim={aim}
                onPrintingPress={onPrintingPress}
                onChoose={onChoose}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function RetryMessage({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="catalogue__message">
      <strong role="alert">{message}</strong>
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

function BackToResults({
  backButton,
  onBack,
}: Pick<ChooseProps, "backButton" | "onBack">) {
  return (
    <button
      ref={backButton}
      type="button"
      className="control control--text catalogue__back"
      onClick={onBack}
      autoFocus
    >
      <span aria-hidden="true">←</span> Back to results
    </button>
  );
}

/** A printing that can be chosen or dragged: the card's image, the set code over the rarity, and [detail]. */
function PrintingRow({
  entry: { card, printing },
  detail,
  catalogue,
  aim,
  onPrintingPress,
  onChoose,
}: {
  entry: SetPrinting;
  detail: string;
  catalogue: Catalogue;
} & Pick<ChooseProps, "aim" | "onPrintingPress" | "onChoose">) {
  return (
    <li>
      <button
        type="button"
        className="catalogue__printing"
        aria-pressed={isHeld(aim, card, printing)}
        data-draggable={onPrintingPress ? "" : undefined}
        onPointerDown={(event) => onPrintingPress?.(card, printing, event)}
        onClick={() => onChoose(card, printing)}
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
          <span className="catalogue__set">{detail}</span>
        </span>
      </button>
    </li>
  );
}
