import { describe, expect, it } from 'vitest';
import type { SetPrinting } from './catalogue';
import { filterSetPrintings, isFiltering, isSameListing, NO_FILTERS, toggle } from './setFilters';
import { darkMagician } from './test/fakeCatalogue';

/** A printing of [setName] with [setCode] and [rarity]. */
function printing(setCode: string, rarity: string, setName: string): SetPrinting {
  return { card: darkMagician, printing: { setCode, setName, rarity } };
}

/** A printing of The Lost Millennium with set code TLM-EN followed by [number], three digits. */
const tlm = (number: number, rarity: string) =>
  printing(`TLM-EN${String(number).padStart(3, '0')}`, rarity, 'The Lost Millennium');

/** A printing of Legend of Blue Eyes White Dragon with [setCode]. */
const lob = (setCode: string, rarity: string) =>
  printing(setCode, rarity, 'Legend of Blue Eyes White Dragon');

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

/**
 * Legend of Blue Eyes White Dragon in its three print runs, in set-code order: LOB- with three printings, LOB-E with
 * two, and LOB-EN with four. Each run opens with Blue-Eyes White Dragon in Ultra Rare at number 001; LOB-EN004 is
 * the only Rare and the rest are Common.
 */
function legendOfBlueEyes(): SetPrinting[] {
  return [
    lob('LOB-001', 'Ultra Rare'),
    lob('LOB-002', 'Common'),
    lob('LOB-003', 'Common'),
    lob('LOB-E001', 'Ultra Rare'),
    lob('LOB-E002', 'Common'),
    lob('LOB-EN001', 'Ultra Rare'),
    lob('LOB-EN002', 'Common'),
    lob('LOB-EN003', 'Common'),
    lob('LOB-EN004', 'Rare'),
  ];
}

const setCodes = (entries: readonly SetPrinting[]) =>
  entries.map((entry) => entry.printing.setCode);

describe('rarity options', () => {
  it('counts each rarity in an opened set, ladder first, then the rest alphabetically', () => {
    const { rarities } = filterSetPrintings(lostMillennium(), NO_FILTERS);

    expect(rarities).toEqual([
      { value: 'Common', count: 35 },
      { value: 'Rare', count: 14 },
      { value: 'Super Rare', count: 7 },
      { value: 'Ultra Rare', count: 4 },
      { value: 'Ultimate Rare', count: 25 },
    ]);
  });

  it('puts Secret Rare after Ultra Rare, then the rest alphabetically', () => {
    const entries = [
      tlm(1, 'Starlight Rare'),
      tlm(2, 'Ghost Rare'),
      tlm(3, 'Secret Rare'),
      tlm(4, 'Ultra Rare'),
    ];

    const { rarities } = filterSetPrintings(entries, NO_FILTERS);

    expect(rarities.map(({ value }) => value)).toEqual([
      'Ultra Rare',
      'Secret Rare',
      'Ghost Rare',
      'Starlight Rare',
    ]);
  });

  it('offers nothing for a list with a single rarity', () => {
    const entries = [tlm(1, 'Common'), tlm(2, 'Common')];

    const { rarities } = filterSetPrintings(entries, NO_FILTERS);

    expect(rarities).toEqual([]);
  });

  it('keeps rarities spelled differently as separate options', () => {
    const entries = [tlm(1, 'PLatinum Secret Rare'), tlm(2, 'Platinum Secret Rare')];

    const { rarities } = filterSetPrintings(entries, NO_FILTERS);

    expect(rarities).toEqual([
      { value: 'Platinum Secret Rare', count: 1 },
      { value: 'PLatinum Secret Rare', count: 1 },
    ]);
  });

  it('counts only the printings in the chosen print runs', () => {
    const selection = { ...NO_FILTERS, printRuns: new Set(['LOB-EN']) };

    const { rarities } = filterSetPrintings(legendOfBlueEyes(), selection);

    expect(rarities).toEqual([
      { value: 'Common', count: 2 },
      { value: 'Rare', count: 1 },
      { value: 'Ultra Rare', count: 1 },
    ]);
  });

  it('keeps a rarity the chosen print runs leave none of, counted 0', () => {
    const selection = { ...NO_FILTERS, printRuns: new Set(['LOB-E']) };

    const { rarities } = filterSetPrintings(legendOfBlueEyes(), selection);

    expect(rarities).toEqual([
      { value: 'Common', count: 1 },
      { value: 'Rare', count: 0 },
      { value: 'Ultra Rare', count: 1 },
    ]);
  });
});

