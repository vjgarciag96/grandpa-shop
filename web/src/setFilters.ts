import type { SetPrinting } from './catalogue';
import { printRunOf } from './printRun';

/** A value one filter group offers, spelled as the catalogue serves it, and how many printings have it. */
export type FilterOption = { readonly value: string; readonly count: number };

/** The values chosen in one filter group. Empty means that group does not filter. */
export type Selection = ReadonlySet<string>;

/** The rarities and print runs chosen for an opened set's printings. */
export type SetFilterSelection = { readonly rarities: Selection; readonly printRuns: Selection };

export const NO_FILTERS: SetFilterSelection = { rarities: new Set(), printRuns: new Set() };

const LADDER = ['Common', 'Rare', 'Super Rare', 'Ultra Rare', 'Secret Rare'];

function ladderRank(rarity: string): number {
  const rank = LADDER.indexOf(rarity);
  return rank === -1 ? LADDER.length : rank;
}

const rarityOf = (entry: SetPrinting) => entry.printing.rarity;
const printRunOfEntry = (entry: SetPrinting) => printRunOf(entry.printing.setCode);

/** Whether [value] passes a group with [selected] chosen. */
const passes = (selected: Selection, value: string) => selected.size === 0 || selected.has(value);

/**
 * One option per distinct value in [printings], in first-appearance order, counting only the printings in [left];
 * a value with none left stays with 0. [] when [printings] has fewer than two values.
 */
function optionsOf(
  printings: readonly SetPrinting[],
  left: readonly SetPrinting[],
  valueOf: (entry: SetPrinting) => string,
): FilterOption[] {
  const counts = new Map<string, number>();
  for (const entry of printings) counts.set(valueOf(entry), 0);
  if (counts.size < 2) return [];
  for (const entry of left) {
    const value = valueOf(entry);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts].map(([value, count]) => ({ value, count }));
}

/**
 * The printings whose rarity and print run are both chosen, in their original order, with each group's options.
 * Rarities come ladder first (Common, Rare, Super Rare, Ultra Rare, Secret Rare) then the rest alphabetically,
 * print runs in set-code order of their first printing. Each group counts what the other group leaves.
 */
export function filterSetPrintings(
  printings: readonly SetPrinting[],
  selection: SetFilterSelection,
): { listed: readonly SetPrinting[]; rarities: FilterOption[]; printRuns: FilterOption[] } {
  const inRuns = printings.filter((entry) => passes(selection.printRuns, printRunOfEntry(entry)));
  const ofRarities = printings.filter((entry) => passes(selection.rarities, rarityOf(entry)));
  const listed = inRuns.filter((entry) => passes(selection.rarities, rarityOf(entry)));
  const rarities = optionsOf(printings, inRuns, rarityOf).sort(
    (a, b) => ladderRank(a.value) - ladderRank(b.value) || a.value.localeCompare(b.value, 'en'),
  );
  return { listed, rarities, printRuns: optionsOf(printings, ofRarities, printRunOfEntry) };
}

/** Whether [selection] narrows the list at all. */
export function isFiltering(selection: SetFilterSelection): boolean {
  return selection.rarities.size > 0 || selection.printRuns.size > 0;
}

/** The group's selection with [value] added, or removed if it was there. */
export function toggle(selected: Selection, value: string): Selection {
  const next = new Set(selected);
  if (!next.delete(value)) next.add(value);
  return next;
}
