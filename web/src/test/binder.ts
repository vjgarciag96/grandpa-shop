import { screen, within } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { darkMagician, potOfGreed } from './fakeCatalogue';

/** Where the app keeps the binder in this browser. */
export const SAVED_BINDER_KEY = 'grandpa-shop.dev-binder.v1';
export const OPEN_BINDER_KEY = 'grandpa-shop.open-binder.v1';

/** Dark Magician LOB-EN005 in Near Mint, as the saved binder stores a copy. */
export const savedDarkMagician = {
  card: darkMagician,
  printing: darkMagician.printings[0],
  condition: 'Near Mint',
};

/** Dark Magician SDY-006 in Lightly Played, as the saved binder stores a copy. */
export const savedPlayedSdyDarkMagician = {
  card: darkMagician,
  printing: darkMagician.printings[1],
  condition: 'Lightly Played',
};

/** Pot of Greed LOB-EN119 in Near Mint, as the saved binder stores a copy. */
export const savedPotOfGreed = {
  card: potOfGreed,
  printing: potOfGreed.printings[0],
  condition: 'Near Mint',
};

/** Saves a binder of 360 slots holding the given copies, keyed by slot index from 0, and returns its slots. */
export function saveBinderWith(copies: Record<number, unknown>): unknown[] {
  const slots: unknown[] = Array(360).fill(null);
  for (const [index, copy] of Object.entries(copies)) {
    slots[Number(index)] = copy;
  }
  localStorage.setItem(SAVED_BINDER_KEY, JSON.stringify({ slots }));
  return slots;
}

/** Opens a pocket's detail, reads its one printing and its condition, and closes it again. */
export async function detailOf(user: ReturnType<typeof userEvent.setup>, pocket: HTMLElement) {
  await user.click(pocket);
  const dialog = within(screen.getByRole('dialog'));
  const shown = {
    printing: within(dialog.getByRole('list', { name: 'Printing' })).getAllByRole('listitem')[0]
      .textContent,
    condition: dialog.getByRole<HTMLSelectElement>('combobox', {
      name: 'Condition',
    }).value,
  };
  await user.click(dialog.getByRole('button', { name: 'Close' }));
  return shown;
}
