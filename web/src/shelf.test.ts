// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { pageSlots } from './binder';
import { addBinder, initialShelf, openBinder } from './shelf';

describe('a binder shelf', () => {
  it('opens a named empty binder after the first binder', () => {
    const shelf = initialShelf();

    const added = addBinder(shelf, '  Trades  ');

    expect(added).toMatchObject({
      kind: 'added',
      shelf: { activeIndex: 1, binders: [{ name: 'Binder 1' }, { name: 'Trades' }] },
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

  it('keeps the open binder when the requested shelf position is absent', () => {
    const shelf = initialShelf();

    const opened = openBinder(shelf, 1);

    expect(opened.activeIndex).toBe(0);
  });
});
