import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadShelf } from './savedShelf';
import { openApp, openPotOfGreedOverDarkMagician } from './test/app';
import {
  SAVED_BINDER_KEY,
  detailOf,
  saveBinderWith,
  savedDarkMagician,
  savedPlayedSdyDarkMagician,
} from './test/binder';
import { dragPrintingWithMouse, moveCopyWithMouse, removeCopyWithMouse } from './test/drag';
import { darkMagician } from './test/fakeCatalogue';
import { stubLayout } from './test/layout';

const slot = (name: string) => screen.getByRole('button', { name });

async function placeDarkMagicianInFirstSlot(user: ReturnType<typeof openApp>['user']) {
  await user.click(slot('Page 1, slot 1, empty'));
  await user.type(screen.getByRole('searchbox', { name: 'Search cards and sets' }), 'dark');
  await user.click(await screen.findByRole('button', { name: /Dark Magician/ }));
  await user.click(screen.getByRole('button', { name: /LOB-EN005/ }));
}

beforeEach(() => {
  stubLayout();
});

describe('the binder across reloads', () => {
  it('keeps a placed card when the app is opened again', async () => {
    const first = openApp();
    await placeDarkMagicianInFirstSlot(first.user);
    first.close();

    openApp();

    expect(slot('Page 1, slot 1: Dark Magician')).toBeTruthy();
  });

  it('keeps a changed condition when the app is opened again', async () => {
    const first = openApp();
    await placeDarkMagicianInFirstSlot(first.user);
    await first.user.click(slot('Page 1, slot 1: Dark Magician'));
    await first.user.selectOptions(
      screen.getByRole('combobox', { name: 'Condition' }),
      'Heavily Played',
    );
    first.close();

    const second = openApp();
    await second.user.click(slot('Page 1, slot 1: Dark Magician'));

    expect((screen.getByRole('combobox', { name: 'Condition' }) as HTMLSelectElement).value).toBe(
      'Heavily Played',
    );
  });

  it('keeps a removed copy gone when the app is opened again', async () => {
    const first = openApp();
    await placeDarkMagicianInFirstSlot(first.user);
    await first.user.click(slot('Page 1, slot 1: Dark Magician'));
    await first.user.click(screen.getByRole('button', { name: 'Remove from slot' }));
    first.close();

    openApp();

    expect(slot('Page 1, slot 1, empty')).toBeTruthy();
  });

  it('keeps a copy dragged off the binder gone when the app is opened again', () => {
    saveBinderWith({ 0: savedPlayedSdyDarkMagician });
    const first = openApp();
    removeCopyWithMouse(slot('Page 1, slot 1: Dark Magician'));
    first.close();

    openApp();

    expect(slot('Page 1, slot 1, empty')).toBeTruthy();
  });

  it('keeps a moved copy in its new pocket when the app is opened again', async () => {
    saveBinderWith({
      0: { ...savedDarkMagician, condition: 'Lightly Played' },
    });
    const first = openApp();
    moveCopyWithMouse(slot('Page 1, slot 1: Dark Magician'), slot('Page 1, slot 3, empty'));
    first.close();

    const second = openApp();
    await second.user.click(slot('Page 1, slot 3: Dark Magician'));

    expect(slot('Page 1, slot 1, empty')).toBeTruthy();
    expect(
      within(screen.getByRole('list', { name: 'Printing' })).getByText('LOB-EN005'),
    ).toBeTruthy();
    expect((screen.getByRole('combobox', { name: 'Condition' }) as HTMLSelectElement).value).toBe(
      'Lightly Played',
    );
  });

  it('keeps swapped copies in their new pockets when the app is opened again', async () => {
    saveBinderWith({
      0: savedPlayedSdyDarkMagician,
      1: savedDarkMagician,
    });
    const first = openApp();
    moveCopyWithMouse(slot('Page 1, slot 1: Dark Magician'), slot('Page 1, slot 2: Dark Magician'));
    first.close();

    const second = openApp();

    expect([
      await detailOf(second.user, slot('Page 1, slot 1: Dark Magician')),
      await detailOf(second.user, slot('Page 1, slot 2: Dark Magician')),
    ]).toEqual([
      { printing: 'LOB-EN005', condition: 'Near Mint' },
      { printing: 'SDY-006', condition: 'Lightly Played' },
    ]);
  });

  it('leaves the other 358 pockets as they were after a swap', () => {
    const slots = saveBinderWith({
      0: savedDarkMagician,
      1: { ...savedDarkMagician, condition: 'Damaged' },
      200: { ...savedDarkMagician, condition: 'Heavily Played' },
    });
    const first = openApp();

    moveCopyWithMouse(slot('Page 1, slot 1: Dark Magician'), slot('Page 1, slot 2: Dark Magician'));
    first.close();

    const shelf = loadShelf();
    const saved = shelf.binders[shelf.activeIndex].binder.slots;
    expect(saved).toHaveLength(360);
    expect(saved.slice(2)).toEqual(slots.slice(2));
  });

  it('keeps a replaced copy gone when the app is opened again', async () => {
    const first = await openPotOfGreedOverDarkMagician();
    dragPrintingWithMouse(
      screen.getByRole('button', { name: /LOB-EN119/ }),
      slot('Page 1, slot 1: Dark Magician'),
    );
    first.close();

    const second = openApp();

    expect([
      screen.queryAllByRole('button', { name: /: Dark Magician$/ }),
      await detailOf(second.user, slot('Page 1, slot 1: Pot of Greed')),
    ]).toEqual([[], { printing: 'LOB-EN119', condition: 'Near Mint' }]);
  });

  it('starts with an empty binder when the saved binder is unreadable', () => {
    localStorage.setItem(SAVED_BINDER_KEY, '{not json');

    openApp();

    expect(screen.getAllByRole('button', { name: /, empty$/ })).toHaveLength(9);
  });

  it('restores a saved binder of 360 slots', () => {
    saveBinderWith({ 0: savedDarkMagician });

    openApp();

    expect(slot('Page 1, slot 1: Dark Magician')).toBeTruthy();
  });

  it('starts with an empty binder when the saved binder has too few slots', () => {
    localStorage.setItem(SAVED_BINDER_KEY, JSON.stringify({ slots: [savedDarkMagician] }));

    openApp();

    expect(slot('Page 1, slot 1, empty')).toBeTruthy();
  });

  it('starts with an empty binder when a saved copy has an unknown condition', () => {
    saveBinderWith({ 0: { ...savedDarkMagician, condition: 'Mint' } });

    openApp();

    expect(slot('Page 1, slot 1, empty')).toBeTruthy();
  });

  it.each([
    ['card passcode', { passcode: '46986414' }],
    ['card name', { name: { en: 'Dark Magician' } }],
    ['card kind', { kind: 1 }],
    ['card type', { type: { en: 'Normal Monster' } }],
    ['card text', { text: { en: 'The ultimate wizard' } }],
    ['card printings', { printings: 'LOB-EN005' }],
    ['monster stats', { monster: 'DARK' }],
    ['monster ATK', { monster: { ...darkMagician.monster, atk: { v: 2500 } } }],
  ])(
    "starts with an empty binder when a saved copy's %s has the wrong type",
    (_field, cardChange) => {
      saveBinderWith({
        0: { ...savedDarkMagician, card: { ...darkMagician, ...cardChange } },
      });

      openApp();

      expect(slot('Page 1, slot 1, empty')).toBeTruthy();
    },
  );

  it.each([
    ['set code', { setCode: 5 }],
    ['set name', { setName: { en: 'Legend of Blue Eyes' } }],
    ['rarity', { rarity: null }],
  ])(
    "starts with an empty binder when a saved printing's %s has the wrong type",
    (_field, printingChange) => {
      saveBinderWith({
        0: {
          ...savedDarkMagician,
          printing: { ...darkMagician.printings[0], ...printingChange },
        },
      });

      openApp();

      expect(slot('Page 1, slot 1, empty')).toBeTruthy();
    },
  );

  it('still places cards when the browser refuses storage', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError');
    });
    const { user } = openApp();

    await placeDarkMagicianInFirstSlot(user);

    expect(slot('Page 1, slot 1: Dark Magician')).toBeTruthy();
  });
});
