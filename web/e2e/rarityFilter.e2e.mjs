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

      await filterCount(panel).filter({ hasText: '11 of 85 printings' }).waitFor();
      assert.equal(await printingRows(panel).count(), 11, 'the Super and Ultra Rares are listed');
    });
  });

  test(`places the 11 Super and Ultra Rares from page 1, slot 1 in set-code order at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLostMillennium, async (page) => {
      const panel = await openLostMillennium(page);
      await chooseSuperAndUltra(panel);

      await panel.getByRole('button', { name: 'Place all 11', exact: true }).click();

      await pocketNamed(page, 1, 9, 'Card TLM-EN058').waitFor();
      assert.deepEqual(await pocketNames(page, 1), [
        'Page 1, slot 1: Card TLM-EN050',
        'Page 1, slot 2: Card TLM-EN051',
        'Page 1, slot 3: Card TLM-EN052',
        'Page 1, slot 4: Card TLM-EN053',
        'Page 1, slot 5: Card TLM-EN054',
        'Page 1, slot 6: Card TLM-EN055',
        'Page 1, slot 7: Card TLM-EN056',
        'Page 1, slot 8: Card TLM-EN057',
        'Page 1, slot 9: Card TLM-EN058',
      ]);
      assert.equal(
        (
          await panel
            .getByRole('status')
            .filter({ hasText: /^Placed / })
            .textContent()
        ).trim(),
        'Placed 11 printings from page 1, slot 1 to page 2, slot 2.',
      );
      await turnToPages2And3(page);
      assert.deepEqual((await pocketNames(page, 2)).slice(0, 2), [
        'Page 2, slot 1: Card TLM-EN059',
        'Page 2, slot 2: Card TLM-EN060',
      ]);
      assert.equal(
        await page.getByRole('button', { name: /^Page [23], slot \d+, empty$/ }).count(),
        16,
        'page 2 slots 3–9 and all of page 3 stay empty',
      );
    });
  });

  test(`keeps the 11 placed Super and Ultra Rares in their pockets after a reload at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLostMillennium, async (page) => {
      const panel = await openLostMillennium(page);
      await chooseSuperAndUltra(panel);
      await panel.getByRole('button', { name: 'Place all 11', exact: true }).click();
      await pocketNamed(page, 1, 9, 'Card TLM-EN058').waitFor();

      await page.reload();

      await page.getByRole('button', { name: 'Binder 1', exact: true }).click();
      await pocketNamed(page, 1, 9, 'Card TLM-EN058').waitFor();
      assert.deepEqual(await pocketNames(page, 1), [
        'Page 1, slot 1: Card TLM-EN050',
        'Page 1, slot 2: Card TLM-EN051',
        'Page 1, slot 3: Card TLM-EN052',
        'Page 1, slot 4: Card TLM-EN053',
        'Page 1, slot 5: Card TLM-EN054',
        'Page 1, slot 6: Card TLM-EN055',
        'Page 1, slot 7: Card TLM-EN056',
        'Page 1, slot 8: Card TLM-EN057',
        'Page 1, slot 9: Card TLM-EN058',
      ]);
      await turnToPages2And3(page);
      assert.deepEqual((await pocketNames(page, 2)).slice(0, 3), [
        'Page 2, slot 1: Card TLM-EN059',
        'Page 2, slot 2: Card TLM-EN060',
        'Page 2, slot 3, empty',
      ]);
    });
  });

  test(`keeps the filter count where screen readers hear it before any rarity is chosen at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLostMillennium, async (page) => {
      const panel = await openLostMillennium(page);

      const status = filterCount(panel);

      assert.equal(await status.count(), 1, 'the empty count is a live region already');
    });
  });

  test(`offers no print run group over The Lost Millennium's single print run at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLostMillennium, async (page) => {
      const panel = await openLostMillennium(page);

      const printRun = panel.getByRole('group', { name: 'Print run' });

      assert.equal(await printRun.count(), 0, 'every printing is in the TLM-EN print run');
    });
  });

  test(`shows all 85 printings of The Lost Millennium again after Clear at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLostMillennium, async (page) => {
      const panel = await openLostMillennium(page);
      const rarity = panel.getByRole('group', { name: 'Rarity' });
      await rarity.getByRole('button', { name: 'Super Rare 7', exact: true }).click();
      await rarity.getByRole('button', { name: 'Ultra Rare 4', exact: true }).click();
      await filterCount(panel).filter({ hasText: '11 of 85 printings' }).waitFor();

      await rarity.getByRole('button', { name: 'Clear', exact: true }).click();

      await rarity
        .getByRole('button', { name: 'Clear', exact: true })
        .waitFor({ state: 'detached' });
      assert.equal(await printingRows(panel).count(), 85, 'every printing is listed');
    });
  });
}

test('keeps the catalogue open as a bottom sheet after placing the 11 Super and Ultra Rares at 390 px', async () => {
  await withBuiltApp({ width: 390, height: 844 }, serveLostMillennium, async (page) => {
    const panel = await openLostMillennium(page);
    await chooseSuperAndUltra(panel);

    await panel.getByRole('button', { name: 'Place all 11', exact: true }).click();

    await pocketNamed(page, 1, 9, 'Card TLM-EN058').waitFor();
    assert.equal(await page.locator('.catalogue--sheet').isVisible(), true, 'the sheet is open');
    assert.equal(await printingRows(panel).count(), 11, 'the sheet still lists the 11 printings');
  });
});

/** The count of printings the chosen filters leave, under the filter groups. */
const filterCount = (panel) => panel.locator('.catalogue__filters').getByRole('status');

const printingRows = (panel) => panel.getByRole('list', { name: 'Printings' }).getByRole('button');

async function chooseSuperAndUltra(panel) {
  const rarity = panel.getByRole('group', { name: 'Rarity' });
  await rarity.getByRole('button', { name: 'Super Rare 7', exact: true }).click();
  await rarity.getByRole('button', { name: 'Ultra Rare 4', exact: true }).click();
  await filterCount(panel).filter({ hasText: '11 of 85 printings' }).waitFor();
}

const pocketNamed = (page, number, slot, card) =>
  page.getByRole('button', { name: `Page ${number}, slot ${slot}: ${card}`, exact: true });

/** The names of the pockets on page `number`, in slot order. */
const pocketNames = (page, number) =>
  page
    .getByRole('region', { name: `Page ${number}`, exact: true })
    .getByRole('button')
    .evaluateAll((pockets) => pockets.map((pocket) => pocket.getAttribute('aria-label')));

async function turnToPages2And3(page) {
  await page.getByRole('button', { name: 'Next spread', exact: true }).click();
  await page.getByRole('region', { name: 'Page 3', exact: true }).waitFor();
}

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
