/** A value one filter group offers, spelled as the catalogue serves it, and how many printings have it. */
export type FilterOption = { readonly value: string; readonly count: number };

/** The values chosen in one filter group. Empty means that group does not filter. */
export type Selection = ReadonlySet<string>;

export const NOTHING_CHOSEN: Selection = new Set();

/** Whether [value] passes a group with [selected] chosen. */
export function passes(selected: Selection, value: string): boolean {
  return selected.size === 0 || selected.has(value);
}

/**
 * One option per distinct value in [values], in the order the values first appear, counted in [left]; a value
 * missing from [left] stays with 0.
 */
export function countOptions(values: readonly string[], left: readonly string[]): FilterOption[] {
  const counts = new Map<string, number>(values.map((value) => [value, 0]));
  for (const value of left) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].map(([value, count]) => ({ value, count }));
}

/** The options a group offers: none when there are fewer than two, as a single value narrows nothing. */
export function offered(options: FilterOption[]): FilterOption[] {
  return options.length < 2 ? [] : options;
}

/** The group's selection with [value] added, or removed if it was there. */
export function toggle(selected: Selection, value: string): Selection {
  const next = new Set(selected);
  if (!next.delete(value)) next.add(value);
  return next;
}
