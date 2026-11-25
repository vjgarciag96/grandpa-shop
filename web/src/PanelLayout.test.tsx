import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { fakeCatalogue } from './test/fakeCatalogue';
import { viewportWidth } from './test/media';

async function openPanelAt(width: number) {
  viewportWidth(width);
  render(<App catalogue={fakeCatalogue().catalogue} />);
  await userEvent.setup().click(screen.getByRole('button', { name: 'Add cards' }));
  return screen.getByRole('complementary', { name: 'Catalogue' });
}

describe('where the catalogue panel sits', () => {
  it('sits beside the binder from 960 pixels wide', async () => {
    const panel = await openPanelAt(960);

    expect([
      panel.classList.contains('catalogue--beside'),
      screen.getByRole('main').classList.contains('desk--beside'),
    ]).toEqual([true, true]);
  });

  it('is a bottom sheet below 960 pixels wide', async () => {
    const panel = await openPanelAt(959);

    expect([
      panel.classList.contains('catalogue--sheet'),
      screen.getByRole('main').classList.contains('desk--sheet'),
    ]).toEqual([true, true]);
  });
});
