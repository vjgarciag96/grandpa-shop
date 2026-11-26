import { chromium } from 'playwright';
import { preview } from 'vite';

/**
 * Serves the built app with Vite preview, opens it in Chromium at `viewport`, answers every request through
 * `serve(route, origin)`, and hands the loaded page to `run`. Everything is closed afterwards.
 */
export async function withBuiltApp(viewport, serve, run) {
  const site = await preview({ configFile: false, preview: { port: 0 } });

  try {
    const origin = new URL(site.resolvedUrls.local[0]);
    const browser = await chromium.launch();

    try {
      const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
      page.setDefaultTimeout(5_000);
      await page.route('**/*', (route) => serve(route, origin));
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
