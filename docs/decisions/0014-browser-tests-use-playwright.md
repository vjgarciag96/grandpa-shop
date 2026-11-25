# Browser tests use Playwright against the built web app

**Accepted**

Use Playwright as a development dependency to exercise the built Vite site in Chromium, following running-calculator. The first test files a copy through the catalogue and checks the binder after reload. A local catalogue fixture makes the check independent of upstream availability.

A real browser checks the built assets, the accessible controls, and browser storage together. Vitest continues to cover the binder rules and component behaviour.
