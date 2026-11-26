import { catalogueHeading, text } from './strings';
import { useId, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import type { Aim } from './aim';
import type { Copy } from './binder';
import {
  MIN_QUERY_LENGTH,
  type Card,
  type Catalogue,
  type Printing,
  type SetPrinting,
} from './catalogue';
import type { Announcement } from './announcement';
import { LiveRegion } from './LiveRegion';
import { CatalogueResults, type Opened } from './CatalogueResults';
import { PrintingList, SetPrintingList } from './CataloguePrintings';
import { SearchIcon } from './CatalogueStatus';
import { useCatalogueSearch } from './useCatalogueSearch';

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
  onPrintingPress?: (card: Card, printing: Printing, event: PointerEvent) => void;
  onChoose: (card: Card, printing: Printing) => void;
  /** Files every printing an opened set lists, in the listed order, and tells whether it placed them. */
  onPlaceAll: (entries: readonly SetPrinting[]) => boolean;
  onClose: () => void;
};

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
  onPlaceAll,
  onClose,
}: Props) {
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<Opened | null>(null);
  const results = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const lastResult = useRef<{ id: string; scrollTop: number } | null>(null);
  const resultId = useId();
  const trimmed = query.trim();
  const canSearch = trimmed.length >= MIN_QUERY_LENGTH;
  const { result: currentResult, retry } = useCatalogueSearch(
    catalogue,
    canSearch ? trimmed : null,
  );

  useLayoutEffect(() => {
    if (opened) return;
    const previous = lastResult.current;
    if (previous && results.current) {
      results.current.scrollTop = previous.scrollTop;
      // Set results may have arrived above this row while its printings were open.
      document.getElementById(previous.id)?.focus();
    }
  }, [opened]);

  useLayoutEffect(() => {
    (searchInput.current ?? backButton.current)?.focus();
  }, [focusRequest]);

  function updateQuery(value: string) {
    if (value.trim() !== trimmed) {
      if (results.current) results.current.scrollTop = 0;
    }
    setQuery(value);
  }

  const { title, hint } = catalogueHeading(aim, replacing);

  return (
    <aside
      className={beside ? 'catalogue catalogue--beside' : 'catalogue catalogue--sheet'}
      aria-label={text.catalogue.name}
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
          aria-label={text.catalogue.close}
          onClick={onClose}
        >
          <span className="close-icon" aria-hidden="true" />
        </button>
      </header>
      <LiveRegion className="catalogue__announcement" announcement={announcement} />
      {opened?.kind === 'card' && (
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
      {opened?.kind === 'set' && (
        <SetPrintingList
          key={opened.set.name}
          set={opened.set}
          catalogue={catalogue}
          aim={aim}
          backButton={backButton}
          onBack={() => setOpened(null)}
          onPrintingPress={onPrintingPress}
          onChoose={onChoose}
          onPlaceAll={onPlaceAll}
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
                aria-label={text.catalogue.search}
                autoComplete="off"
                placeholder={text.catalogue.placeholder}
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
              />
              {query && (
                <button
                  type="button"
                  className="control control--icon"
                  aria-label={text.catalogue.clear}
                  onClick={() => {
                    updateQuery('');
                    searchInput.current?.focus();
                  }}
                >
                  <span className="close-icon" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
          <div className="catalogue__scroll" ref={results}>
            <CatalogueResults
              answer={currentResult}
              canSearch={canSearch}
              query={trimmed}
              catalogue={catalogue}
              resultId={resultId}
              onRetry={() => {
                searchInput.current?.focus();
                retry();
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
