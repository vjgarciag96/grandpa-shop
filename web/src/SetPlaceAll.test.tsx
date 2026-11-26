import { fireEvent, screen, within } from '@testing-library/react';
import type userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { openApp, openCatalogueResult, openSet } from './test/app';
import { detailOf, saveBinderWith, savedPotOfGreed } from './test/binder';

type User = ReturnType<typeof userEvent.setup>;

const panel = () => screen.getByRole('complementary', { name: 'Catalogue' });
const panelTitle = () => within(panel()).getByRole('heading', { level: 2 }).textContent;
const catalogueStatus = () =>
  panel().querySelector('.catalogue__announcement')?.textContent?.trim();
const pocket = (name: string) => screen.getByRole('button', { name });
const toggle = (name: string) =>
  within(screen.getByRole('group', { name: 'Rarity' })).getByRole('button', { name });
const placeAll = (count: number) =>
  within(panel()).getByRole('button', { name: `Place all ${count}` });

const openLostMillennium = (openPanel?: (user: User) => Promise<void>) =>
  openSet('lost', /The Lost Millennium/, openPanel);

async function chooseSuperAndUltra(user: User) {
  await user.click(toggle('Super Rare 1'));
  await user.click(toggle('Ultra Rare 1'));
}

it('offers to place the two printings the Super and Ultra Rares leave', async () => {
  const user = await openLostMillennium();

  await chooseSuperAndUltra(user);

  expect(placeAll(2)).toBeTruthy();
});

it('offers to place all five printings while no rarity is chosen', async () => {
  await openLostMillennium();

  expect(placeAll(5)).toBeTruthy();
});

it('fills page 1 slots 1 and 2 with the listed printings in set-code order', async () => {
  const user = await openLostMillennium();
  await chooseSuperAndUltra(user);

  await user.click(placeAll(2));

  expect(pocket('Page 1, slot 1: Silver Sentinel')).toBeTruthy();
  expect(pocket('Page 1, slot 2: Golden Idol')).toBeTruthy();
});

it('files each listed printing as a Near Mint copy', async () => {
  const user = await openLostMillennium();
  await chooseSuperAndUltra(user);
  await user.click(placeAll(2));

  const shown = await detailOf(user, pocket('Page 1, slot 2: Golden Idol'));

  expect(shown).toEqual({ printing: 'TLM-EN004', condition: 'Near Mint' });
});

it('announces the first and last slot of the run in the catalogue', async () => {
  const user = await openLostMillennium();
  await chooseSuperAndUltra(user);

  await user.click(placeAll(2));

  expect(catalogueStatus()).toBe('Placed 2 printings from page 1, slot 1 to page 1, slot 2.');
});

it('keeps the set open with the same rarities chosen after placing', async () => {
  const user = await openLostMillennium();
  await chooseSuperAndUltra(user);

  await user.click(placeAll(2));

  expect(placeAll(2)).toBeTruthy();
});

/** Opens the set from a target on the empty page 1, slot 5, with Pot of Greed in slot 6, and chooses two rarities. */
async function targetSlot5BesidePotOfGreed() {
  saveBinderWith({ 5: savedPotOfGreed });
  const user = await openLostMillennium((user) => user.click(pocket('Page 1, slot 5, empty')));
  await chooseSuperAndUltra(user);
  return user;
}

it('starts at the targeted slot 5 and skips the filled slot 6, which keeps its copy', async () => {
  const user = await targetSlot5BesidePotOfGreed();

  await user.click(placeAll(2));

  expect([
    pocket('Page 1, slot 5: Silver Sentinel'),
    pocket('Page 1, slot 6: Pot of Greed'),
    pocket('Page 1, slot 7: Golden Idol'),
  ]).toHaveLength(3);
});

it('clears the target after placing from it', async () => {
  const user = await targetSlot5BesidePotOfGreed();

  await user.click(placeAll(2));

  expect(panelTitle()).toBe('Add cards');
});

it('starts at page 2, slot 1 on the spread of pages 2 and 3', async () => {
  const user = await openLostMillennium();
  await chooseSuperAndUltra(user);
  await user.click(screen.getByRole('button', { name: 'Next spread' }));

  await user.click(placeAll(2));

  expect(
    await screen.findByRole('button', { name: 'Page 2, slot 1: Silver Sentinel' }),
  ).toBeTruthy();
});

it("places nothing while a copy's detail is open", async () => {
  saveBinderWith({ 0: savedPotOfGreed });
  const user = await openLostMillennium();
  await user.click(pocket('Page 1, slot 1: Pot of Greed'));

  fireEvent.click(placeAll(5));

  expect(pocket('Page 1, slot 2, empty')).toBeTruthy();
});

it('lets go of a held printing and starts at page 1, slot 1', async () => {
  const user = await openLostMillennium();
  await user.click(screen.getByRole('button', { name: /TLM-EN001/ }));
  await chooseSuperAndUltra(user);

  await user.click(placeAll(2));

  expect(panelTitle()).toBe('Add cards');
  expect(pocket('Page 1, slot 1: Silver Sentinel')).toBeTruthy();
});

it("offers no Place all over a card's printings from a name search", async () => {
  const { user } = openApp();

  await openCatalogueResult(user, 'dark magician', /Dark Magician/);

  await within(panel()).findByRole('list', { name: 'Printings' });
  expect(within(panel()).queryByRole('button', { name: /Place all/ })).toBe(null);
});
