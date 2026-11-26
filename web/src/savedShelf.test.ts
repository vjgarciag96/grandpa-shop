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
    expect(slotAt(shelf.binders[0].binder, { page: 1, position: 0 })).toEqual(savedDarkMagician);
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

  it('marks no binder as last opened when the saved name is missing', () => {
    saveBinders([
      { name: 'Main', binder: emptyBinder() },
      { name: 'Trades', binder: emptyBinder() },
    ]);
    localStorage.setItem(OPEN_BINDER_KEY, 'Missing');

    const shelf = loadShelf();

    expect(shelf.showing).toEqual({ kind: 'shelf', lastOpened: null });
  });

  it('marks the saved binder as last opened without opening it', () => {
    saveBinders([
      { name: 'Main', binder: emptyBinder() },
      { name: 'Trades', binder: emptyBinder() },
    ]);
    localStorage.setItem(OPEN_BINDER_KEY, 'Trades');

    const shelf = loadShelf();

    expect(shelf.showing).toEqual({ kind: 'shelf', lastOpened: 1 });
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

      expect(shelf.binders.map(({ name }) => name)).toEqual(['Binder 1']);
    },
  );

  it('restores nine pockets and 40 pages for a shelf saved before capacity settings', () => {
    const slots = Array(360).fill(null);
    slots[359] = savedDarkMagician;
    localStorage.setItem(
      SAVED_BINDER_KEY,
      JSON.stringify({ binders: [{ name: 'Main', binder: { slots } }] }),
    );

    const shelf = loadShelf();

    const [{ name, binder }] = shelf.binders;
    expect(name).toBe('Main');
    expect(binder.capacity).toEqual({ grid: 3, pages: 40 });
    expect(slotAt(binder, { page: 40, position: 8 })).toEqual(savedDarkMagician);
  });

  it.each([{ grid: 3, pages: 39 }, { grid: 4, pages: 40 }, { grid: 3, pages: 0 }, null])(
    'refuses a saved binder with invalid recorded capacity %j',
    (capacity) => {
      const binder = { ...emptyBinder(), capacity };
      localStorage.setItem(
        SAVED_BINDER_KEY,
        JSON.stringify({ binders: [{ name: 'Main', binder }] }),
      );

      const shelf = loadShelf();

      expect(shelf.binders.map(({ name }) => name)).toEqual(['Binder 1']);
    },
  );

  it('refuses an unsupported grid even when its recorded slot count matches', () => {
    const binder = { capacity: { grid: 5, pages: 1 }, slots: Array(25).fill(null) };
    localStorage.setItem(SAVED_BINDER_KEY, JSON.stringify({ binders: [{ name: 'Main', binder }] }));

    const shelf = loadShelf();

    expect(shelf.binders.map(({ name }) => name)).toEqual(['Binder 1']);
  });

  it('opens a fresh binder when a saved binder is missing its pockets', () => {
    localStorage.setItem(
      SAVED_BINDER_KEY,
      JSON.stringify({ binders: [{ name: 'Main', binder: {} }] }),
    );

    const shelf = loadShelf();

    expect(shelf.binders.map(({ name }) => name)).toEqual(['Binder 1']);
  });
});
