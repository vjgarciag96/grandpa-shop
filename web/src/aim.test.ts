import { describe, expect, it } from 'vitest';
import { chooseSlot, choosePrinting, runStart, type Aim } from './aim';
import { darkMagician } from './test/fakeCatalogue';

const [lob, sdy] = darkMagician.printings;
const holdingLob: Aim = { kind: 'holding', card: darkMagician, printing: lob };
const targetSlot3: Aim = { kind: 'target', address: { page: 1, position: 2 } };

describe('choosing a slot', () => {
  it('places the held printing in an empty slot', () => {
    expect(chooseSlot(holdingLob, false)).toEqual({
      kind: 'place',
      card: darkMagician,
      printing: lob,
    });
  });

  it('refuses a filled slot while holding', () => {
    expect(chooseSlot(holdingLob, true)).toEqual({ kind: 'refuse' });
  });

  it("opens a filled slot's detail when nothing is held", () => {
    expect(chooseSlot(targetSlot3, true)).toEqual({ kind: 'open-detail' });
  });

  it('targets an empty slot when nothing is held', () => {
    expect(chooseSlot(null, false)).toEqual({ kind: 'target' });
  });
});

describe('choosing a printing', () => {
  it('places it in the target', () => {
    expect(choosePrinting(targetSlot3, darkMagician, sdy)).toEqual({
      kind: 'place',
      address: { page: 1, position: 2 },
    });
  });

  it('holds it when nothing is targeted', () => {
    expect(choosePrinting(null, darkMagician, sdy)).toEqual({
      kind: 'aim',
      aim: { kind: 'holding', card: darkMagician, printing: sdy },
    });
  });

  it('puts it down when it is the one held', () => {
    expect(choosePrinting(holdingLob, darkMagician, lob)).toEqual({
      kind: 'aim',
      aim: null,
    });
  });

  it('holds the other rarity of the same set code instead of putting it down', () => {
    const starfoil = { ...lob, rarity: 'Starfoil Rare' };

    expect(choosePrinting(holdingLob, darkMagician, starfoil)).toEqual({
      kind: 'aim',
      aim: { kind: 'holding', card: darkMagician, printing: starfoil },
    });
  });
});

describe('where a run of placements starts', () => {
  it('starts at the target slot', () => {
    expect(runStart(targetSlot3, 4)).toEqual({ page: 1, position: 2 });
  });

  it('starts at slot 1 of the given page when nothing is aimed', () => {
    expect(runStart(null, 4)).toEqual({ page: 4, position: 0 });
  });

  it('starts at slot 1 of the given page while holding a printing', () => {
    expect(runStart(holdingLob, 4)).toEqual({ page: 4, position: 0 });
  });
});
