// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { emptyBinder, pageSlots } from './binder';
import { addBinder, closeBinder, initialShelf, openBinder, replaceOpenBinder } from './shelf';

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
    const shelf = initialShelf();

    const opened = openBinder(shelf, 0);

    expect(opened.showing).toEqual({ kind: 'binder', index: 0 });
  });

  it('leaves the shelf unchanged when the requested shelf position is absent', () => {
    const shelf = initialShelf();

    const opened = openBinder(shelf, 1);

    expect(opened).toBe(shelf);
  });

  it('marks a closed binder as the one opened last', () => {
    const added = addBinder(initialShelf(), 'Trades');
    if (added.kind !== 'added') throw new Error('Expected the Trades binder to open');

    const closed = closeBinder(added.shelf);

    expect(closed.showing).toEqual({ kind: 'shelf', lastOpened: 1 });
  });

  it('changes no binder while the shelf itself is shown', () => {
    const shelf = initialShelf();

    const replaced = replaceOpenBinder(shelf, emptyBinder({ grid: 2, pages: 1 }));

    expect(replaced).toBe(shelf);
  });

  it('replaces the contents of the open binder', () => {
    const next = emptyBinder({ grid: 2, pages: 1 });

    const replaced = replaceOpenBinder(openBinder(initialShelf(), 0), next);

    expect(replaced.binders[0].binder).toBe(next);
  });
});
