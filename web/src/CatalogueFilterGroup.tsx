import { text } from './strings';
import { useId, useRef } from 'react';
import { toggle, type FilterOption, type Selection } from './setFilters';

const NOTHING_CHOSEN: Selection = new Set();

/** Toggles named [label] that narrow a list of printings to one or more values, with Clear while any is chosen. */
export function FilterGroup({
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

/** How many of the [total] printings the chosen filters leave, announced as it changes; empty while not [filtering]. */
export function FilterCount({
  shown,
  total,
  filtering,
}: {
  shown: number;
  total: number;
  filtering: boolean;
}) {
  return (
    <p className="catalogue__result-count" role="status">
      {filtering ? text.catalogue.filteredCount(shown, total) : ''}
    </p>
  );
}
