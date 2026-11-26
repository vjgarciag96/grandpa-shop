/** A rarity present in one list of printings, spelled as the catalogue serves it, and how many printings have it. */
export type RarityOption = { readonly rarity: string; readonly count: number };

/** The rarities chosen for one list of printings. Empty means no filter. */
export type RaritySelection = ReadonlySet<string>;

export const NO_RARITIES: RaritySelection = new Set();

const LADDER = ['Common', 'Rare', 'Super Rare', 'Ultra Rare', 'Secret Rare'];

function ladderRank(rarity: string): number {
  const rank = LADDER.indexOf(rarity);
  return rank === -1 ? LADDER.length : rank;
}

/**
 * One option per distinct rarity, counted, ladder first (Common, Rare, Super Rare, Ultra Rare, Secret Rare)
 * then the rest alphabetically; [] when fewer than two rarities.
 */
export function rarityOptions<T>(
  entries: readonly T[],
  rarityOf: (entry: T) => string,
): RarityOption[] {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const rarity = rarityOf(entry);
    counts.set(rarity, (counts.get(rarity) ?? 0) + 1);
  }
  if (counts.size < 2) return [];
  return [...counts]
    .map(([rarity, count]) => ({ rarity, count }))
    .sort(
      (a, b) =>
        ladderRank(a.rarity) - ladderRank(b.rarity) || a.rarity.localeCompare(b.rarity, 'en'),
    );
}

/** The entries whose rarity is selected, in their original order; every entry when nothing is selected. */
export function keepRarities<T>(
  entries: readonly T[],
  selected: RaritySelection,
  rarityOf: (entry: T) => string,
): readonly T[] {
  if (selected.size === 0) return entries;
  return entries.filter((entry) => selected.has(rarityOf(entry)));
}

/** The selection with [rarity] added, or removed if it was there. */
export function toggleRarity(selected: RaritySelection, rarity: string): RaritySelection {
  const next = new Set(selected);
  if (!next.delete(rarity)) next.add(rarity);
  return next;
}
