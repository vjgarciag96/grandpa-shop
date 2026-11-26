import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { preview } from 'vite';

const darkMagician = {
  passcode: 46986414,
  name: 'Dark Magician',
  kind: 'Monster',
  type: 'Normal Monster',
  text: 'A Spellcaster.',
  monster: { attribute: 'DARK', race: 'Spellcaster', level: 7, atk: 2500, def: 2100 },
  printings: [
    {
      setCode: 'LOB-EN005',
      setName: 'Legend of Blue Eyes White Dragon',
      rarity: 'Ultra Rare',
    },
    {
      setCode: 'SDY-006',
      setName: 'Starter Deck Yugi',
      rarity: 'Ultra Rare',
    },
  ],
};

test('lands on the shelf after a reload and keeps the filed copy in the first pocket', async () => {
  await withBinder(async (page) => {
    await fileDarkMagician(page, 1, 1, 'LOB-EN005');

    await page.reload();

    assert.deepEqual(await shelfButtons(page), ['Binder 1', 'New binder']);
    assert.deepEqual(
      await descriptionOf(shelfList(page).getByRole('button', { name: 'Binder 1' })),
      { text: 'Last opened', visible: true },
      'the shelf marks Binder 1 as last opened',
    );
    assert.equal(await page.getByRole('region', { name: /^Page \d+$/ }).count(), 0);
    await openFromShelf(page, 'Binder 1');
    await pocket(page, 1, 1, 'Dark Magician').waitFor();
    const empty = page.getByRole('button', { name: /^Page 1, slot \d+, empty$/ });
    assert.equal(await empty.count(), 8, 'the first page has eight empty pockets');
  });
});

test('saves two binders independently and marks the last opened on the shelf', async () => {
  await withBinder(async (page) => {
    await fileDarkMagician(page, 1, 1, 'LOB-EN005');
    await pocket(page, 1, 3).click();

    await makeBinder(page, 'Trades');

    await page.getByRole('heading', { name: 'Trades', exact: true }).waitFor();
    await pocket(page, 1, 1).waitFor();
    const empty = page.getByRole('button', { name: /^Page 1, slot \d+, empty$/ });
    assert.equal(await empty.count(), 9, 'the new binder has nine empty pockets on page 1');
    assert.equal(await catalogue(page).count(), 0, 'the new binder has no catalogue target');
    await fileDarkMagician(page, 1, 1, 'SDY-006');
    await page.reload();

    assert.deepEqual(await shelfButtons(page), ['Binder 1', 'Trades', 'New binder']);
    assert.deepEqual(
      await descriptionOf(shelfList(page).getByRole('button', { name: 'Trades' })),
      { text: 'Last opened', visible: true },
      'the shelf marks the last opened binder',
    );
    await openFromShelf(page, 'Trades');
    await page.getByRole('heading', { name: 'Trades', exact: true }).waitFor();
    await showPrinting(page, 1, 1, 'SDY-006');
    await backToShelf(page);
    await openFromShelf(page, 'Binder 1');
    await showPrinting(page, 1, 1, 'LOB-EN005');
    await pocket(page, 1, 3).waitFor();
  });
});

test('refuses a blank or taken name for a new binder and closes with the keyboard', async () => {
  await withBinder(
    async (page) => {
      await page.getByRole('button', { name: 'New binder' }).click();
      const dialog = page.getByRole('dialog', { name: 'New binder' });
      const name = dialog.getByRole('textbox', { name: 'Binder name' });
      const create = dialog.getByRole('button', { name: 'Create binder' });

      await name.fill('  ');
      await create.click();
      assert.equal(await dialog.getByRole('alert').textContent(), 'Enter a binder name.');
      assert.deepEqual(await shelfButtons(page), ['Binder 1', 'New binder']);

      await name.fill('Binder 1');
      await create.click();
      assert.equal(
        await dialog.getByRole('alert').textContent(),
        'A binder already uses this name.',
      );
      assert.deepEqual(await shelfButtons(page), ['Binder 1', 'New binder']);

      await page.keyboard.press('Escape');
      assert.equal(await dialog.count(), 0, 'Escape closes New binder');
      assert.equal(
        await page
          .getByRole('button', { name: 'New binder' })
          .evaluate((button) => button === document.activeElement),
        true,
        'focus returns to New binder',
      );
    },
    { onShelf: true },
  );
});

