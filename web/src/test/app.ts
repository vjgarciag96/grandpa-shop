import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import App from '../App';
import { saveBinderWith, savedPlayedSdyDarkMagician } from './binder';
import { darkMagician, fakeCatalogue, lostMillennium, potOfGreed } from './fakeCatalogue';
import { viewportWidth } from './media';

/** Renders the app on the fake catalogue with Binder 1 open, in a viewport `width` pixels wide when given. */
export function openApp(width?: number) {
  if (width !== undefined) viewportWidth(width);
  const view = render(createElement(App, { catalogue: fakeCatalogue().catalogue }));
  openFirstBinder();
  return { user: userEvent.setup(), close: view.unmount };
}

/** Opens Binder 1 from the shelf the app starts on. */
export function openFirstBinder() {
  fireEvent.click(screen.getByRole('button', { name: 'Binder 1' }));
}

export type User = ReturnType<typeof userEvent.setup>;

const addCards = (user: User) => user.click(screen.getByRole('button', { name: 'Add cards' }));

/**
 * Opens the catalogue with `openPanel` ("Add cards" unless given), searches for `query`, and opens the result named
 * `result`.
 */
export async function openCatalogueResult(
  user: User,
  query: string,
  result: RegExp,
  openPanel: (user: User) => Promise<void> = addCards,
) {
  await openPanel(user);
  await user.type(screen.getByRole('searchbox', { name: 'Search cards and sets' }), query);
  await user.click(await screen.findByRole('button', { name: result }));
}

/**
 * Renders the app on a catalogue with Dark Magician, Pot of Greed, and the five-printing The Lost Millennium, opens
 * Binder 1 and the catalogue with `openPanel` ("Add cards" unless given), searches for `query`, and opens the set
 * result named `set`.
 */
export async function openSet(
  query: string,
  set: RegExp,
  openPanel: (user: User) => Promise<void> = addCards,
) {
  render(
    createElement(App, {
      catalogue: fakeCatalogue([darkMagician, potOfGreed, ...lostMillennium]).catalogue,
    }),
  );
  openFirstBinder();
  const user = userEvent.setup();
  await openCatalogueResult(user, query, set, openPanel);
  await screen.findByRole('list', { name: 'Printings' });
  return user;
}

/** Opens The Lost Millennium from a "lost" search, opening the catalogue with `openPanel` when given. */
export const openLostMillennium = (openPanel?: (user: User) => Promise<void>) =>
  openSet('lost', /The Lost Millennium/, openPanel);

/** The rarity toggle named `name` in the opened set's Rarity group. */
export const rarityToggle = (name: string) =>
  within(screen.getByRole('group', { name: 'Rarity' })).getByRole('button', { name });

/** Chooses Super Rare and Ultra Rare in The Lost Millennium, which leaves TLM-EN002 and TLM-EN004 listed. */
export async function chooseSuperAndUltra(user: User) {
  await user.click(rarityToggle('Super Rare 1'));
  await user.click(rarityToggle('Ultra Rare 1'));
}

/**
 * Opens Pot of Greed in the catalogue over a binder whose page 1, slot 1 holds Dark Magician SDY-006 in Lightly Played,
 * plus any `alsoFiled` copies keyed by slot index from 0.
 */
export async function openPotOfGreedOverDarkMagician(
  width = 1200,
  alsoFiled: Record<number, unknown> = {},
) {
  saveBinderWith({ 0: savedPlayedSdyDarkMagician, ...alsoFiled });
  const app = openApp(width);
  await openCatalogueResult(app.user, 'pot', /Pot of Greed/);
  return app;
}
