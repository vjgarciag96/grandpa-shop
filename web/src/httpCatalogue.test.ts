// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { httpCatalogue } from './httpCatalogue';
import { darkMagician } from './test/fakeCatalogue';

afterEach(() => {
  vi.unstubAllGlobals();
});

it('reads set search results from the sets endpoint', async () => {
  const sets = [{ name: 'The Lost Millennium', prefix: 'TLM', printings: 85 }];
  const fetch = vi.fn().mockResolvedValue(Response.json({ sets }));
  vi.stubGlobal('fetch', fetch);

  const result = await httpCatalogue.searchSets('lost millennium');

  expect(fetch).toHaveBeenCalledWith('/api/sets?q=lost+millennium&limit=8', {
    signal: undefined,
  });
  expect(result).toEqual(sets);
});

it('requests an exact set name and joins each printing to its card in response order', async () => {
  const fetch = vi.fn().mockResolvedValue(
    Response.json({
      name: "Legendary 5D's Decks",
      cards: [darkMagician],
      printings: [
        { setCode: 'L5DD-001', rarity: 'Common', passcode: 46986414 },
        { setCode: 'L5DD-001', rarity: 'Ultra Rare', passcode: 46986414 },
      ],
    }),
  );
  vi.stubGlobal('fetch', fetch);

  const result = await httpCatalogue.setPrintings("Legendary 5D's Decks");

  expect(fetch).toHaveBeenCalledWith('/api/sets/printings?name=Legendary+5D%27s+Decks', {
    signal: undefined,
  });
  expect(result).toEqual([
    {
      card: darkMagician,
      printing: {
        setCode: 'L5DD-001',
        setName: "Legendary 5D's Decks",
        rarity: 'Common',
      },
    },
    {
      card: darkMagician,
      printing: {
        setCode: 'L5DD-001',
        setName: "Legendary 5D's Decks",
        rarity: 'Ultra Rare',
      },
    },
  ]);
});

it("asks the price route for the printing's set code and rarity, percent-encoded", async () => {
  const price = { cents: 4006, guideDate: '2026-11-23' };
  const fetch = vi
    .fn()
    .mockResolvedValue(Response.json({ ...price, currency: 'EUR', product: 579386 }));
  vi.stubGlobal('fetch', fetch);

  const result = await httpCatalogue.price({
    setCode: 'SRL-029',
    rarity: "Collector's Rare",
  });

  expect(fetch).toHaveBeenCalledWith(
    '/api/printings/price?setCode=SRL-029&rarity=Collector%27s+Rare',
    { signal: undefined },
  );
  expect(result).toEqual(price);
});

it('fails the price lookup on a body without a price', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({})));

  await expect(httpCatalogue.price({ setCode: 'SRL-029', rarity: 'Ultra Rare' })).rejects.toThrow(
    'The catalogue answered a malformed price',
  );
});

it('fails the price lookup on a guide date not written as year-month-day', async () => {
  const body = { cents: 4006, guideDate: '23/11/2026', product: 579386 };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));

  await expect(httpCatalogue.price({ setCode: 'SRL-029', rarity: 'Ultra Rare' })).rejects.toThrow(
    'The catalogue answered a malformed price',
  );
});

it('fails the price lookup on an empty guide date', async () => {
  const body = { cents: 4006, guideDate: '', product: 579386 };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));

  await expect(httpCatalogue.price({ setCode: 'SRL-029', rarity: 'Ultra Rare' })).rejects.toThrow(
    'The catalogue answered a malformed price',
  );
});

it('fails the price lookup on a guide date that is not a calendar day', async () => {
  const body = { cents: 4006, guideDate: '2026-13-45', product: 579386 };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));

  await expect(httpCatalogue.price({ setCode: 'SRL-029', rarity: 'Ultra Rare' })).rejects.toThrow(
    'The catalogue answered a malformed price',
  );
});

it('fails the price lookup on cents that are not a whole number', async () => {
  const body = { cents: 40.06, guideDate: '2026-11-23', product: 579386 };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));

  await expect(httpCatalogue.price({ setCode: 'SRL-029', rarity: 'Ultra Rare' })).rejects.toThrow(
    'The catalogue answered a malformed price',
  );
});

it('answers no price when the route has none for the printing', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('No price', { status: 404 })));

  const result = await httpCatalogue.price({
    setCode: 'MRL-029',
    rarity: 'Ultra Rare',
  });

  expect(result).toBeNull();
});

it('answers no price while the guide is unavailable', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('No guide', { status: 503 })));

  const result = await httpCatalogue.price({
    setCode: 'SRL-029',
    rarity: 'Ultra Rare',
  });

  expect(result).toBeNull();
});

it('fails the price lookup on any other error answer', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Broken', { status: 500 })));

  await expect(httpCatalogue.price({ setCode: 'SRL-029', rarity: 'Ultra Rare' })).rejects.toThrow(
    'The catalogue answered 500',
  );
});

it('rejects a card whose printing has no rarity', async () => {
  const cards = [
    {
      ...darkMagician,
      printings: [{ setCode: 'LOB-EN005', setName: 'Blue Eyes' }],
    },
  ];
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ cards })));

  await expect(httpCatalogue.search('dark')).rejects.toThrow(
    'The catalogue answered malformed cards',
  );
});

it('rejects a set whose printing count is text', async () => {
  const sets = [{ name: 'The Lost Millennium', prefix: 'TLM', printings: '85' }];
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ sets })));

  await expect(httpCatalogue.searchSets('lost')).rejects.toThrow(
    'The catalogue answered malformed sets',
  );
});

it('rejects a set printing whose passcode is text', async () => {
  const body = {
    name: 'The Lost Millennium',
    cards: [darkMagician],
    printings: [{ setCode: 'TLM-EN001', rarity: 'Common', passcode: '46986414' }],
  };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));

  await expect(httpCatalogue.setPrintings('The Lost Millennium')).rejects.toThrow(
    'The catalogue answered malformed set printings',
  );
});

it('rejects a price whose date would roll into the next month', async () => {
  const body = { cents: 4006, guideDate: '2026-02-30' };
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(body)));

  await expect(httpCatalogue.price({ setCode: 'SRL-029', rarity: 'Ultra Rare' })).rejects.toThrow(
    'The catalogue answered a malformed price',
  );
});
