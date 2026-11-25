import { describe, expect, it, vi } from 'vitest';
import { emptyBinder, slotAt } from './binder';
import { initializeShelf, loadShelf, saveBinders } from './savedShelf';
import {
  OPEN_BINDER_KEY,
  SAVED_BINDER_KEY,
  saveBinderWith,
  savedDarkMagician,
} from './test/binder';

describe('loading a saved shelf', () => {
  it('migrates the latest legacy copy when an older snapshot tries to initialize storage', () => {
    saveBinderWith({ 0: savedDarkMagician });

    initializeShelf([{ name: 'Binder 1', binder: emptyBinder() }]);

    const saved: unknown = JSON.parse(localStorage.getItem(SAVED_BINDER_KEY) ?? 'null');
    expect(saved).toMatchObject({
      binders: [
        { name: 'Binder 1', binder: { slots: expect.arrayContaining([savedDarkMagician]) } },
      ],
    });
    const shelf = loadShelf();
    expect(slotAt(shelf.binders[shelf.activeIndex].binder, { page: 1, position: 0 })).toEqual(
      savedDarkMagician,
    );
  });

  it('preserves the original binder when the replacement exceeds the storage quota', () => {
    saveBinderWith({ 0: savedDarkMagician });
    const original = localStorage.getItem(SAVED_BINDER_KEY);
    const shelf = loadShelf();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError');
    });

    initializeShelf(shelf.binders);

    expect(localStorage.getItem(SAVED_BINDER_KEY)).toBe(original);
  });

  it('opens the first saved binder when the selected name is missing from the shelf', () => {
    localStorage.setItem(
      SAVED_BINDER_KEY,
      JSON.stringify({
        binders: [
          { name: 'Main', binder: { slots: [savedDarkMagician, ...emptyBinder().slots.slice(1)] } },
          { name: 'Trades', binder: emptyBinder() },
        ],
      }),
    );
    localStorage.setItem(OPEN_BINDER_KEY, 'Missing');

    const shelf = loadShelf();

    expect(shelf.binders[shelf.activeIndex]).toMatchObject({
      name: 'Main',
      binder: { slots: expect.arrayContaining([savedDarkMagician]) },
    });
  });

  it('keeps the saved binders when a stale tab tries to initialize the shelf', () => {
    saveBinders([{ name: 'Trades', binder: emptyBinder() }]);

    initializeShelf([{ name: 'Binder 1', binder: emptyBinder() }]);

    const shelf = loadShelf();
    expect(shelf.binders.map(({ name }) => name)).toEqual(['Trades']);
  });

  it.each(['', ' Trades ', 'Main', 33])(
    'opens a fresh binder for an invalid saved name of %j',
    (name) => {
      localStorage.setItem(
        SAVED_BINDER_KEY,
        JSON.stringify({
          binders: [
            { name: 'Main', binder: emptyBinder() },
            { name, binder: emptyBinder() },
          ],
        }),
      );

      const shelf = loadShelf();

      expect(shelf.binders[shelf.activeIndex].name).toBe('Binder 1');
    },
  );

  it('opens a fresh binder when a saved binder is missing its pockets', () => {
    localStorage.setItem(
      SAVED_BINDER_KEY,
      JSON.stringify({ binders: [{ name: 'Main', binder: {} }] }),
    );

    const shelf = loadShelf();

    expect(shelf.binders[shelf.activeIndex].name).toBe('Binder 1');
  });
});
