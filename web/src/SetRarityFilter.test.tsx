import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import App from './App';
import { darkMagician, fakeCatalogue, lostMillennium, potOfGreed } from './test/fakeCatalogue';

type User = ReturnType<typeof userEvent.setup>;

const rarityGroup = () => screen.getByRole('group', { name: 'Rarity' });
const toggle = (name: string) => within(rarityGroup()).getByRole('button', { name });
const printingRows = () =>
  within(screen.getByRole('list', { name: 'Printings' })).getAllByRole('button');
const shownSetCodes = () => printingRows().map((row) => row.querySelector('strong')?.textContent);

/** Opens the catalogue from "Add cards", searches for `query`, and opens the set result named `set`. */
async function openSet(query: string, set: RegExp) {
  render(
    <App catalogue={fakeCatalogue([darkMagician, potOfGreed, ...lostMillennium]).catalogue} />,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Add cards' }));
  await user.type(screen.getByRole('searchbox', { name: 'Search cards and sets' }), query);
  await user.click(await screen.findByRole('button', { name: set }));
  await screen.findByRole('list', { name: 'Printings' });
  return user;
}

const openLostMillennium = () => openSet('lost', /The Lost Millennium/);

async function chooseSuperAndUltra(user: User) {
  await user.click(toggle('Super Rare 1'));
  await user.click(toggle('Ultra Rare 1'));
}

it('offers a rarity group over an opened set with several rarities', async () => {
  await openLostMillennium();

  const toggles = within(rarityGroup()).getAllByRole('button');

  expect(toggles.map((button) => button.textContent)).toEqual([
    'Common 2',
    'Rare 1',
    'Super Rare 1',
    'Ultra Rare 1',
  ]);
});

it('lists only the chosen rarities in set-code order', async () => {
  const user = await openLostMillennium();

  await chooseSuperAndUltra(user);

  expect(shownSetCodes()).toEqual(['TLM-EN002', 'TLM-EN004']);
});

it('marks the chosen rarities as pressed', async () => {
  const user = await openLostMillennium();

  await chooseSuperAndUltra(user);

  expect(
    within(rarityGroup())
      .getAllByRole('button', { pressed: true })
      .map((button) => button.textContent),
  ).toEqual(['Super Rare 1', 'Ultra Rare 1']);
});

it('announces how many printings the chosen rarities leave', async () => {
  const user = await openLostMillennium();

  await chooseSuperAndUltra(user);

  expect(within(rarityGroup()).getByRole('status').textContent).toBe('2 of 5 printings');
});

it('says nothing about the count while no rarity is chosen', async () => {
  await openLostMillennium();

  expect(within(rarityGroup()).getByRole('status').textContent).toBe('');
});

it('shows every printing again after clearing the chosen rarities', async () => {
  const user = await openLostMillennium();
  await chooseSuperAndUltra(user);

  await user.click(toggle('Clear'));

  expect(shownSetCodes()).toEqual([
    'TLM-EN001',
    'TLM-EN002',
    'TLM-EN003',
    'TLM-EN004',
    'TLM-EN005',
  ]);
});

it('moves focus to the first rarity after clearing, as Clear goes away', async () => {
  const user = await openLostMillennium();
  await chooseSuperAndUltra(user);

  await user.click(toggle('Clear'));

  expect(document.activeElement).toBe(toggle('Common 2'));
  expect(within(rarityGroup()).queryByRole('button', { name: 'Clear' })).toBe(null);
});

it('offers no Clear while no rarity is chosen', async () => {
  await openLostMillennium();

  expect(within(rarityGroup()).queryByRole('button', { name: 'Clear' })).toBe(null);
});

it('reopens a set with every printing and no rarity chosen after going back', async () => {
  const user = await openLostMillennium();
  await chooseSuperAndUltra(user);
  await user.click(screen.getByRole('button', { name: 'Back to results' }));

  await user.click(await screen.findByRole('button', { name: /The Lost Millennium/ }));

  await screen.findByRole('list', { name: 'Printings' });
  expect(within(rarityGroup()).queryAllByRole('button', { pressed: true })).toEqual([]);
  expect(printingRows()).toHaveLength(5);
});

it('keeps holding a printing the chosen rarities hide', async () => {
  const user = await openLostMillennium();
  await user.click(screen.getByRole('button', { name: /TLM-EN001/ }));

  await user.click(toggle('Super Rare 1'));

  expect(
    within(screen.getByRole('complementary', { name: 'Catalogue' })).getByRole('heading', {
      level: 2,
    }).textContent,
  ).toBe('Holding TLM-EN001');
});

it('places a printing the chosen rarities hide in an empty slot', async () => {
  const user = await openLostMillennium();
  await user.click(screen.getByRole('button', { name: /TLM-EN001/ }));
  await user.click(toggle('Super Rare 1'));

  await user.click(screen.getByRole('button', { name: 'Page 1, slot 1, empty' }));

  expect(screen.getByRole('button', { name: 'Page 1, slot 1: Ancient Sphinx' })).toBeTruthy();
});

it('offers Rare and Ultra Rare over Legend of Blue Eyes White Dragon', async () => {
  await openSet('legend', /Legend of Blue Eyes White Dragon/);

  const toggles = within(rarityGroup()).getAllByRole('button');

  expect(toggles.map((button) => button.textContent)).toEqual(['Rare 1', 'Ultra Rare 1']);
});

it('offers no rarity group over a set with a single rarity', async () => {
  await openSet('starter deck', /Starter Deck: Yugi/);

  expect(screen.queryByRole('group', { name: 'Rarity' })).toBe(null);
});
