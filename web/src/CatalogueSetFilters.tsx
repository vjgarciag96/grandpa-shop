import { text } from './strings';
import { useId, useRef } from 'react';
import { NOTHING_CHOSEN, toggle, type FilterOption, type Selection } from './filterGroup';
import { isFiltering, withChosen, type SetFilterSelection } from './setFilters';

/**
 * The Rarity and Print run groups over an opened set's printings, with how many of the [total] printings the chosen
 * filters leave, [shown]. Nothing when neither group has options.
 */
export function SetFilters({
  rarities,
  printRuns,
  selection,
  shown,
  total,
  onChange,
}: {
  rarities: readonly FilterOption[];
  printRuns: readonly FilterOption[];
  selection: SetFilterSelection;
  shown: number;
  total: number;
  onChange: (next: SetFilterSelection) => void;
}) {
  if (rarities.length === 0 && printRuns.length === 0) return null;

  return (
    <div className="catalogue__filters" role="group" aria-label={text.catalogue.filters}>
      <FilterGroup
        label={text.catalogue.rarity}
        options={rarities}
        selected={selection.rarities}
        onChange={(chosen) => onChange(withChosen(selection, 'rarities', chosen))}
      />
      <FilterGroup
        label={text.catalogue.printRun}
        options={printRuns}
        selected={selection.printRuns}
        onChange={(chosen) => onChange(withChosen(selection, 'printRuns', chosen))}
      />
      <p className="catalogue__result-count" role="status">
        {isFiltering(selection) ? text.catalogue.filteredCount(shown, total) : ''}
      </p>
    </div>
  );
}

/** Toggles named [label] that narrow a list of printings to one or more values, with Clear while any is chosen. */
function FilterGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: readonly FilterOption[];
  selected: Selection;
  onChange: (next: Selection) => void;
}) {
  const labelId = useId();
  const firstToggle = useRef<HTMLButtonElement>(null);
  if (options.length === 0) return null;

  return (
    <div className="catalogue__filter-group" role="group" aria-labelledby={labelId}>
      <div className="catalogue__filter-head">
        <span id={labelId} className="catalogue__group">
          {label}
        </span>
        {selected.size > 0 && (
          <button
            type="button"
            className="control control--text"
            onClick={() => {
              onChange(NOTHING_CHOSEN);
              // Clear goes away once nothing is chosen, which would otherwise drop focus to the page.
              firstToggle.current?.focus();
            }}
          >
            {text.catalogue.clearFilter}
          </button>
        )}
      </div>
      <div className="catalogue__filter-options">
        {options.map(({ value, count }, index) => {
          const pressed = selected.has(value);
          return (
            <button
              key={value}
              ref={index === 0 ? firstToggle : undefined}
              type="button"
              className="control control--filter"
              aria-pressed={pressed}
              onClick={() => onChange(toggle(selected, value))}
            >
              {pressed && <span className="check-icon" aria-hidden="true" />}
              {value} <span className="control__count">{count}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
