import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from './App';
import type { Copy } from './binder';
import type { Catalogue, Price } from './catalogue';
import { CopyDetail } from './CopyDetail';
import { saveBinderWith } from './test/binder';
import {
  darkMagician,
  fakeCatalogue,
  potOfGreed,
  relinquished,
  relinquishedPrice,
} from './test/fakeCatalogue';
import { openFirstBinder } from './test/app';

async function appWithFirstSlotFilled(query: string, cardName: RegExp, setCode: RegExp) {
  render(<App catalogue={fakeCatalogue().catalogue} />);
  openFirstBinder();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: 'Page 1, slot 1, empty' }));
  await user.type(screen.getByRole('searchbox', { name: 'Search cards and sets' }), query);
  await user.click(await screen.findByRole('button', { name: cardName }));
  await user.click(screen.getByRole('button', { name: setCode }));
  return user;
}

const fillWithDarkMagician = () => appWithFirstSlotFilled('dark', /Dark Magician/, /LOB-EN005/);

describe("a copy's detail", () => {
  it('shows the printing selected when the copy was added', async () => {
    const user = await appWithFirstSlotFilled('dark', /Dark Magician/, /SDY-006/);

    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));

    const detail = screen.getByRole('dialog', { name: 'Page 1, slot 1' });
    expect(within(detail).getByRole('list', { name: 'Printing' }).textContent).toBe(
      'SDY-006CommonStarter Deck: Yugi',
    );
  });

  it("shows a monster's stats", async () => {
    const user = await fillWithDarkMagician();

    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));

    expect(screen.getByText('DARK · Spellcaster · Level 7 · ATK 2500 / DEF 2100')).toBeTruthy();
  });

  it('shows no monster stats for a spell', async () => {
    const user = await appWithFirstSlotFilled('pot', /Pot of Greed/, /LOB-EN119/);

    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Pot of Greed' }));

    const detail = screen.getByRole('dialog', { name: 'Page 1, slot 1' });
    expect([
      within(detail).queryByText('Spell Card') !== null,
      within(detail).queryByText(/ATK/),
    ]).toEqual([true, null]);
  });

  it('starts a new copy at Near Mint', async () => {
    const user = await fillWithDarkMagician();

    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));

    const condition = screen.getByRole('combobox', {
      name: 'Condition',
    }) as HTMLSelectElement;
    expect(condition.value).toBe('Near Mint');
  });

  it('keeps a changed condition after it is closed and opened again', async () => {
    const user = await fillWithDarkMagician();
    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));
    await user.selectOptions(screen.getByRole('combobox', { name: 'Condition' }), 'Lightly Played');
    await user.click(screen.getByRole('button', { name: 'Close' }));

    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));

    const condition = screen.getByRole('combobox', {
      name: 'Condition',
    }) as HTMLSelectElement;
    expect(condition.value).toBe('Lightly Played');
  });

  it('removes the copy and leaves the slot empty', async () => {
    const user = await fillWithDarkMagician();
    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));

    await user.click(screen.getByRole('button', { name: 'Remove from slot' }));

    expect(screen.getByRole('button', { name: 'Page 1, slot 1, empty' })).toBeTruthy();
  });

  it('aims the catalogue panel at the copy it replaces', async () => {
    const user = await fillWithDarkMagician();
    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));

    await user.click(screen.getByRole('button', { name: 'Replace' }));

    const panel = screen.getByRole('complementary', { name: 'Catalogue' });
    expect(within(panel).getByRole('heading', { level: 2 }).textContent).toBe(
      'Replacing Dark Magician',
    );
  });

  it('moves focus into the catalogue panel on Replace', async () => {
    const user = await fillWithDarkMagician();
    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));

    await user.click(screen.getByRole('button', { name: 'Replace' }));

    expect(
      screen.getByRole('complementary', { name: 'Catalogue' }).contains(document.activeElement),
    ).toBe(true);
  });

  it('names the copy it replaced when a printing is picked after Replace', async () => {
    const user = await fillWithDarkMagician();
    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));
    await user.click(screen.getByRole('button', { name: 'Replace' }));

    await user.click(screen.getByRole('button', { name: /SDY-006/ }));

    expect(document.querySelector('.catalogue__announcement')?.textContent?.trim()).toBe(
      'Placed SDY-006 in page 1, slot 1, replacing LOB-EN005.',
    );
  });

  it('replaces the copy with another card picked from the catalogue', async () => {
    const user = await fillWithDarkMagician();
    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Dark Magician' }));
    await user.click(screen.getByRole('button', { name: 'Replace' }));
    await user.click(screen.getByRole('button', { name: 'Back to results' }));
    await user.clear(screen.getByRole('searchbox', { name: 'Search cards and sets' }));
    await user.type(screen.getByRole('searchbox', { name: 'Search cards and sets' }), 'pot');
    await user.click(await screen.findByRole('button', { name: /Pot of Greed/ }));

    await user.click(screen.getByRole('button', { name: /LOB-EN119/ }));

    expect(screen.getByRole('button', { name: 'Page 1, slot 1: Pot of Greed' })).toBeTruthy();
  });
});

