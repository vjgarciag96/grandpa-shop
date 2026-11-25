// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  changeCondition,
  DEFAULT_BINDER_CAPACITY,
  emptyBinder,
  isBinderCapacity,
  moveCopy,
  pageSlots,
  place,
  remove,
  removeCopy,
  resizeBinder,
  sameSlot,
  slotAt,
  spreadCount,
  spreadPages,
  type BinderCapacity,
  type Copy,
} from './binder';
import { darkMagician, potOfGreed } from './test/fakeCatalogue';

const darkMagicianCopy: Copy = {
  card: darkMagician,
  printing: darkMagician.printings[0],
  condition: 'Near Mint',
};

describe('spreadPages', () => {
  it('shows page 1 alone on the right of the first spread', () => {
    const pages = spreadPages(DEFAULT_BINDER_CAPACITY, 0);

    expect(pages).toEqual({ left: null, right: 1 });
  });

  it('puts the back of page 1 and the front of the next sheet together', () => {
    const pages = spreadPages(DEFAULT_BINDER_CAPACITY, 1);

    expect(pages).toEqual({ left: 2, right: 3 });
  });

  it('shows page 40 alone on the left of the last spread', () => {
    const pages = spreadPages(DEFAULT_BINDER_CAPACITY, 20);

    expect(pages).toEqual({ left: 40, right: null });
  });
});

describe('configured binder capacity', () => {
  it.each([
    [{ grid: 2, pages: 1 }, 4],
    [{ grid: 3, pages: 2 }, 9],
    [{ grid: 4, pages: 200 }, 16],
  ] as const)('opens a page of %j with %i empty pockets', (capacity, pockets) => {
    const binder = emptyBinder(capacity);

    const slots = pageSlots(binder, capacity.pages);

    expect(slots).toEqual(Array(pockets).fill(null));
  });

  it.each([
    [1, 1, { left: null, right: 1 }],
    [3, 2, { left: 2, right: 3 }],
    [4, 3, { left: 4, right: null }],
  ])('ends a binder of %i pages on the expected spread', (pages, count, sides) => {
    const capacity: BinderCapacity = { grid: 3, pages };

    const foundCount = spreadCount(capacity);

    expect(foundCount).toBe(count);
    expect(spreadPages(capacity, foundCount - 1)).toEqual(sides);
  });

  it.each([
    null,
    { grid: 5, pages: 3 },
    { grid: '4', pages: 3 },
    { grid: 4, pages: '3' },
    { grid: 4, pages: 0 },
    { grid: 4, pages: 2.5 },
    { grid: 4, pages: 201 },
  ])('rejects invalid capacity %j', (capacity) => {
    expect(isBinderCapacity(capacity)).toBe(false);
  });

  it.each([
    { grid: 2, pages: 1 },
    { grid: 3, pages: 40 },
    { grid: 4, pages: 200 },
  ])('accepts valid capacity %j', (capacity) => {
    expect(isBinderCapacity(capacity)).toBe(true);
  });

  it('cannot create a binder with no pages', () => {
    expect(() => emptyBinder({ grid: 3, pages: 0 })).toThrow(RangeError);
  });

  it.each([
    { page: 0, position: 0 },
    { page: 3, position: 0 },
    { page: 1.5, position: 0 },
    { page: 1, position: -1 },
    { page: 1, position: 4 },
    { page: 1, position: 0.5 },
  ])('refuses a slot address %j outside a two-page 2×2 binder', (address) => {
    const binder = emptyBinder({ grid: 2, pages: 2 });

    expect(() => slotAt(binder, address)).toThrow(RangeError);
  });
});

describe('resizing a binder', () => {
  it.each([2, 4] as const)('keeps the same page and numbered pocket with %i columns', (grid) => {
    const address = { page: 3, position: 2 };
    const before = place(emptyBinder(), address, darkMagicianCopy);

    const outcome = resizeBinder(before, { grid, pages: 5 });

    if (outcome.kind !== 'resized') throw new Error('Expected the binder capacity to change');
    expect(slotAt(outcome.binder, address)).toBe(darkMagicianCopy);
    expect(slotAt(outcome.binder, { page: 2, position: 2 })).toBe(null);
  });

  it.each([
    [
      { grid: 3, pages: 2 },
      { page: 3, position: 0 },
    ],
    [
      { grid: 2, pages: 4 },
      { page: 4, position: 4 },
    ],
  ] as const)('refuses %j when it would remove the occupied pocket %j', (capacity, address) => {
    const before = place(emptyBinder(), address, darkMagicianCopy);

    const outcome = resizeBinder(before, capacity);

    expect(outcome).toEqual({ kind: 'occupied', address });
    expect(slotAt(before, address)).toBe(darkMagicianCopy);
  });
});

