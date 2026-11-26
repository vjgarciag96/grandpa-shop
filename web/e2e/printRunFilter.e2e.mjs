import assert from 'node:assert/strict';
import { test } from 'node:test';
import { withBuiltApp } from './builtSite.mjs';

const SET_NAME = 'Legend of Blue Eyes White Dragon';

/**
 * Legend of Blue Eyes White Dragon's three print runs as YGOPRODeck lists them: LOB- with 126 printings, LOB-E with
 * 103, and LOB-EN with 129, 358 in all. Number 001 of every run is Blue-Eyes White Dragon.
 */
const RUNS = [
  { run: 'LOB-', size: 126 },
  { run: 'LOB-E', size: 103 },
  { run: 'LOB-EN', size: 129 },
];

/** Numbers 001, 005, 010, 020, and 105 are Ultra Rare, 002 and 003 Rare, the rest Common; LOB-E stops before 105. */
function rarityOf(number) {
  if ([1, 5, 10, 20, 105].includes(number)) return 'Ultra Rare';
  if ([2, 3].includes(number)) return 'Rare';
  return 'Common';
}

/** The same number in every run prints the same card, as Blue-Eyes White Dragon is LOB-001, LOB-E001, and LOB-EN001. */
const printings = RUNS.flatMap(({ run, size }) =>
  Array.from({ length: size }, (_, index) => ({
    setCode: `${run}${String(index + 1).padStart(3, '0')}`,
    rarity: rarityOf(index + 1),
    passcode: 30000001 + index,
  })),
);
const cards = Array.from({ length: 129 }, (_, index) => ({
  passcode: 30000001 + index,
  name: index === 0 ? 'Blue-Eyes White Dragon' : `Card ${index + 1}`,
  kind: 'Monster',
  type: 'Normal Monster',
  text: 'A card from Legend of Blue Eyes White Dragon.',
  printings: printings
    .filter(({ passcode }) => passcode === 30000001 + index)
    .map(({ setCode, rarity }) => ({ setCode, setName: SET_NAME, rarity })),
}));

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`offers the LOB-, LOB-E, and LOB-EN print runs of Legend of Blue Eyes White Dragon at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLegendOfBlueEyes, async (page) => {
      const panel = await openLegendOfBlueEyes(page);

      const toggles = await toggleNames(panel, 'Print run');

      assert.deepEqual(toggles, ['LOB- 126', 'LOB-E 103', 'LOB-EN 129']);
    });
  });

  test(`lists the 129 LOB-EN printings, Blue-Eyes White Dragon only as LOB-EN001, at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLegendOfBlueEyes, async (page) => {
      const panel = await openLegendOfBlueEyes(page);

      await chooseLobEn(panel);

      assert.equal(await printingRows(panel).count(), 129, 'the LOB-EN printings are listed');
      assert.equal(
        await printingRows(panel)
          .filter({ hasNotText: /^LOB-EN\d{3}/ })
          .count(),
        0,
        'every listed printing is LOB-EN',
      );
      assert.deepEqual(
        await printingRows(panel)
          .filter({ hasText: 'Blue-Eyes White Dragon' })
          .locator('strong')
          .allTextContents(),
        ['LOB-EN001'],
      );
      assert.equal(
        await panel.getByRole('button', { name: 'Place all 129', exact: true }).count(),
        1,
        'Place all files the 129 listed printings',
      );
    });
  });

  test(`narrows LOB-EN to its 5 Ultra Rares and recounts both groups at ${viewport.width} px`, async () => {
    await withBuiltApp(viewport, serveLegendOfBlueEyes, async (page) => {
      const panel = await openLegendOfBlueEyes(page);
      await chooseLobEn(panel);

      await panel
        .getByRole('group', { name: 'Rarity' })
        .getByRole('button', { name: 'Ultra Rare 5', exact: true })
        .click();

      await filterCount(panel).filter({ hasText: '5 of 358 printings' }).waitFor();
      assert.equal(await printingRows(panel).count(), 5, 'the LOB-EN Ultra Rares are listed');
      assert.deepEqual(await toggleNames(panel, 'Rarity'), [
        'Common 122',
        'Rare 2',
        'Ultra Rare 5',
      ]);
      assert.deepEqual(await toggleNames(panel, 'Print run'), ['LOB- 5', 'LOB-E 4', 'LOB-EN 5']);
    });
  });
}

test('places the 129 LOB-EN printings from page 1, slot 1 to page 15, slot 3', async () => {
  await withBuiltApp({ width: 1440, height: 900 }, serveLegendOfBlueEyes, async (page) => {
    const panel = await openLegendOfBlueEyes(page);
    await chooseLobEn(panel);

    await panel.getByRole('button', { name: 'Place all 129', exact: true }).click();

    await page
      .getByRole('button', { name: 'Page 1, slot 1: Blue-Eyes White Dragon', exact: true })
      .waitFor();
    assert.equal(
      (
        await panel
          .getByRole('status')
          .filter({ hasText: /^Placed / })
          .textContent()
      ).trim(),
      'Placed 129 printings from page 1, slot 1 to page 15, slot 3.',
    );
  });
});

const printingRows = (panel) => panel.getByRole('list', { name: 'Printings' }).getByRole('button');

/** The count of printings the chosen filters leave, under the filter groups. */
const filterCount = (panel) => panel.locator('.catalogue__filters').getByRole('status');

/** The toggles of the filter group named `label`, pressed or not, as their text reads. */
const toggleNames = (panel, label) =>
  panel.getByRole('group', { name: label }).locator('[aria-pressed]').allTextContents();

async function chooseLobEn(panel) {
  await panel
    .getByRole('group', { name: 'Print run' })
    .getByRole('button', { name: 'LOB-EN 129', exact: true })
    .click();
  await filterCount(panel).filter({ hasText: '129 of 358 printings' }).waitFor();
}

async function openLegendOfBlueEyes(page) {
  await page.getByRole('button', { name: 'Binder 1', exact: true }).click();
  await page.getByRole('button', { name: 'Add cards', exact: true }).click();
  const panel = page.getByRole('complementary', { name: 'Catalogue' });
  await panel.getByRole('searchbox', { name: 'Search cards and sets' }).fill('legend');
  await panel.getByRole('button', { name: /Legend of Blue Eyes White Dragon/ }).click();
  await panel.getByRole('group', { name: 'Print run' }).waitFor();
  return panel;
}

function serveLegendOfBlueEyes(route, origin) {
  const url = new URL(route.request().url());
  if (url.origin !== origin.origin) return route.abort();
  if (url.pathname === '/api/sets') {
    const sets = url.searchParams.get('q')?.toLowerCase().includes('legend')
      ? [{ name: SET_NAME, prefix: 'LOB', printings: 358 }]
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