describe("a copy's price", () => {
  const PRICED = { 'SRL-029|Ultra Rare': relinquishedPrice };

  /** Opens page 1, slot 1 of a binder holding Relinquished SRL-029 on `catalogue`. */
  async function openRelinquished(catalogue: Catalogue) {
    saveBinderWith({
      0: {
        card: relinquished,
        printing: relinquished.printings[0],
        condition: 'Near Mint',
      },
    });
    render(<App catalogue={catalogue} />);
    openFirstBinder();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Page 1, slot 1: Relinquished' }));
    return within(screen.getByRole('dialog', { name: 'Page 1, slot 1' }));
  }

  it("shows the Cardmarket price of the copy's printing with the guide's date", async () => {
    const { catalogue } = fakeCatalogue([darkMagician, potOfGreed, relinquished], PRICED);

    const detail = await openRelinquished(catalogue);

    expect((await detail.findByText(/Cardmarket/)).textContent).toBe(
      '40.06\u00a0€ · Cardmarket, 23 Nov 2026',
    );
  });

  it('shows whole euros with two decimals', async () => {
    const { catalogue } = fakeCatalogue([darkMagician, potOfGreed, relinquished], {
      'SRL-029|Ultra Rare': { ...relinquishedPrice, cents: 1000 },
    });

    const detail = await openRelinquished(catalogue);

    expect((await detail.findByText(/Cardmarket/)).textContent).toBe(
      '10.00 € · Cardmarket, 23 Nov 2026',
    );
  });

  it('shows no price line when the printing has no price', async () => {
    const { catalogue } = fakeCatalogue([darkMagician, potOfGreed, relinquished]);

    const detail = await openRelinquished(catalogue);
    await priceLookupSettled();

    expect(detail.queryByText(/Cardmarket/)).toBeNull();
  });

  it('shows no price line when the price lookup fails', async () => {
    const catalogue: Catalogue = {
      ...fakeCatalogue([darkMagician, potOfGreed, relinquished]).catalogue,
      price: () => Promise.reject(new Error('the server is down')),
    };

    const detail = await openRelinquished(catalogue);
    await priceLookupSettled();

    expect(detail.queryByText(/Cardmarket/)).toBeNull();
  });

  it('shows no price line while the price is still being looked up', async () => {
    const catalogue: Catalogue = {
      ...fakeCatalogue([darkMagician, potOfGreed, relinquished]).catalogue,
      price: () => new Promise(() => {}),
    };

    const detail = await openRelinquished(catalogue);

    expect(detail.queryByText(/Cardmarket/)).toBeNull();
  });

  it("looks the price up for the copy's own printing", async () => {
    const asked: string[] = [];
    const catalogue: Catalogue = {
      ...fakeCatalogue([darkMagician, potOfGreed, relinquished]).catalogue,
      price: async ({ setCode, rarity }) => {
        asked.push(`${setCode} ${rarity}`);
        return null;
      },
    };

    await openRelinquished(catalogue);

    expect(asked).toEqual(['SRL-029 Ultra Rare']);
  });

  it('abandons the price lookup when the detail closes', async () => {
    const { catalogue, lookups } = catalogueAnsweringOnDemand();
    const detail = await openRelinquished(catalogue);

    await userEvent.click(detail.getByRole('button', { name: 'Close' }));

    expect(lookups[0].signal?.aborted, "the lookup's signal is aborted").toBe(true);
  });

  it('shows no price of the previous copy once the detail shows another', async () => {
    const { catalogue, lookups } = catalogueAnsweringOnDemand();
    const { rerender } = renderDetailOf(relinquishedCopy, catalogue);
    await lookups[0].answer(relinquishedPrice);

    rerender(detailOf(darkMagicianCopy, catalogue));

    expect(screen.queryByText(/Cardmarket/)).toBeNull();
  });

  it("keeps the current copy's price when the previous copy's lookup answers late", async () => {
    const { catalogue, lookups } = catalogueAnsweringOnDemand();
    const { rerender } = renderDetailOf(relinquishedCopy, catalogue);
    rerender(detailOf(darkMagicianCopy, catalogue));
    await lookups[1].answer({ ...relinquishedPrice, cents: 100 });

    await lookups[0].answer(relinquishedPrice);

    expect(screen.getByText(/Cardmarket/).textContent).toBe('1.00 € · Cardmarket, 23 Nov 2026');
  });
});

const relinquishedCopy: Copy = {
  card: relinquished,
  printing: relinquished.printings[0],
  condition: 'Near Mint',
};

const darkMagicianCopy: Copy = {
  card: darkMagician,
  printing: darkMagician.printings[0],
  condition: 'Near Mint',
};

function detailOf(copy: Copy, catalogue: Catalogue) {
  return (
    <CopyDetail
      copy={copy}
      title="Page 1, slot 1"
      catalogue={catalogue}
      onCondition={() => {}}
      onReplace={() => {}}
      onRemove={() => {}}
      onClose={() => {}}
    />
  );
}

/** Lets an already answered price lookup reach the detail, so "no line" means settled, not still pending. */
async function priceLookupSettled() {
  await act(async () => {});
}

/** Renders the detail on its own, so a test can change the copy under it without closing it. */
function renderDetailOf(copy: Copy, catalogue: Catalogue) {
  return render(detailOf(copy, catalogue));
}

type Lookup = {
  signal: AbortSignal | undefined;
  /** Answers the lookup and waits for the detail to render the answer. */
  answer: (price: Price | null) => Promise<void>;
};

/** A catalogue whose price lookups answer only when the test says so, listed in the order they were asked. */
function catalogueAnsweringOnDemand() {
  const lookups: Lookup[] = [];
  const catalogue: Catalogue = {
    ...fakeCatalogue().catalogue,
    price: (_printing, signal) =>
      new Promise((resolve) => {
        lookups.push({
          signal,
          answer: (price) => act(async () => resolve(price)),
        });
      }),
  };
  return { catalogue, lookups };
}
