// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { emptyBinder, pageSlots } from './binder';
import {
  addBinder,
  closeBinder,
  initialShelf,
  lastOpenedBinder,
  openBinder,
  replaceOpenBinder,
  type Shelf,
} from './shelf';

/** Binder 1 then Trades, a 2×2 binder of one page, with Trades open. */
function addedShelf(): Shelf {
  const added = addBinder(initialShelf(), 'Trades', { grid: 2, pages: 1 });
  if (added.kind !== 'added') throw new Error('Expected the Trades binder to open');
  return added.shelf;
}

describe('a binder shelf', () => {
  it('shows the shelf with no binder marked as last opened on a first visit', () => {
    const shelf = initialShelf();

    expect(shelf.showing).toEqual({ kind: 'shelf', lastOpened: null });
  });

  it('opens a named empty binder after the first binder', () => {
    const shelf = initialShelf();

    const added = addBinder(shelf, '  Trades  ');

    expect(added).toMatchObject({
      kind: 'added',
      shelf: {
        showing: { kind: 'binder', index: 1 },
        binders: [{ name: 'Binder 1' }, { name: 'Trades' }],
      },
    });
    if (added.kind !== 'added') throw new Error('Expected the Trades binder to open');
    expect(pageSlots(added.shelf.binders[1].binder, 1)).toEqual(Array(9).fill(null));
  });

  it.each([
    ['   ', 'blank-name'],
    ['  Binder 1  ', 'duplicate-name'],
  ])('refuses the name %j without adding a binder', (name, kind) => {
    const shelf = initialShelf();

    const added = addBinder(shelf, name);

    expect(added).toEqual({ kind });
  });

  it('opens the binder at the chosen shelf position', () => {
    const shelf = closeBinder(addedShelf());

    const opened = openBinder(shelf, 1);

    expect(opened.showing).toEqual({ kind: 'binder', index: 1 });
  });

  it('leaves the shelf unchanged when the requested shelf position is absent', () => {
    const shelf = initialShelf();

    const opened = openBinder(shelf, 1);

    expect(opened).toBe(shelf);
  });

  it('marks a closed binder as the one opened last', () => {
    const shelf = addedShelf();

    const closed = closeBinder(shelf);

    expect(closed.showing).toEqual({ kind: 'shelf', lastOpened: 1 });
  });

  it('changes no binder while the shelf itself is shown', () => {
    const shelf = initialShelf();

    const replaced = replaceOpenBinder(shelf, emptyBinder({ grid: 2, pages: 1 }));

    expect(replaced).toBe(shelf);
  });

  it('replaces the contents of the open binder and leaves the others', () => {
    const shelf = addedShelf();
    const next = emptyBinder({ grid: 4, pages: 1 });

    const replaced = replaceOpenBinder(shelf, next);

    expect(replaced.binders.map(({ binder }) => binder)).toEqual([shelf.binders[0].binder, next]);
  });

  it('marks the binder put back as last opened while the shelf is shown', () => {
    const shelf = closeBinder(addedShelf());

    const lastOpened = lastOpenedBinder(shelf);

    expect(lastOpened).toBe(1);
  });

  it('marks no binder as last opened while a binder is open', () => {
    const shelf = addedShelf();

    const lastOpened = lastOpenedBinder(shelf);

    expect(lastOpened).toBeNull();
  });
});