describe('place', () => {
  it('puts the copy in the chosen slot of the chosen page', () => {
    const binder = place(emptyBinder(), { page: 3, position: 5 }, darkMagicianCopy);

    expect(pageSlots(binder, 3)[5]).toBe(darkMagicianCopy);
  });

  it('leaves the same position on other pages empty', () => {
    const binder = place(emptyBinder(), { page: 3, position: 5 }, darkMagicianCopy);

    expect(pageSlots(binder, 2)[5]).toBeNull();
  });

  it('does not change the binder it was given', () => {
    const before = emptyBinder();

    place(before, { page: 1, position: 0 }, darkMagicianCopy);

    expect(pageSlots(before, 1)[0]).toBeNull();
  });
});

describe('remove', () => {
  it('empties the slot', () => {
    const filled = place(emptyBinder(), { page: 2, position: 4 }, darkMagicianCopy);

    const binder = remove(filled, { page: 2, position: 4 });

    expect(pageSlots(binder, 2)[4]).toBeNull();
  });
});

describe('changeCondition', () => {
  it("keeps the copy's printing and changes only its condition", () => {
    const filled = place(emptyBinder(), { page: 2, position: 4 }, darkMagicianCopy);

    const binder = changeCondition(filled, { page: 2, position: 4 }, 'Heavily Played');

    expect(pageSlots(binder, 2)[4]).toEqual({
      ...darkMagicianCopy,
      condition: 'Heavily Played',
    });
  });

  it('leaves an empty slot empty', () => {
    const binder = changeCondition(emptyBinder(), { page: 2, position: 4 }, 'Damaged');

    expect(pageSlots(binder, 2)[4]).toBeNull();
  });
});

describe('sameSlot', () => {
  it('matches two addresses of the same page and position', () => {
    const same = sameSlot({ page: 2, position: 4 }, { page: 2, position: 4 });

    expect(same).toBe(true);
  });

  it('tells apart the same position on another page', () => {
    const same = sameSlot({ page: 2, position: 4 }, { page: 3, position: 4 });

    expect(same).toBe(false);
  });

  it('tells apart another position on the same page', () => {
    const same = sameSlot({ page: 2, position: 4 }, { page: 2, position: 5 });

    expect(same).toBe(false);
  });
});

describe('moveCopy', () => {
  const playedCopy: Copy = {
    card: darkMagician,
    printing: darkMagician.printings[1],
    condition: 'Lightly Played',
  };
  const potOfGreedCopy: Copy = {
    card: potOfGreed,
    printing: potOfGreed.printings[0],
    condition: 'Near Mint',
  };

  it('moves a copy with its printing and condition into an empty slot and empties its source', () => {
    const filled = place(emptyBinder(), { page: 2, position: 4 }, playedCopy);

    const move = moveCopy(filled, { page: 2, position: 4 }, { page: 3, position: 1 }, playedCopy);

    expect(move).toEqual({
      kind: 'moved',
      binder: place(emptyBinder(), { page: 3, position: 1 }, playedCopy),
    });
  });

  it('refuses a copy that is no longer in the source slot', () => {
    const filled = place(emptyBinder(), { page: 2, position: 4 }, playedCopy);

    const move = moveCopy(
      filled,
      { page: 2, position: 4 },
      { page: 3, position: 1 },
      { ...playedCopy, condition: 'Damaged' },
    );

    expect(move).toEqual({ kind: 'refused' });
  });

  it('swaps with the copy in a filled destination and names it', () => {
    const filled = place(
      place(emptyBinder(), { page: 2, position: 4 }, playedCopy),
      { page: 3, position: 1 },
      potOfGreedCopy,
    );

    const move = moveCopy(filled, { page: 2, position: 4 }, { page: 3, position: 1 }, playedCopy);

    expect(move).toEqual({
      kind: 'swapped',
      binder: place(
        place(emptyBinder(), { page: 2, position: 4 }, potOfGreedCopy),
        { page: 3, position: 1 },
        playedCopy,
      ),
      displaced: potOfGreedCopy,
    });
  });

  it("refuses a drop on the copy's own slot", () => {
    const filled = place(emptyBinder(), { page: 2, position: 4 }, playedCopy);

    const move = moveCopy(filled, { page: 2, position: 4 }, { page: 2, position: 4 }, playedCopy);

    expect(move).toEqual({ kind: 'refused' });
  });
});

describe('removeCopy', () => {
  it('empties the slot that still holds the copy', () => {
    const filled = place(emptyBinder(), { page: 2, position: 4 }, darkMagicianCopy);

    const removal = removeCopy(filled, { page: 2, position: 4 }, darkMagicianCopy);

    expect(removal).toEqual({ kind: 'removed', binder: emptyBinder() });
  });

  it('refuses a copy that is no longer in the slot', () => {
    const filled = place(emptyBinder(), { page: 2, position: 4 }, darkMagicianCopy);

    const removal = removeCopy(
      filled,
      { page: 2, position: 4 },
      {
        ...darkMagicianCopy,
        condition: 'Damaged',
      },
    );

    expect(removal).toEqual({ kind: 'refused' });
  });

  it('refuses an empty slot', () => {
    const removal = removeCopy(emptyBinder(), { page: 2, position: 4 }, darkMagicianCopy);

    expect(removal).toEqual({ kind: 'refused' });
  });
});
