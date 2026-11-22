# Web tests use Testing Library on jsdom

Status: accepted

Web behaviour tests render the app with `@testing-library/react` 16.3.3 and drive it with `@testing-library/user-event` 14.6.8, on `@testing-library/dom` 10.4.2, in Vitest's `jsdom` 30.1.3 environment. All four are dev dependencies; nothing ships to the browser.

Why: the contributing rules ask for tests of behaviour a caller can see. Testing Library finds elements by role and label and clicks and types the way Víctor does, so a test of "fill a slot" says that and nothing about components or state. jsdom is the DOM Vitest documents for it.

Each version was at least two weeks old when it was added. `@testing-library/jest-dom` is left out: plain Vitest assertions are enough.
