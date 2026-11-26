import { text } from './strings';
import { useMemo, useRef, useState, type PointerEvent, type RefObject } from 'react';
import { isHeld, type Aim } from './aim';
import type { Card, CardSet, Catalogue, Printing, SetPrinting } from './catalogue';
import { RetryMessage } from './CatalogueStatus';
import { FilterCount, FilterGroup } from './CatalogueFilterGroup';
import { filterSetPrintings, isFiltering, NO_FILTERS, type SetFilterSelection } from './setFilters';
import { useCatalogueRequest } from './useCatalogueRequest';

type ChooseProps = {
  aim: Aim | null;
  backButton: RefObject<HTMLButtonElement | null>;
  onBack: () => void;
  onPrintingPress?: (card: Card, printing: Printing, event: PointerEvent) => void;
  onChoose: (card: Card, printing: Printing) => void;
};

export function PrintingList({
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
  const matches = (printing: Printing) => printing.setCode.toLowerCase() === needle;
  const printings = [
    ...card.printings.filter(matches),
    ...card.printings.filter((printing) => !matches(printing)),
  ];

  return (
    <>
      <div className="catalogue__controls catalogue__controls--printings">
        <BackToResults backButton={backButton} onBack={onBack} />
        <div className="catalogue__card-summary">
          <img className="catalogue__thumb" src={catalogue.imageUrl(card.passcode)} alt="" />
          <div className="catalogue__card-label">
            <h3>{card.name}</h3>
            <span>{card.type}</span>
          </div>
        </div>
      </div>
      <div className="catalogue__scroll">
        <ul className="catalogue__printings" aria-label={text.catalogue.printings}>
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

type SetResult = SetPrinting[] | 'failed' | null;

function loadSetPrintings(
  catalogue: Catalogue,
  set: CardSet,
  signal: AbortSignal,
  publish: (update: (previous: SetResult) => SetResult) => void,
) {
  void catalogue.setPrintings(set.name, signal).then(
    (printings) => publish(() => printings),
    () => publish(() => 'failed'),
  );
}

export function SetPrintingList({
  set,
  catalogue,
  aim,
  backButton,
  onBack,
  onPrintingPress,
  onChoose,
  onPlaceAll,
}: {
  set: CardSet;
  catalogue: Catalogue;
  /** Files every listed printing, in the listed order, and tells whether it placed them. */
  onPlaceAll: (entries: readonly SetPrinting[]) => boolean;
} & ChooseProps) {
  const { result, retry } = useCatalogueRequest<CardSet, SetResult>(
    catalogue,
    set,
    loadSetPrintings,
    null,
  );
  const [selection, setSelection] = useState<SetFilterSelection>(NO_FILTERS);
  const printings = Array.isArray(result) ? result : null;
  const {
    listed: visible,
    rarities,
    printRuns,
  } = useMemo(() => filterSetPrintings(printings ?? [], selection), [printings, selection]);
  // The list last placed, so a second press files nothing until another set or filter selection lists new printings.
  // The ref refuses a press that arrives before the re-render; the state shows the button as unavailable.
  const placedList = useRef<readonly SetPrinting[] | null>(null);
  const [placed, setPlaced] = useState<readonly SetPrinting[] | null>(null);
  const placeAll = () => {
    if (placedList.current === visible || !onPlaceAll(visible)) return;
    placedList.current = visible;
    setPlaced(visible);
  };

  return (
    <>
      <div className="catalogue__controls catalogue__controls--printings">
        <BackToResults backButton={backButton} onBack={onBack} />
        <div className="catalogue__card-summary catalogue__card-summary--set">
          <div className="catalogue__card-label">
            <h3>{set.name}</h3>
            <span>
              {set.prefix} · {text.catalogue.printingCount(set.printings)}
            </span>
          </div>
        </div>
      </div>
      <div className="catalogue__scroll">
        {result === null && (
          <div className="catalogue__message" role="status">
            <strong>{text.catalogue.openingSet}</strong>
          </div>
        )}
        {result === 'failed' && (
          <RetryMessage
            message={text.catalogue.setFailed}
            onRetry={() => {
              backButton.current?.focus();
              retry();
            }}
          />
        )}
        {printings && (
          <>
            {(rarities.length > 0 || printRuns.length > 0) && (
              <div className="catalogue__filters">
                <FilterGroup
                  label={text.catalogue.rarity}
                  options={rarities}
                  selected={selection.rarities}
                  onChange={(next) => setSelection({ ...selection, rarities: next })}
                />
                <FilterGroup
                  label={text.catalogue.printRun}
                  options={printRuns}
                  selected={selection.printRuns}
                  onChange={(next) => setSelection({ ...selection, printRuns: next })}
                />
                <FilterCount
                  shown={visible.length}
                  total={printings.length}
                  filtering={isFiltering(selection)}
                />
              </div>
            )}
            <div className="catalogue__place-all">
              <button
                type="button"
                className="control control--tonal"
                aria-disabled={placed === visible}
                onClick={placeAll}
              >
                {text.catalogue.placeAll(visible.length)}
              </button>
            </div>
            <ul className="catalogue__printings" aria-label={text.catalogue.printings}>
              {visible.map((entry) => (
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
          </>
        )}
      </div>
    </>
  );
}

function BackToResults({ backButton, onBack }: Pick<ChooseProps, 'backButton' | 'onBack'>) {
  return (
    <button
      ref={backButton}
      type="button"
      className="control control--text catalogue__back"
      onClick={onBack}
      autoFocus
    >
      <span aria-hidden="true">←</span> {text.catalogue.backToResults}
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
} & Pick<ChooseProps, 'aim' | 'onPrintingPress' | 'onChoose'>) {
  return (
    <li>
      <button
        type="button"
        className="catalogue__printing"
        aria-pressed={isHeld(aim, card, printing)}
        data-draggable={onPrintingPress ? '' : undefined}
        onPointerDown={(event) => onPrintingPress?.(card, printing, event)}
        onClick={() => onChoose(card, printing)}
      >
        <img
          className="catalogue__thumb"
          src={catalogue.imageUrl(card.passcode)}
          alt=""
          loading="lazy"
          draggable={false}
        />
        <span className="catalogue__printing-label">
          <strong>{printing.setCode}</strong>
          <span className="catalogue__rarity">{printing.rarity}</span>
          <span className="catalogue__printing-detail">{detail}</span>
        </span>
      </button>
    </li>
  );
}
