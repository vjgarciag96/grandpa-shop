import { describe, expect, it } from 'vitest';
import type { SetPrinting } from './catalogue';
import { keepRarities, NO_RARITIES, rarityOptions, toggleRarity } from './rarityFilter';
import { darkMagician } from './test/fakeCatalogue';

const rarityOf = (entry: SetPrinting) => entry.printing.rarity;

/** A printing of The Lost Millennium with set code TLM-EN followed by [number], three digits. */
function tlm(number: number, rarity: string): SetPrinting {
  const setCode = `TLM-EN${String(number).padStart(3, '0')}`;
  return {
    card: darkMagician,
    printing: { setCode, setName: 'The Lost Millennium', rarity },
  };
}

/**
 * The Lost Millennium's mix of 85 printings in set-code order: 35 Common, 14 Rare, 7 Super Rare, 4 Ultra Rare,
 * and 25 Ultimate Rare. The supers are EN010, EN020, EN030, EN040, EN050, EN055, and EN060, the ultras EN005, EN015, EN025, and EN035,
 * and the ultimates EN061 to EN085.
 */
function lostMillennium(): SetPrinting[] {
  const supers = [10, 20, 30, 40, 50, 55, 60];
  const ultras = [5, 15, 25, 35];
  const rares = [2, 4, 6, 8, 12, 14, 16, 18, 22, 24, 26, 28, 32, 34];
  return Array.from({ length: 85 }, (_, index) => {
    const number = index + 1;
    if (supers.includes(number)) return tlm(number, 'Super Rare');
    if (ultras.includes(number)) return tlm(number, 'Ultra Rare');
    if (rares.includes(number)) return tlm(number, 'Rare');
    if (number > 60) return tlm(number, 'Ultimate Rare');
    return tlm(number, 'Common');
  });
}

describe('rarity options', () => {
  it('counts each rarity in an opened set, ladder first, then the rest alphabetically', () => {
    const options = rarityOptions(lostMillennium(), rarityOf);

    expect(options).toEqual([
      { rarity: 'Common', count: 35 },
      { rarity: 'Rare', count: 14 },
      { rarity: 'Super Rare', count: 7 },
      { rarity: 'Ultra Rare', count: 4 },
      { rarity: 'Ultimate Rare', count: 25 },
    ]);
  });

  it('puts Secret Rare after Ultra Rare, then the rest alphabetically', () => {
    const entries = [
      tlm(1, 'Starlight Rare'),
      tlm(2, 'Ghost Rare'),
      tlm(3, 'Secret Rare'),
      tlm(4, 'Ultra Rare'),
    ];

    const options = rarityOptions(entries, rarityOf);

    expect(options.map(({ rarity }) => rarity)).toEqual([
      'Ultra Rare',
      'Secret Rare',
      'Ghost Rare',
      'Starlight Rare',
    ]);
  });

  it('offers nothing for a list with a single rarity', () => {
    const entries = [tlm(1, 'Common'), tlm(2, 'Common')];

    const options = rarityOptions(entries, rarityOf);

    expect(options).toEqual([]);
  });

  it('keeps rarities spelled differently as separate options', () => {
    const entries = [tlm(1, 'PLatinum Secret Rare'), tlm(2, 'Platinum Secret Rare')];

    const options = rarityOptions(entries, rarityOf);

    expect(options).toEqual([
      { rarity: 'Platinum Secret Rare', count: 1 },
      { rarity: 'PLatinum Secret Rare', count: 1 },
    ]);
  });
});

describe('keeping rarities', () => {
  it('keeps the printings of either selected rarity in set-code order', () => {
    const selected = new Set(['Super Rare', 'Ultra Rare']);

    const kept = keepRarities(lostMillennium(), selected, rarityOf);

    expect(kept.map((entry) => entry.printing.setCode)).toEqual([
      'TLM-EN005',
      'TLM-EN010',
      'TLM-EN015',
      'TLM-EN020',
      'TLM-EN025',
      'TLM-EN030',
      'TLM-EN035',
      'TLM-EN040',
      'TLM-EN050',
      'TLM-EN055',
      'TLM-EN060',
    ]);
  });

  it('keeps every printing when nothing is selected', () => {
    const kept = keepRarities(lostMillennium(), NO_RARITIES, rarityOf);

    expect(kept).toHaveLength(85);
  });
});

describe('toggling a rarity', () => {
  it('adds a rarity that is not selected', () => {
    const next = toggleRarity(new Set(['Platinum Secret Rare']), 'PLatinum Secret Rare');

    expect([...next]).toEqual(['Platinum Secret Rare', 'PLatinum Secret Rare']);
  });

  it('removes a rarity that is selected', () => {
    const next = toggleRarity(new Set(['Super Rare', 'Ultra Rare']), 'Super Rare');

    expect([...next]).toEqual(['Ultra Rare']);
  });
});