describe('print run options', () => {
  it('counts each print run in set-code order of its first printing', () => {
    const { printRuns } = filterSetPrintings(legendOfBlueEyes(), NO_FILTERS);

    expect(printRuns).toEqual([
      { value: 'LOB-', count: 3 },
      { value: 'LOB-E', count: 2 },
      { value: 'LOB-EN', count: 4 },
    ]);
  });

  it('offers nothing for a set with a single print run', () => {
    const { printRuns } = filterSetPrintings(lostMillennium(), NO_FILTERS);

    expect(printRuns).toEqual([]);
  });

  it('counts only the printings of the chosen rarities', () => {
    const selection = { ...NO_FILTERS, rarities: new Set(['Ultra Rare']) };

    const { printRuns } = filterSetPrintings(legendOfBlueEyes(), selection);

    expect(printRuns).toEqual([
      { value: 'LOB-', count: 1 },
      { value: 'LOB-E', count: 1 },
      { value: 'LOB-EN', count: 1 },
    ]);
  });

  it('keeps a print run the chosen rarities leave none of, counted 0', () => {
    const selection = { ...NO_FILTERS, rarities: new Set(['Rare']) };

    const { printRuns } = filterSetPrintings(legendOfBlueEyes(), selection);

    expect(printRuns).toEqual([
      { value: 'LOB-', count: 0 },
      { value: 'LOB-E', count: 0 },
      { value: 'LOB-EN', count: 1 },
    ]);
  });
});

describe('listed printings', () => {
  it('lists the printings of either chosen rarity in set-code order', () => {
    const selection = { ...NO_FILTERS, rarities: new Set(['Super Rare', 'Ultra Rare']) };

    const { listed } = filterSetPrintings(lostMillennium(), selection);

    expect(setCodes(listed)).toEqual([
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

  it('lists every printing when nothing is chosen', () => {
    const { listed } = filterSetPrintings(lostMillennium(), NO_FILTERS);

    expect(listed).toHaveLength(85);
  });

  it('lists only the chosen print run, so Blue-Eyes White Dragon appears once', () => {
    const selection = { ...NO_FILTERS, printRuns: new Set(['LOB-EN']) };

    const { listed } = filterSetPrintings(legendOfBlueEyes(), selection);

    expect(setCodes(listed)).toEqual(['LOB-EN001', 'LOB-EN002', 'LOB-EN003', 'LOB-EN004']);
  });

  it('lists the printings of either chosen print run in set-code order', () => {
    const selection = { ...NO_FILTERS, printRuns: new Set(['LOB-EN', 'LOB-']) };

    const { listed } = filterSetPrintings(legendOfBlueEyes(), selection);

    expect(setCodes(listed)).toEqual([
      'LOB-001',
      'LOB-002',
      'LOB-003',
      'LOB-EN001',
      'LOB-EN002',
      'LOB-EN003',
      'LOB-EN004',
    ]);
  });

  it('lists only the printings matching both a chosen rarity and a chosen print run', () => {
    const selection = { rarities: new Set(['Ultra Rare']), printRuns: new Set(['LOB-EN']) };

    const { listed } = filterSetPrintings(legendOfBlueEyes(), selection);

    expect(setCodes(listed)).toEqual(['LOB-EN001']);
  });
});

describe('filtering', () => {
  it('does not filter while nothing is chosen', () => {
    expect(isFiltering(NO_FILTERS)).toBe(false);
  });

  it('filters while only a print run is chosen', () => {
    const selection = { ...NO_FILTERS, printRuns: new Set(['LOB-EN']) };

    expect(isFiltering(selection)).toBe(true);
  });

  it('filters while only a rarity is chosen', () => {
    const selection = { ...NO_FILTERS, rarities: new Set(['Rare']) };

    expect(isFiltering(selection)).toBe(true);
  });
});

describe('same listing', () => {
  it('is the same listing when the same printings come back in a new list', () => {
    const printings = lostMillennium();
    const before = filterSetPrintings(printings, NO_FILTERS).listed;

    const after = filterSetPrintings(printings, NO_FILTERS).listed;

    expect(isSameListing(before, after)).toBe(true);
  });

  it('is another listing when a printing is added at the end', () => {
    const printings = lostMillennium();

    const narrowed = printings.slice(0, 84);

    expect(isSameListing(narrowed, printings)).toBe(false);
  });

  it('is another listing when the same printings come in another order', () => {
    const printings = [tlm(1, 'Common'), tlm(2, 'Rare')];

    const reversed = [...printings].reverse();

    expect(isSameListing(printings, reversed)).toBe(false);
  });

  it('is another listing when nothing was listed before', () => {
    expect(isSameListing(null, [])).toBe(false);
  });
});

describe('toggling a value', () => {
  it('adds a value that is not selected', () => {
    const next = toggle(new Set(['Platinum Secret Rare']), 'PLatinum Secret Rare');

    expect([...next]).toEqual(['Platinum Secret Rare', 'PLatinum Secret Rare']);
  });

  it('removes a value that is selected', () => {
    const next = toggle(new Set(['Super Rare', 'Ultra Rare']), 'Super Rare');

    expect([...next]).toEqual(['Ultra Rare']);
  });
});
