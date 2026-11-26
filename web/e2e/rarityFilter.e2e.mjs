import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withBuiltApp } from './builtSite.mjs';

const SET_NAME = 'The Lost Millennium';

/**
 * The Lost Millennium's mix of 85 printings in set-code order: 35 Common, 14 Rare, 7 Super Rare, 4 Ultra Rare,
 * and 25 Ultimate Rare, each printing a card of its own.
 */
const rarities = [
  ...Array(35).fill('Common'),
  ...Array(14).fill('Rare'),
  ...Array(7).fill('Super Rare'),
  ...Array(4).fill('Ultra Rare'),
  ...Array(25).fill('Ultimate Rare'),
];
const printings = rarities.map((rarity, index) => ({
  setCode: `TLM-EN${String(index + 1).padStart(3, '0')}`,
  rarity,
  passcode: 20000001 + index,
}));
const cards = printings.map(({ setCode, rarity, passcode }) => ({
  passcode,
  name: `Card ${setCode}`,
  kind: 'Monster',
  type: 'Effect Monster',
  text: 'A card from The Lost Millennium.',
  printings: [{ setCode, setName: SET_NAME, rarity }],
}));

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`narrows The Lost Millennium to its 11 Super and Ultra Rares at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLostMillennium, async (page) => {
      const panel = await openLostMillennium(page);
      const rarity = panel.getByRole('group', { name: 'Rarity' });

      await rarity.getByRole('button', { name: 'Super Rare 7', exact: true }).click();
      await rarity.getByRole('button', { name: 'Ultra Rare 4', exact: true }).click();

      await rarity.getByRole('status').filter({ hasText: '11 of 85 printings' }).waitFor();
      assert.equal(await printingRows(panel).count(), 11, 'the Super and Ultra Rares are listed');
    });
  });

  test(`keeps the rarity count where screen readers hear it before any rarity is chosen at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLostMillennium, async (page) => {
      const panel = await openLostMillennium(page);

      const status = panel.getByRole('group', { name: 'Rarity' }).getByRole('status');

      assert.equal(await status.count(), 1, 'the empty count is a live region already');
    });
  });

  test(`shows all 85 printings of The Lost Millennium again after Clear at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLostMillennium, async (page) => {
      const panel = await openLostMillennium(page);
      const rarity = panel.getByRole('group', { name: 'Rarity' });
      await rarity.getByRole('button', { name: 'Super Rare 7', exact: true }).click();
      await rarity.getByRole('button', { name: 'Ultra Rare 4', exact: true }).click();
      await rarity.getByRole('status').filter({ hasText: '11 of 85 printings' }).waitFor();

      await rarity.getByRole('button', { name: 'Clear', exact: true }).click();

      await rarity
        .getByRole('button', { name: 'Clear', exact: true })
        .waitFor({ state: 'detached' });
      assert.equal(await printingRows(panel).count(), 85, 'every printing is listed');
    });
  });
}

const printingRows = (panel) => panel.getByRole('list', { name: 'Printings' }).getByRole('button');

async function openLostMillennium(page) {
  await page.getByRole('button', { name: 'Binder 1', exact: true }).click();
  await page.getByRole('button', { name: 'Add cards', exact: true }).click();
  const panel = page.getByRole('complementary', { name: 'Catalogue' });
  await panel.getByRole('searchbox', { name: 'Search cards and sets' }).fill('lost');
  await panel.getByRole('button', { name: /The Lost Millennium/ }).click();
  await panel.getByRole('group', { name: 'Rarity' }).waitFor();
  return panel;
}

function serveLostMillennium(route, origin) {
  const url = new URL(route.request().url());
  if (url.origin !== origin.origin) return route.abort();
  if (url.pathname === '/api/sets') {
    const sets = url.searchParams.get('q')?.toLowerCase().includes('lost')
      ? [{ name: SET_NAME, prefix: 'TLM', printings: 85 }]
      : [];
    return route.fulfill({ json: { sets } });
  }
  if (url.pathname === '/api/sets/printings') {
    return route.fulfill({ json: { name: SET_NAME, cards, printings } });
  }
  if (url.pathname === '/api/cards') return route.fulfill({ json: { cards: [] } });
  if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 404 });
  return route.continue();
}