test('keeps a migrated copy in its original pocket with its original condition', async () => {
  const legacySlots = Array(360).fill(null);
  legacySlots[22] = {
    card: darkMagician,
    printing: darkMagician.printings[1],
    condition: 'Lightly Played',
  };

  await withBinder(
    async (page) => {
      await page.getByRole('button', { name: 'Next spread' }).click();
      await showPrinting(page, 3, 5, 'SDY-006', 'Lightly Played');
      await makeBinder(page, 'Trades');

      await page.reload();

      await openFromShelf(page, 'Binder 1');
      await page.getByRole('region', { name: 'Page 1', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Next spread' }).click();
      await showPrinting(page, 3, 5, 'SDY-006', 'Lightly Played');
    },
    { legacySlots },
  );
});

test('creates a binder without duplicating a large legacy binder in storage', async () => {
  const copy = {
    card: { ...darkMagician, text: 'A'.repeat(7_600) },
    printing: darkMagician.printings[0],
    condition: 'Near Mint',
  };

  await withBinder(
    async (page) => {
      await pocket(page, 1, 9, 'Dark Magician').waitFor();

      await makeBinder(page, 'Trades');

      await page.reload();
      await openFromShelf(page, 'Trades');
      await page.getByText('Trades', { exact: true }).waitFor();
      await pocket(page, 1, 9).waitFor();
      await backToShelf(page);
      await openFromShelf(page, 'Binder 1');
      await pocket(page, 1, 9, 'Dark Magician').waitFor();
    },
    { legacySlots: Array(360).fill(copy) },
  );
});

test("returns to the shelf and focuses the binder's spine", async () => {
  await withBinder(async (page) => {
    await page.getByRole('button', { name: 'Next spread' }).click();
    await page.getByRole('region', { name: 'Page 2', exact: true }).waitFor();

    const shelf = await backToShelf(page);

    assert.equal(
      await shelf
        .getByRole('button', { name: 'Binder 1' })
        .evaluate((button) => button === document.activeElement),
      true,
      'focus is on the Binder 1 spine',
    );
    await page.keyboard.press('ArrowRight');
    assert.equal(
      await page.getByRole('region', { name: /^Page \d+$/ }).count(),
      0,
      'an arrow key on the shelf opens nothing',
    );
    await openFromShelf(page, 'Binder 1');
    await page.getByRole('region', { name: 'Page 1', exact: true }).waitFor();
  });
});

test('shows ten binders on one board when wide and on more boards when narrow', async (t) => {
  const savedBinders = Array.from({ length: 10 }, (_, index) => ({
    name: `Binder ${index + 1}`,
    binder: { capacity: { grid: 3, pages: 40 }, slots: Array(360).fill(null) },
  }));

  await withBinder(
    async (page) => {
      assert.equal((await shelfButtons(page)).length, 11, 'ten spines and New binder');
      const wideRows = await spineRows(page);
      assert.equal(wideRows, 1, 'all ten spines stand on one board at 1440px');
      assert.equal(await page.getByRole('button', { name: 'New binder' }).isVisible(), true);

      await page.setViewportSize({ width: 390, height: 844 });

      const narrowRows = await spineRows(page);
      assert.ok(narrowRows >= 2, `the spines wrap onto ${narrowRows} boards at 390px`);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      assert.ok(scrollWidth <= 390, `no horizontal scroll at 390px, observed ${scrollWidth}px`);
      assert.equal(await page.getByRole('button', { name: 'New binder' }).isVisible(), true);
      t.diagnostic(`Spine boards: ${wideRows} at 1440px, ${narrowRows} at 390px`);
    },
    { savedBinders, onShelf: true },
  );
});

test('keeps a binder created in one tab when another tab only switches binders', async () => {
  await withBinder(async (page) => {
    await makeBinder(page, 'Trades');
    const otherTab = await page.context().newPage();
    otherTab.setDefaultTimeout(5_000);
    await otherTab.goto(page.url());
    await otherTab.getByText('Trades', { exact: true }).waitFor();
    await makeBinder(page, 'Decks');

    await openFromShelf(otherTab, 'Binder 1');

    await page.reload();
    const shelf = shelfList(page);
    await shelf.getByRole('button', { name: 'Decks' }).waitFor();
    assert.deepEqual(
      await descriptionOf(shelf.getByRole('button', { name: 'Binder 1' })),
      { text: 'Last opened', visible: true },
      'the switch is saved without replacing the shelf contents',
    );
  });
});

test('creates one-, three-, and four-page binders with the chosen pocket grids', async () => {
  await withBinder(async (page) => {
    await makeBinder(page, 'Trades', { grid: '2', pages: '1' });
    await visiblePages(page, [1]);
    await expectPocketCount(page, 1, 4);
    await expectPocketColumns(page, 1, 2);
    assert.equal(await previousSpread(page).isDisabled(), true, 'there is no page before page 1');
    assert.equal(await nextSpread(page).isDisabled(), true, 'one page ends on the first spread');

    await makeBinder(page, 'Archive', { grid: '3', pages: '3' });
    await nextSpread(page).click();
    await visiblePages(page, [2, 3]);
    await expectPocketCount(page, 3, 9);
    await expectPocketColumns(page, 3, 3);
    assert.equal(await nextSpread(page).isDisabled(), true, 'three pages end on pages 2 and 3');

    await makeBinder(page, 'Showcase', { grid: '4', pages: '4' });
    await page.reload();

    await openFromShelf(page, 'Showcase');
    await expectPocketCount(page, 1, 16);
    await expectPocketColumns(page, 1, 4);
    await nextSpread(page).click();
    await nextSpread(page).click();
    await visiblePages(page, [4]);
    await expectPocketCount(page, 4, 16);
    assert.equal(await nextSpread(page).isDisabled(), true, 'four pages end on page 4');
    const lastPage = await pageRegion(page, 4).boundingBox();
    const spread = await page.getByTestId('spread').boundingBox();
    assert.ok(lastPage.x + lastPage.width < spread.x + spread.width / 2, 'page 4 is on the left');

    await backToShelf(page);
    await openFromShelf(page, 'Trades');
    await expectPocketCount(page, 1, 4);
    assert.equal(await nextSpread(page).isDisabled(), true, 'Trades still has one page');
  });
});

test('refuses to remove an occupied page and saves after the pocket is emptied', async () => {
  await withBinder(async (page) => {
    await makeBinder(page, 'Trades', { grid: '2', pages: '4' });
    await nextSpread(page).click();
    await nextSpread(page).click();
    await fileDarkMagician(page, 4, 2, 'LOB-EN005');

    const settings = await openSettings(page);
    await pagesField(settings).fill('3');
    await saveSettings(settings);
    assert.match(await settings.getByRole('alert').textContent(), /Page 4, slot 2 is occupied/);
    await settings.getByRole('button', { name: 'Close' }).click();
    await showPrinting(page, 4, 2, 'LOB-EN005');

    await removeDarkMagician(page, 4, 2);
    const unlocked = await openSettings(page);
    await pagesField(unlocked).fill('3');
    await saveSettings(unlocked);
    await visiblePages(page, [1]);
    assert.equal(
      await page
        .getByRole('button', { name: 'Binder settings' })
        .evaluate((button) => button === document.activeElement),
      true,
      'focus returns to settings after the binder reopens',
    );
    await nextSpread(page).click();
    await visiblePages(page, [2, 3]);
    assert.equal(await nextSpread(page).isDisabled(), true, 'the binder now ends on page 3');

    await saveSettings(await openSettings(page));
    await visiblePages(page, [2, 3]);
  });
});

test('refuses to remove an occupied pocket and keeps its other copies by page and pocket', async () => {
  await withBinder(async (page) => {
    await makeBinder(page, 'Trades', { grid: '4', pages: '3' });
    await fileDarkMagician(page, 1, 16, 'LOB-EN005');
    await closeCatalogue(page);
    await nextSpread(page).click();
    await fileDarkMagician(page, 3, 2, 'SDY-006');
    await pocket(page, 3, 2, 'Dark Magician').click();
    const detail = page.getByRole('dialog');
    await detail.getByRole('combobox', { name: 'Condition' }).selectOption('Lightly Played');
    await detail.getByRole('button', { name: 'Close' }).click();

    const settings = await openSettings(page);
    await gridField(settings).selectOption('2');
    await saveSettings(settings);
    assert.match(await settings.getByRole('alert').textContent(), /Page 1, slot 16 is occupied/);
    await settings.getByRole('button', { name: 'Close' }).click();

    await previousSpread(page).click();
    await expectPocketCount(page, 1, 16);
    await removeDarkMagician(page, 1, 16);
    const unlocked = await openSettings(page);
    await gridField(unlocked).selectOption('2');
    await saveSettings(unlocked);
    await page.reload();
    await openFromShelf(page, 'Trades');
    await expectPocketCount(page, 1, 4);
    await nextSpread(page).click();
    await expectPocketCount(page, 3, 4);
    await showPrinting(page, 3, 2, 'SDY-006', 'Lightly Played');

    await backToShelf(page);
    await openFromShelf(page, 'Binder 1');
    await expectPocketCount(page, 1, 9);
  });
});

test('rejects zero, fractional, and oversized page counts without saving', async () => {
  await withBinder(async (page) => {
    const settings = await openSettings(page);

    await tryInvalidPageCount(settings, '0');
    await tryInvalidPageCount(settings, '1.5');
    await tryInvalidPageCount(settings, '201');

    await settings.getByRole('button', { name: 'Close' }).click();
    const reopened = await openSettings(page);
    assert.equal(await pagesField(reopened).inputValue(), '40', 'the original 40 pages remain');
  });
});

test('lays out and files 4×4 pockets beside the catalogue and on a narrow screen', async (t) => {
  await withBinder(async (page) => {
    await makeBinder(page, 'Trades', { grid: '4', pages: '1' });
    await page.setViewportSize({ width: 995, height: 900 });
    await page.getByRole('button', { name: 'Add cards' }).click();
    await page.locator('.catalogue--sheet').waitFor();

    await page.setViewportSize({ width: 996, height: 900 });
    await page.locator('.catalogue--beside').waitFor();
    const desktopPocket = await expectPocketLayout(page, 1, 1);
    const spreadBox = await page.getByTestId('spread').boundingBox();
    const catalogueBox = await catalogue(page).boundingBox();
    assert.ok(spreadBox && catalogueBox, 'the spread and catalogue are visible on desktop');
    assert.ok(
      catalogueBox.x >= spreadBox.x + spreadBox.width,
      'the catalogue is right of the spread',
    );
    assert.ok(
      catalogueBox.y < spreadBox.y + spreadBox.height,
      'the catalogue overlaps the spread vertically',
    );
    await fileDarkMagician(page, 1, 1, 'LOB-EN005');
    await closeCatalogue(page);

    await page.setViewportSize({ width: 390, height: 844 });
    await fileDarkMagician(page, 1, 2, 'SDY-006');
    await page.locator('.catalogue--sheet').waitFor();
    const narrowPocket = await expectPocketLayout(page, 1, 3);
    t.diagnostic(
      `Pocket widths: ${desktopPocket.width}px at 996px desktop, ${narrowPocket.width}px at 390px mobile`,
    );
    await closeCatalogue(page);
    await showPrinting(page, 1, 2, 'SDY-006');
  });
});

test('keeps the catalogue below a dense binder when a scrollbar takes up room', async () => {
  await withBinder(
    async (page) => {
      await page.setViewportSize({ width: 996, height: 350 });
      await makeBinder(page, 'Showcase', { grid: '4', pages: '3' });

      await page.getByRole('button', { name: 'Add cards' }).click();

      await page.locator('.catalogue--sheet').waitFor();
      assert.ok(
        (await page.evaluate(() => document.documentElement.clientWidth)) < 996,
        'the classic scrollbar reduces the width available for the binder and catalogue',
      );
    },
    { classicScrollbars: true },
  );
});

const previousSpread = (page) => page.getByRole('button', { name: 'Previous spread' });
const nextSpread = (page) => page.getByRole('button', { name: 'Next spread' });
const pageRegion = (page, number) =>
  page.getByRole('region', { name: `Page ${number}`, exact: true });
const gridField = (dialog) => dialog.getByRole('combobox', { name: 'Pockets per page' });
const pagesField = (dialog) => dialog.getByRole('spinbutton', { name: 'Pages' });
const saveSettings = (dialog) => dialog.getByRole('button', { name: 'Save binder' }).click();

async function openSettings(page) {
  await page.getByRole('button', { name: 'Binder settings' }).click();
  return page.getByRole('dialog', { name: 'Binder settings' });
}

async function tryInvalidPageCount(settings, value) {
  await pagesField(settings).fill(value);
  await saveSettings(settings);
  assert.equal(await settings.isVisible(), true, `the settings stay open for ${value} pages`);
  assert.equal(
    await pagesField(settings).evaluate((input) => input.validity.valid),
    false,
    `the browser rejects ${value} pages`,
  );
}

async function visiblePages(page, numbers) {
  const labels = await page
    .getByRole('region', { name: /^Page \d+$/ })
    .evaluateAll((regions) => regions.map((region) => region.getAttribute('aria-label')));
  assert.deepEqual(
    labels,
    numbers.map((number) => `Page ${number}`),
  );
}

async function expectPocketCount(page, number, count) {
  const region = pageRegion(page, number);
  await region.waitFor();
  assert.equal(
    await region.getByRole('button').count(),
    count,
    `page ${number} has ${count} pockets`,
  );
}

async function expectPocketColumns(page, number, columns) {
  const first = await pocket(page, number, 1).boundingBox();
  const last = await pocket(page, number, columns).boundingBox();
  const next = await pocket(page, number, columns + 1).boundingBox();
  assert.equal(last.y, first.y, `pocket ${columns} is still in the first row`);
  assert.equal(next.x, first.x, `pocket ${columns + 1} starts the next row`);
  assert.ok(next.y > first.y, 'the next row sits below the first');
}

async function expectPocketLayout(page, number, slot) {
  const box = await pocket(page, number, slot).boundingBox();
  assert.ok(box.width >= 47.99, `pocket width is at least 48px, observed ${box.width}px`);
  assert.ok(
    Math.abs(box.width / box.height - 59 / 86) < 0.01,
    'pocket keeps the card aspect ratio',
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.scrollWidth),
    await page.evaluate(() => window.innerWidth),
    'binder and catalogue have no horizontal overflow',
  );
  return box;
}

async function removeDarkMagician(page, number, slot) {
  await pocket(page, number, slot, 'Dark Magician').click();
  await page.getByRole('button', { name: 'Remove from slot' }).click();
  await pocket(page, number, slot).waitFor();
}

const catalogue = (page) => page.getByRole('complementary', { name: 'Catalogue' });
const closeCatalogue = (page) =>
  catalogue(page).getByRole('button', { name: 'Close catalogue' }).click();

function pocket(page, pageNumber, slot, card) {
  return page.getByRole('button', {
    name: `Page ${pageNumber}, slot ${slot}${card ? `: ${card}` : ', empty'}`,
    exact: true,
  });
}

async function fileDarkMagician(page, pageNumber, slot, printing) {
  await pocket(page, pageNumber, slot).click();
  const panel = catalogue(page);
  await panel.getByRole('searchbox', { name: 'Search cards and sets' }).fill('Dark Magician');
  await panel.getByRole('button', { name: /Dark Magician/ }).click();
  await panel.getByRole('button', { name: new RegExp(printing) }).click();
  await pocket(page, pageNumber, slot, 'Dark Magician').waitFor();
}

async function showPrinting(page, pageNumber, slot, printing, condition = 'Near Mint') {
  await pocket(page, pageNumber, slot, 'Dark Magician').click();
  const detail = page.getByRole('dialog');
  await detail.getByRole('list', { name: 'Printing' }).getByText(printing).waitFor();
  assert.equal(await detail.getByRole('combobox', { name: 'Condition' }).inputValue(), condition);
  await detail.getByRole('button', { name: 'Close' }).click();
}

// The New binder dialog makes the shelf behind it inert, so its list is read with hidden elements included.
const shelfList = (page) =>
  page.getByRole('list', { name: 'Binder shelf', exact: true, includeHidden: true });

/** The names of the buttons on the shelf, in order. */
function shelfButtons(page) {
  return shelfList(page)
    .getByRole('button', { includeHidden: true })
    .evaluateAll((buttons) => buttons.map((button) => button.textContent));
}

/** The text of the element describing `button`, and whether it is visible. */
function descriptionOf(button) {
  return button.evaluate((element) => {
    const description = document.getElementById(element.getAttribute('aria-describedby'));
    return description && { text: description.textContent, visible: description.checkVisibility() };
  });
}

/** How many boards the spines stand on, counted by their distinct top positions. */
async function spineRows(page) {
  const tops = await shelfList(page)
    .getByRole('button')
    .evaluateAll((buttons) =>
      buttons.slice(0, -1).map((button) => button.getBoundingClientRect().top),
    );
  return new Set(tops).size;
}

const openFromShelf = (page, name) =>
  shelfList(page).getByRole('button', { name, exact: true }).click();

async function backToShelf(page) {
  await page.getByRole('button', { name: 'Back to shelf' }).click();
  return shelfList(page);
}

async function makeBinder(page, name, { grid = '3', pages = '40' } = {}) {
  await backToShelf(page);
  await page.getByRole('button', { name: 'New binder' }).click();
  const dialog = page.getByRole('dialog', { name: 'New binder' });
  await dialog.getByRole('textbox', { name: 'Binder name' }).fill(name);
  await gridField(dialog).selectOption(grid);
  await pagesField(dialog).fill(pages);
  await dialog.getByRole('button', { name: 'Create binder' }).click();
}

async function withBinder(
  run,
  { legacySlots, savedBinders, classicScrollbars = false, onShelf = false } = {},
) {
  const site = await preview({ configFile: false, preview: { port: 0 } });

  try {
    const origin = new URL(site.resolvedUrls.local[0]);
    const browser = await chromium.launch(
      classicScrollbars
        ? {
            ignoreDefaultArgs: ['--hide-scrollbars'],
            args: ['--disable-features=OverlayScrollbar'],
          }
        : undefined,
    );

    try {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(5_000);
      await page.route('**/*', (route) => serveCatalogueFixture(route, origin));
      if (legacySlots) {
        await page.addInitScript((slots) => {
          const key = 'grandpa-shop.dev-binder.v1';
          if (localStorage.getItem(key) === null)
            localStorage.setItem(key, JSON.stringify({ slots }));
        }, legacySlots);
      }
      if (savedBinders) {
        await page.addInitScript((binders) => {
          const key = 'grandpa-shop.dev-binder.v1';
          if (localStorage.getItem(key) === null)
            localStorage.setItem(key, JSON.stringify({ binders }));
        }, savedBinders);
      }
      await page.goto(origin.href);
      if (!onShelf) await openFromShelf(page, 'Binder 1');

      await run(page);
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise((resolve, reject) => {
      site.httpServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function serveCatalogueFixture(route, origin) {
  const url = new URL(route.request().url());
  if (url.origin !== origin.origin) return route.abort();
  if (url.pathname === '/api/cards') {
    const cards = url.searchParams.get('q') === 'Dark Magician' ? [darkMagician] : [];
    return route.fulfill({ json: { cards } });
  }
  if (url.pathname === '/api/sets') return route.fulfill({ json: { sets: [] } });
  if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 404 });
  return route.continue();
}
