import { useEffect, useState } from "react";
import { Dialog } from "./Dialog";
import {
  MIN_QUERY_LENGTH,
  type Card,
  type Catalogue,
  type Printing,
} from "./catalogue";

type Props = {
  catalogue: Catalogue;
  title: string;
  onPick: (card: Card, printing: Printing) => void;
  onClose: () => void;
};

type Search =
  | { state: "idle" }
  | { state: "searching" }
  | { state: "found"; cards: Card[] }
  | { state: "failed" };

/** The catalogue's answer, kept with the query it answers so a stale one is never shown. */
type Answer = { query: string } & ({ cards: Card[] } | { failed: true });

/** Finds a card in the catalogue and then one of its printings. */
export function CardPicker({ catalogue, title, onPick, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [chosen, setChosen] = useState<Card | null>(null);
  const trimmed = query.trim();

  useEffect(() => {
    if (trimmed.length < MIN_QUERY_LENGTH) return;
    const request = new AbortController();
    catalogue.search(trimmed, request.signal).then(
      (cards) => setAnswer({ query: trimmed, cards }),
      () => {
        if (!request.signal.aborted)
          setAnswer({ query: trimmed, failed: true });
      },
    );
    return () => request.abort();
  }, [catalogue, trimmed]);

  return (
    <Dialog title={title} onClose={onClose}>
      {chosen ? (
        <PrintingList
          card={chosen}
          catalogue={catalogue}
          onBack={() => setChosen(null)}
          onPick={(printing) => onPick(chosen, printing)}
        />
      ) : (
        <>
          <input
            className="picker__search"
            type="search"
            aria-label="Search cards"
            placeholder="Card name or set code, like LOB-EN001"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
          <Results
            search={searchFor(trimmed, answer)}
            query={trimmed}
            catalogue={catalogue}
            onChoose={setChosen}
          />
        </>
      )}
    </Dialog>
  );
}

function searchFor(query: string, answer: Answer | null): Search {
  if (query.length < MIN_QUERY_LENGTH) return { state: "idle" };
  if (answer?.query !== query) return { state: "searching" };
  return "failed" in answer
    ? { state: "failed" }
    : { state: "found", cards: answer.cards };
}

function Results({
  search,
  query,
  catalogue,
  onChoose,
}: {
  search: Search;
  query: string;
  catalogue: Catalogue;
  onChoose: (card: Card) => void;
}) {
  switch (search.state) {
    case "idle":
      return (
        <p className="picker__note">
          Type at least {MIN_QUERY_LENGTH} characters.
        </p>
      );
    case "searching":
      return <p className="picker__note">Searching…</p>;
    case "failed":
      return (
        <p className="picker__note" role="alert">
          The card catalogue did not answer. Try again in a moment.
        </p>
      );
    case "found":
      if (search.cards.length === 0) {
        return <p className="picker__note">No card matches “{query}”.</p>;
      }
      return (
        <ul className="picker__results">
          {search.cards.map((card) => (
            <li key={card.passcode}>
              <button
                type="button"
                className="picker__card"
                onClick={() => onChoose(card)}
              >
                <img
                  src={catalogue.imageUrl(card.passcode)}
                  alt=""
                  loading="lazy"
                />
                <span>{card.name}</span>
              </button>
            </li>
          ))}
        </ul>
      );
  }
}

function PrintingList({
  card,
  catalogue,
  onBack,
  onPick,
}: {
  card: Card;
  catalogue: Catalogue;
  onBack: () => void;
  onPick: (printing: Printing) => void;
}) {
  return (
    <div className="picker__printings">
      <img
        className="picker__chosen"
        src={catalogue.imageUrl(card.passcode)}
        alt={card.name}
      />
      <div>
        <button type="button" className="picker__back" onClick={onBack}>
          Back to results
        </button>
        <h3>{card.name}</h3>
        <p className="picker__note">Which printing is it?</p>
        <ul>
          {card.printings.map((printing) => (
            <li key={`${printing.setCode} ${printing.rarity}`}>
              <button
                type="button"
                className="picker__printing"
                onClick={() => onPick(printing)}
              >
                <span className="picker__code">{printing.setCode}</span>
                <span>{printing.rarity}</span>
                <span className="picker__set">{printing.setName}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
