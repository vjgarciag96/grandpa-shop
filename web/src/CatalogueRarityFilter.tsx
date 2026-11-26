import { text } from './strings';
import { useId, useRef } from 'react';
import {
  isFiltering,
  NO_RARITIES,
  toggleRarity,
  type RarityOption,
  type RaritySelection,
} from './rarityFilter';

/** Toggles that narrow a list of printings to one or more rarities, with Clear and a count of what is left. */
export function RarityFilter({
  options,
  selected,
  shown,
  total,
  onChange,
}: {
  options: readonly RarityOption[];
  selected: RaritySelection;
  shown: number;
  total: number;
  onChange: (next: RaritySelection) => void;
}) {
  const labelId = useId();
  const firstToggle = useRef<HTMLButtonElement>(null);
  if (options.length === 0) return null;

  return (
    <div className="catalogue__rarity-filter" role="group" aria-labelledby={labelId}>
      <div className="catalogue__rarity-head">
        <span id={labelId} className="catalogue__group">
          {text.catalogue.rarity}
        </span>
        {isFiltering(selected) && (
          <button
            type="button"
            className="control control--text"
            onClick={() => {
              onChange(NO_RARITIES);
              // Clear goes away once nothing is chosen, which would otherwise drop focus to the page.
              firstToggle.current?.focus();
            }}
          >
            {text.catalogue.clearRarities}
          </button>
        )}
      </div>
      <div className="catalogue__rarities">
        {options.map(({ rarity, count }, index) => {
          const pressed = selected.has(rarity);
          return (
            <button
              key={rarity}
              ref={index === 0 ? firstToggle : undefined}
              type="button"
              className="control control--filter"
              aria-pressed={pressed}
              onClick={() => onChange(toggleRarity(selected, rarity))}
            >
              {pressed && <span className="check-icon" aria-hidden="true" />}
              {rarity} <span className="control__count">{count}</span>
            </button>
          );
        })}
      </div>
      <p className="catalogue__result-count" role="status">
        {isFiltering(selected) ? text.catalogue.filteredCount(shown, total) : ''}
      </p>
    </div>
  );
}
