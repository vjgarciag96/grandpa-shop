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

test('keeps the filed copy in the first pocket after reloading the built binder', async () => {
  await withBinder(async (page) => {
    await fileDarkMagician(page, 1, 1, 'LOB-EN005');

    await page.reload();

    await pocket(page, 1, 1, 'Dark Magician').waitFor();
    const empty = page.getByRole('button', { name: /^Page 1, slot \d+, empty$/ });
    assert.equal(await empty.count(), 8, 'the first page has eight empty pockets');
  });
});

test('saves two binders independently and reopens the selected binder', async () => {
  await withBinder(async (page) => {
    await fileDarkMagician(page, 1, 1, 'LOB-EN005');
    await pocket(page, 1, 3).click();

    await makeBinder(page, 'Trades');

    await page.getByText('Trades', { exact: true }).waitFor();
    await pocket(page, 1, 1).waitFor();
    assert.equal(await catalogue(page).count(), 0, 'the new binder has no catalogue target');
    await fileDarkMagician(page, 1, 1, 'SDY-006');
    await page.reload();

    await page.getByText('Trades', { exact: true }).waitFor();
    await showPrinting(page, 1, 1, 'SDY-006');
    const shelf = await openShelf(page);
    assert.equal(
      await shelf.getByRole('button', { name: 'Trades' }).getAttribute('aria-current'),
      'true',
      'the shelf marks the open binder',
    );
    await shelf.getByRole('button', { name: 'Binder 1' }).click();
    await showPrinting(page, 1, 1, 'LOB-EN005');
    await pocket(page, 1, 3).waitFor();
  });
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

      await (await openShelf(page)).getByRole('button', { name: 'Binder 1' }).click();
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
      await page.getByText('Trades', { exact: true }).waitFor();
      await pocket(page, 1, 9).waitFor();
      await (await openShelf(page)).getByRole('button', { name: 'Binder 1' }).click();
      await pocket(page, 1, 9, 'Dark Magician').waitFor();
    },
    { legacySlots: Array(360).fill(copy) },
  );
});

test('closes the shelf with the keyboard and restores focus without turning', async () => {
  await withBinder(async (page) => {
    const shelf = await openShelf(page);
    await shelf.getByRole('button', { name: 'Close' }).focus();

    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');

    await page.getByRole('region', { name: 'Page 1', exact: true }).waitFor();
    assert.equal(await shelf.count(), 0, 'Escape closes the shelf');
    assert.equal(
      await page
        .getByRole('button', { name: 'Binder shelf' })
        .evaluate((button) => button === document.activeElement),
      true,
      'focus returns to the shelf button',
    );
  });
});

test('reopens the current binder on page 1 when selected from the shelf', async () => {
  await withBinder(async (page) => {
    await page.getByRole('button', { name: 'Next spread' }).click();
    await page.getByRole('region', { name: 'Page 2', exact: true }).waitFor();
    const shelf = await openShelf(page);

    await shelf.getByRole('button', { name: 'Binder 1' }).click();

    await page.getByRole('region', { name: 'Page 1', exact: true }).waitFor();
  });
});

test('keeps a binder created in one tab when another tab only switches binders', async () => {
  await withBinder(async (page) => {
    await makeBinder(page, 'Trades');
    const otherTab = await page.context().newPage();
    otherTab.setDefaultTimeout(5_000);
    await otherTab.goto(page.url());
    await otherTab.getByText('Trades', { exact: true }).waitFor();
    await makeBinder(page, 'Decks');

    await (await openShelf(otherTab)).getByRole('button', { name: 'Binder 1' }).click();

    await page.reload();
    const shelf = await openShelf(page);
    await shelf.getByRole('button', { name: 'Decks' }).waitFor();
    assert.equal(
      await shelf.getByRole('button', { name: 'Binder 1' }).getAttribute('aria-current'),
      'true',
      'the switch is saved without replacing the shelf contents',
    );
  });
});

const catalogue = (page) => page.getByRole('complementary', { name: 'Catalogue' });

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

async function openShelf(page) {
  await page.getByRole('button', { name: 'Binder shelf' }).click();
  return page.getByRole('dialog', { name: 'Binder shelf' });
}

async function makeBinder(page, name) {
  const shelf = await openShelf(page);
  await shelf.getByRole('textbox', { name: 'Binder name' }).fill(name);
  await shelf.getByRole('button', { name: 'Create binder' }).click();
}

async function withBinder(run, { legacySlots } = {}) {
  const site = await preview({ configFile: false, preview: { port: 0 } });

  try {
    const origin = new URL(site.resolvedUrls.local[0]);
    const browser = await chromium.launch();

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
      await page.goto(origin.href);

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
