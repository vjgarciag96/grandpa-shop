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
  ],
};

test('keeps the filed copy in the first pocket after reloading the built binder', async () => {
  const site = await preview({ configFile: false, preview: { port: 0 } });

  try {
    const origin = new URL(site.resolvedUrls.local[0]);
    const browser = await chromium.launch();

    try {
      const page = await browser.newPage({
        viewport: { width: 1440, height: 900 },
        reducedMotion: 'reduce',
      });
      page.setDefaultTimeout(5_000);
      await page.route('**/*', (route) => serveCatalogueFixture(route, origin));
      await page.goto(origin.href);

      const binder = page.getByRole('main');
      const panel = page.getByRole('complementary', { name: 'Catalogue' });
      await binder.getByRole('button', { name: 'Page 1, slot 1, empty', exact: true }).click();
      await panel.getByRole('searchbox', { name: 'Search cards and sets' }).fill('Dark Magician');
      await panel.getByRole('button', { name: /Dark Magician/ }).click();
      await panel.getByRole('button', { name: /LOB-EN005/ }).click();
      const filled = binder.getByRole('button', {
        name: 'Page 1, slot 1: Dark Magician',
        exact: true,
      });
      await filled.waitFor();

      await page.reload();

      await filled.waitFor();
      const empty = binder.getByRole('button', { name: /^Page 1, slot \d+, empty$/ });
      assert.equal(await empty.count(), 8, 'the first page has eight empty pockets');
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise((resolve, reject) => {
      site.httpServer.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

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
