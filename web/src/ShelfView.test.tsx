import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import { emptyBinder } from './binder';
import { saveBinders } from './savedShelf';
import { OPEN_BINDER_KEY } from './test/binder';
import { fakeCatalogue } from './test/fakeCatalogue';

/** Saves Binder 1 then Trades, with Trades opened last, and renders the app on the shelf. */
function openShelfWithTrades() {
  saveBinders([
    { name: 'Binder 1', binder: emptyBinder() },
    { name: 'Trades', binder: emptyBinder() },
  ]);
  localStorage.setItem(OPEN_BINDER_KEY, 'Trades');
  render(<App catalogue={fakeCatalogue().catalogue} />);
  return userEvent.setup();
}

const shelfList = () => within(screen.getByRole('list', { name: 'Binder shelf' }));

/** Opens Binder 1 from the shelf of Binder 1 and Trades, then goes back to the shelf. */
async function backOnShelfFromBinder1() {
  const user = openShelfWithTrades();
  await user.click(shelfList().getByRole('button', { name: 'Binder 1' }));
  await user.click(screen.getByRole('button', { name: 'Back to shelf' }));
  return user;
}

/** Creates a binder named `name` through New binder on the shelf. */
async function createBinder(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(shelfList().getByRole('button', { name: 'New binder' }));
  const dialog = within(screen.getByRole('dialog', { name: 'New binder' }));
  await user.type(dialog.getByRole('textbox', { name: 'Binder name' }), name);
  await user.click(dialog.getByRole('button', { name: 'Create binder' }));
}

describe('the binder shelf', () => {
  it('lists the binders in the order they were added, then the New binder spot', () => {
    openShelfWithTrades();

    const names = shelfList()
      .getAllByRole('button')
      .map((button) => button.textContent);

    expect(names).toEqual(['Binder 1', 'Trades', 'New binder']);
  });

  it('describes the binder opened last without opening it', () => {
    openShelfWithTrades();

    const trades = screen.queryByRole('button', { name: 'Trades', description: 'Last opened' });

    expect(trades, 'Trades is marked as last opened').not.toBeNull();
  });

  it('leaves focus where it is when the shelf loads', () => {
    openShelfWithTrades();

    expect(document.activeElement).toBe(document.body);
  });

  it('keeps the last opened mark when another visit only looks at the shelf', () => {
    openShelfWithTrades();
    cleanup();

    render(<App catalogue={fakeCatalogue().catalogue} />);

    const trades = screen.queryByRole('button', { name: 'Trades', description: 'Last opened' });
    expect(trades, 'Trades is still marked as last opened').not.toBeNull();
  });

  it('shows no binder page while the shelf is shown', () => {
    openShelfWithTrades();

    expect(screen.queryAllByRole('region', { name: /^Page \d+$/ })).toEqual([]);
  });

  it("focuses the binder's name when a binder is opened", async () => {
    const user = openShelfWithTrades();

    await user.click(shelfList().getByRole('button', { name: 'Trades' }));

    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Trades' }));
  });

  it("focuses the binder's spine when going back to the shelf", async () => {
    const user = openShelfWithTrades();
    await user.click(shelfList().getByRole('button', { name: 'Binder 1' }));

    await user.click(screen.getByRole('button', { name: 'Back to shelf' }));

    expect(document.activeElement).toBe(shelfList().getByRole('button', { name: 'Binder 1' }));
  });

  it('opens no binder page when an arrow key is pressed on the shelf', async () => {
    const user = await backOnShelfFromBinder1();

    await user.keyboard('{ArrowRight}');

    expect(screen.queryAllByRole('region', { name: /^Page \d+$/ })).toEqual([]);
  });

  it('stays on the shelf when an arrow key is pressed on it', async () => {
    const user = await backOnShelfFromBinder1();

    await user.keyboard('{ArrowRight}');

    expect(screen.queryByRole('list', { name: 'Binder shelf' })).not.toBeNull();
  });

  it('titles each spine with its full name', () => {
    const name = 'A very long binder name that will not fit on the spine';
    saveBinders([{ name, binder: emptyBinder() }]);
    render(<App catalogue={fakeCatalogue().catalogue} />);

    const spine = shelfList().getByRole('button', { name });

    expect(spine.title).toBe(name);
  });

  it('returns focus to New binder when the New binder dialog closes with Escape', async () => {
    const user = openShelfWithTrades();
    await user.click(shelfList().getByRole('button', { name: 'New binder' }));

    await user.keyboard('{Escape}');

    expect(document.activeElement).toBe(shelfList().getByRole('button', { name: 'New binder' }));
  });

  it('opens New binder with focus on the binder name', async () => {
    const user = openShelfWithTrades();

    await user.click(shelfList().getByRole('button', { name: 'New binder' }));

    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Binder name' }));
  });

  it('opens a created binder with its name focused', async () => {
    const user = openShelfWithTrades();

    await createBinder(user, 'Decks');

    expect(document.activeElement).toBe(screen.getByRole('heading', { level: 2, name: 'Decks' }));
  });

  it('puts a created binder at the end of the shelf', async () => {
    const user = openShelfWithTrades();
    await createBinder(user, 'Decks');

    await user.click(screen.getByRole('button', { name: 'Back to shelf' }));

    const names = shelfList()
      .getAllByRole('button')
      .map((button) => button.textContent);
    expect(names).toEqual(['Binder 1', 'Trades', 'Decks', 'New binder']);
  });
});
