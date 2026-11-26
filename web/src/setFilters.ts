import type { SetPrinting } from './catalogue';
import {
  countOptions,
  NOTHING_CHOSEN,
  offered,
  passes,
  type FilterOption,
  type Selection,
} from './filterGroup';
import { printRunOf } from './printRun';
import { byRarityLadder } from './rarity';

/** The rarities and print runs chosen for an opened set's printings. */
export type SetFilterSelection = { readonly rarities: Selection; readonly printRuns: Selection };

/** One of an opened set's filter groups. */
export type SetFilterGroup = keyof SetFilterSelection;

export const NO_FILTERS: SetFilterSelection = {
  rarities: NOTHING_CHOSEN,
  printRuns: NOTHING_CHOSEN,
};

/** [selection] with [group]'s choice replaced by [chosen], the other group's kept. */
export function withChosen(
  selection: SetFilterSelection,
  group: SetFilterGroup,
  chosen: Selection,
): SetFilterSelection {
  return { ...selection, [group]: chosen };
}

const rarityOf = (entry: SetPrinting) => entry.printing.rarity;
const runOf = (entry: SetPrinting) => printRunOf(entry.printing.setCode);

/**
 * The printings whose rarity and print run are both chosen, in their original order, with each group's options.
 * Rarities come ladder first (Common, Rare, Super Rare, Ultra Rare, Secret Rare) then the rest alphabetically,
 * print runs in the order their first printings are listed. Each group counts what the other group leaves.
 */
export function filterSetPrintings(
  printings: readonly SetPrinting[],
  selection: SetFilterSelection,
): { listed: readonly SetPrinting[]; rarities: FilterOption[]; printRuns: FilterOption[] } {
  const forRarityCounts = printings.filter((entry) => passes(selection.printRuns, runOf(entry)));
  const forPrintRunCounts = printings.filter((entry) =>
    passes(selection.rarities, rarityOf(entry)),
  );
  const listed = forRarityCounts.filter((entry) => passes(selection.rarities, rarityOf(entry)));
  const rarityCounts = countOptions(printings.map(rarityOf), forRarityCounts.map(rarityOf));
  const printRunCounts = countOptions(printings.map(runOf), forPrintRunCounts.map(runOf));
  return {
    listed,
    rarities: offered(rarityCounts.sort((a, b) => byRarityLadder(a.value, b.value))),
    printRuns: offered(printRunCounts),
  };
}

/** Whether [selection] narrows the list at all. */
export function isFiltering(selection: SetFilterSelection): boolean {
  return selection.rarities.size > 0 || selection.printRuns.size > 0;
}

/** Whether [a] and [b] list the same printings in the same order, however the lists were narrowed to get there. */
export function isSameListing(
  a: readonly SetPrinting[] | null,
  b: readonly SetPrinting[],
): boolean {
  return a !== null && a.length === b.length && a.every((entry, index) => entry === b[index]);
}
