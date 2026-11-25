import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createElement } from 'react';
import App from '../App';
import { saveBinderWith, savedPlayedSdyDarkMagician } from './binder';
import { fakeCatalogue } from './fakeCatalogue';
import { viewportWidth } from './media';

/** Renders the app on the fake catalogue, in a viewport `width` pixels wide when given. */
export function openApp(width?: number) {
  if (width !== undefined) viewportWidth(width);
  const view = render(createElement(App, { catalogue: fakeCatalogue().catalogue }));
  return { user: userEvent.setup(), close: view.unmount };
}

/** Opens the catalogue from "Add cards", searches for `query`, and opens the result named `result`. */
export async function openCatalogueResult(
  user: ReturnType<typeof userEvent.setup>,
  query: string,
  result: RegExp,
) {
  await user.click(screen.getByRole('button', { name: 'Add cards' }));
  await user.type(screen.getByRole('searchbox', { name: 'Search cards and sets' }), query);
  await user.click(await screen.findByRole('button', { name: result }));
}

/**
 * Opens Pot of Greed in the catalogue over a binder whose page 1, slot 1 holds Dark Magician SDY-006 in Lightly Played,
 * plus any `alsoFiled` copies keyed by slot index from 0.
 */
export async function openPotOfGreedOverDarkMagician(
  width = 1200,
  alsoFiled: Record<number, unknown> = {},
) {
  saveBinderWith({ 0: savedPlayedSdyDarkMagician, ...alsoFiled });
  const app = openApp(width);
  await openCatalogueResult(app.user, 'pot', /Pot of Greed/);
  return app;
}
