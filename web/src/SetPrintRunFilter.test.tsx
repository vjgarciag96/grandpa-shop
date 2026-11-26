import { screen, within } from '@testing-library/react';
import { expect, it } from 'vitest';
import {
  filterCount,
  openApp,
  openCatalogueResult,
  openLegendOfBlueEyes,
  openLostMillennium,
  printRunToggle,
  rarityToggle,
  type User,
} from './test/app';

const panel = () => screen.getByRole('complementary', { name: 'Catalogue' });
const printRunGroup = () => screen.getByRole('group', { name: 'Print run' });
const toggleNames = (group: HTMLElement) =>
  within(group)
    .getAllByRole('button')
    .map((button) => button.textContent);
const printingRows = () =>
  within(screen.getByRole('list', { name: 'Printings' })).getAllByRole('button');
const shownSetCodes = () => printingRows().map((row) => row.querySelector('strong')?.textContent);
const pocket = (name: string) => screen.getByRole('button', { name });

/** Chooses LOB-EN in Legend of Blue Eyes White Dragon, which leaves LOB-EN001 to LOB-EN003 listed. */
const chooseLobEn = (user: User) => user.click(printRunToggle('LOB-EN 3'));

it('offers a print run group over a set with several print runs, in set-code order', async () => {
  await openLegendOfBlueEyes();

  const toggles = toggleNames(printRunGroup());

  expect(toggles).toEqual(['LOB- 3', 'LOB-E 2', 'LOB-EN 3']);
});

it('offers no print run group over a set with a single print run', async () => {
  await openLostMillennium();

  expect(screen.queryByRole('group', { name: 'Print run' })).toBe(null);
});

it("offers no print run group over a card's printings from a name search", async () => {
  const { user } = openApp();

  await openCatalogueResult(user, 'dark magician', /Dark Magician/);

  await within(panel()).findByRole('list', { name: 'Printings' });
  expect(screen.queryByRole('group', { name: 'Print run' })).toBe(null);
});

it('lists only the chosen print run, so Blue-Eyes White Dragon appears once as LOB-EN001', async () => {
  const user = await openLegendOfBlueEyes();

  await chooseLobEn(user);

  expect(shownSetCodes()).toEqual(['LOB-EN001', 'LOB-EN002', 'LOB-EN003']);
});

it('marks the chosen print run as pressed', async () => {
  const user = await openLegendOfBlueEyes();

  await chooseLobEn(user);

  expect(
    within(printRunGroup())
      .getAllByRole('button', { pressed: true })
      .map((button) => button.textContent),
  ).toEqual(['LOB-EN 3']);
});

it('offers to place the three printings the chosen print run leaves', async () => {
  const user = await openLegendOfBlueEyes();

  await chooseLobEn(user);

  expect(within(panel()).getByRole('button', { name: 'Place all 3' })).toBeTruthy();
});

it('files only the chosen print run, leaving page 1, slot 4 empty', async () => {
  const user = await openLegendOfBlueEyes();
  await chooseLobEn(user);

  await user.click(within(panel()).getByRole('button', { name: 'Place all 3' }));

  expect(pocket('Page 1, slot 1: Blue-Eyes White Dragon')).toBeTruthy();
  expect(pocket('Page 1, slot 2: Mystical Elf')).toBeTruthy();
  expect(pocket('Page 1, slot 3: Hitotsu-Me Giant')).toBeTruthy();
  expect(pocket('Page 1, slot 4, empty')).toBeTruthy();
});

it('shows Place all as unavailable when the chosen print run and rarity leave nothing', async () => {
  const user = await openLegendOfBlueEyes();
  await user.click(printRunToggle('LOB-E 2'));

  await user.click(rarityToggle('Rare 0'));

  expect(
    within(panel()).getByRole('button', { name: 'Place all 0' }).getAttribute('aria-disabled'),
  ).toBe('true');
});

it('counts the rarities within the chosen print run', async () => {
  const user = await openLegendOfBlueEyes();

  await chooseLobEn(user);

  expect(toggleNames(screen.getByRole('group', { name: 'Rarity' }))).toEqual([
    'Common 1',
    'Rare 1',
    'Ultra Rare 1',
  ]);
});

it('lists only the printings of both the chosen print run and the chosen rarity', async () => {
  const user = await openLegendOfBlueEyes();
  await chooseLobEn(user);

  await user.click(rarityToggle('Ultra Rare 1'));

  expect(shownSetCodes()).toEqual(['LOB-EN001']);
});

it('keeps every print run with its count within the chosen rarity, 0 when none is left', async () => {
  const user = await openLegendOfBlueEyes();

  await user.click(rarityToggle('Rare 1'));

  expect(toggleNames(printRunGroup())).toEqual(['LOB- 0', 'LOB-E 0', 'LOB-EN 1']);
});

it('announces how many printings the chosen print run leaves', async () => {
  const user = await openLegendOfBlueEyes();

  await chooseLobEn(user);

  expect(filterCount()).toBe('3 of 8 printings');
});

it('announces how many printings the chosen print run and rarity leave', async () => {
  const user = await openLegendOfBlueEyes();
  await chooseLobEn(user);

  await user.click(rarityToggle('Ultra Rare 1'));

  expect(filterCount()).toBe('1 of 8 printings');
});

it('keeps the chosen rarity after clearing the print runs', async () => {
  const user = await openLegendOfBlueEyes();
  await user.click(rarityToggle('Ultra Rare 3'));
  await user.click(printRunToggle('LOB-EN 1'));

  await user.click(printRunToggle('Clear'));

  expect(shownSetCodes()).toEqual(['LOB-001', 'LOB-E001', 'LOB-EN001']);
});

it('moves focus to the first print run after clearing, as Clear goes away', async () => {
  const user = await openLegendOfBlueEyes();
  await chooseLobEn(user);

  await user.click(printRunToggle('Clear'));

  expect(document.activeElement).toBe(printRunToggle('LOB- 3'));
  expect(within(printRunGroup()).queryByRole('button', { name: 'Clear' })).toBe(null);
});

it('reopens a set with no print run chosen after going back', async () => {
  const user = await openLegendOfBlueEyes();
  await chooseLobEn(user);
  await user.click(screen.getByRole('button', { name: 'Back to results' }));

  await user.click(await screen.findByRole('button', { name: /Legend of Blue Eyes White Dragon/ }));

  await screen.findByRole('list', { name: 'Printings' });
  expect(within(printRunGroup()).queryAllByRole('button', { pressed: true })).toEqual([]);
  expect(printingRows()).toHaveLength(8);
});
