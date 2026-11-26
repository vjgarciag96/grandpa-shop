const LADDER = ['Common', 'Rare', 'Super Rare', 'Ultra Rare', 'Secret Rare'];

function ladderRank(rarity: string): number {
  const rank = LADDER.indexOf(rarity);
  return rank === -1 ? LADDER.length : rank;
}

/** Orders rarities ladder first (Common, Rare, Super Rare, Ultra Rare, Secret Rare), then the rest alphabetically. */
export function byRarityLadder(a: string, b: string): number {
  return ladderRank(a) - ladderRank(b) || a.localeCompare(b, 'en');
}
