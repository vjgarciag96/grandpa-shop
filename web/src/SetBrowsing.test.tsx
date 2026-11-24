import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import App from './App';
import { fakeCatalogue } from './test/fakeCatalogue';

const setResult = () =>
  screen.findByRole('button', {
    name: /Legend of Blue Eyes White Dragon.*LOB.*2 printings/,
  });

async function searchForSet(catalogue = fakeCatalogue().catalogue, query = 'legend') {
  render(<App catalogue={catalogue} />);
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Add cards' }));
  await user.type(screen.getByRole('searchbox', { name: 'Search cards and sets' }), query);
  return user;
}

it('opens a set by name with all of its printings in set-code order', async () => {
  const user = await searchForSet();

  await user.click(await setResult());

  const printings = within(await screen.findByRole('list', { name: 'Printings' }));
  expect(printings.getAllByRole('button')).toEqual([
    printings.getByRole('button', {
      name: /LOB-EN005.*Ultra Rare.*Dark Magician/,
    }),
    printings.getByRole('button', { name: /LOB-EN119.*Rare.*Pot of Greed/ }),
  ]);
});

it('places the selected printing from a set when the card has other printings', async () => {
  const user = await searchForSet(fakeCatalogue().catalogue, 'starter deck');
  await user.click(await screen.findByRole('button', { name: /Starter Deck: Yugi/ }));
  await user.click(await screen.findByRole('button', { name: /SDY-006/ }));
  await user.click(screen.getByRole('button', { name: 'Page 1, slot 1, empty' }));

  await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));

  const printing = within(screen.getByRole('list', { name: 'Printing' }));
  expect(printing.getByText('SDY-006')).toBeTruthy();
  expect(printing.getByText('Common')).toBeTruthy();
});

it('returns focus to the set result when going back', async () => {
  const user = await searchForSet();
  await user.click(await setResult());

  await user.click(screen.getByRole('button', { name: 'Back to results' }));

  expect(document.activeElement).toBe(await setResult());
});

it('retries loading a set after its printings fail to load', async () => {
  const { catalogue } = fakeCatalogue();
  vi.spyOn(catalogue, 'setPrintings').mockRejectedValueOnce(new Error('offline'));
  const user = await searchForSet(catalogue);
  await user.click(await setResult());

  await user.click(await screen.findByRole('button', { name: 'Try again' }));

  expect(await screen.findByRole('button', { name: /LOB-EN005/ })).toBeTruthy();
});

it('keeps card results available when the set search fails', async () => {
  const { catalogue } = fakeCatalogue();
  vi.spyOn(catalogue, 'searchSets').mockRejectedValue(new Error('offline'));

  await searchForSet(catalogue, 'dark');

  expect(await screen.findByRole('button', { name: /Dark Magician/ })).toBeTruthy();
});

it('lists matching sets before matching cards when searching by set prefix', async () => {
  await searchForSet(fakeCatalogue().catalogue, 'lob');

  await setResult();

  expect(
    within(screen.getByRole('complementary', { name: 'Catalogue' }))
      .getAllByRole('list')
      .map((list) => list.getAttribute('aria-label')),
  ).toEqual(['Matching sets', 'Matching cards']);
});

it('shows matching cards while the set search is still pending', async () => {
  const { catalogue } = fakeCatalogue();
  vi.spyOn(catalogue, 'searchSets').mockImplementation(() => new Promise(() => {}));

  await searchForSet(catalogue, 'dark');

  expect(await screen.findByRole('button', { name: /Dark Magician/ })).toBeTruthy();
});

it('shows matching sets while the card search is still pending', async () => {
  const { catalogue } = fakeCatalogue();
  vi.spyOn(catalogue, 'search').mockImplementation(() => new Promise(() => {}));

  await searchForSet(catalogue);

  expect(await setResult()).toBeTruthy();
});
