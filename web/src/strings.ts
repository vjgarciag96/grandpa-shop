import type { Aim } from './aim';
import type { Copy, SlotAddress } from './binder';
import type { MonsterStats, Price } from './catalogue';

export function catalogueHeading(
  aim: Aim | null,
  replacing: Copy | null,
): { title: string; hint?: string } {
  if (aim?.kind === 'holding') {
    return {
      title: `Holding ${aim.printing.setCode}`,
      hint: 'Choose an empty slot',
    };
  }
  if (aim?.kind === 'target') {
    return replacing
      ? {
          title: `Replacing ${replacing.card.name}`,
          hint: slotName(aim.address),
        }
      : { title: `Adding to ${slotNameInSentence(aim.address)}` };
  }
  return {
    title: text.binder.addCards,
    hint: 'Pick up a printing, then choose an empty slot',
  };
}

function countOf(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}

/** How a slot is named to the person using the binder, such as "Page 1, slot 3". */
export function slotName({ page, position }: SlotAddress): string {
  return `Page ${page}, slot ${position + 1}`;
}

/** A slot's name inside a sentence, such as "page 1, slot 3". */
function slotNameInSentence(address: SlotAddress): string {
  return `page ${address.page}, slot ${address.position + 1}`;
}

export function pagesLabel(left: number | null, right: number | null): string {
  return left && right ? `Pages ${left}–${right}` : `Page ${left ?? right}`;
}

// The guide date parses as UTC midnight, so a viewer west of Greenwich would otherwise see the day before.
const guideDateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

/** 40.06 € · Cardmarket, 23 Nov 2026: the euros keep their sign on the same line. */
export function priceLine({ cents, guideDate }: Price): string {
  const euros = (cents / 100).toFixed(2);
  const day = guideDateFormat.format(new Date(guideDate));
  return `${euros}\u00a0€ · Cardmarket, ${day}`;
}

export function statsLine(monster: MonsterStats): string {
  const rating =
    monster.rank !== undefined
      ? `Rank ${monster.rank}`
      : monster.linkRating !== undefined
        ? `Link ${monster.linkRating}`
        : `Level ${monster.level}`;
  const attack = `ATK ${monster.atk ?? '?'}`;
  const defense = monster.def !== undefined ? ` / DEF ${monster.def}` : '';
  return `${monster.attribute} · ${monster.race} · ${rating} · ${attack}${defense}`;
}

export function pocketLabel(address: SlotAddress, copy: Copy | null): string {
  const label = slotName(address);
  return copy ? `${label}: ${copy.card.name}` : `${label}, empty`;
}

export function placedPrinting(setCode: string, to: SlotAddress, replaced?: string): string {
  const placed = `Placed ${setCode} in ${slotNameInSentence(to)}`;
  return replaced !== undefined ? `${placed}, replacing ${replaced}.` : `${placed}.`;
}

export function movedPrinting(
  setCode: string,
  to: SlotAddress,
  from: SlotAddress,
  displaced?: string,
): string {
  const moved = `${setCode} to ${slotNameInSentence(to)}`;
  return displaced !== undefined
    ? `Swapped ${moved} and ${displaced} to ${slotNameInSentence(from)}.`
    : `Moved ${moved}.`;
}

export function removedPrinting(setCode: string, from: SlotAddress): string {
  return `Removed ${setCode} from ${slotNameInSentence(from)}.`;
}

export const text = {
  app: {
    title: 'Grandpa Shop',
  },
  binder: {
    addCards: 'Add cards',
    turns: 'Turn the binder',
    previousSpread: 'Previous spread',
    nextSpread: 'Next spread',
    filledPocket: (address: SlotAddress) => `${slotName(address)} is filled.`,
    page: (page: number) => `Page ${page}`,
  },
  shelf: {
    title: 'Binder shelf',
    storage: 'Cards you place are kept in this browser for now.',
    back: 'Back to shelf',
    newBinder: 'New binder',
    lastOpened: 'Last opened',
    defaultName: 'Binder 1',
    name: 'Binder name',
    create: 'Create binder',
    blankName: 'Enter a binder name.',
    duplicateName: 'A binder already uses this name.',
  },
  binderSettings: {
    title: 'Binder settings',
    save: 'Save binder',
    grid: 'Pockets per page',
    gridOption: (grid: number) => `${grid} × ${grid}`,
    pages: 'Pages',
    pageRange: (min: number, max: number) =>
      `${min}–${max} pages. Each page is one side of a sheet.`,
    invalidCapacity: 'Choose a pocket grid and enter a whole number of pages in the shown range.',
    blockedResize: (address: SlotAddress) =>
      `${slotName(address)} is occupied. Move or remove that copy before reducing capacity.`,
  },
  catalogue: {
    name: 'Catalogue',
    close: 'Close catalogue',
    search: 'Search cards and sets',
    placeholder: 'Card, set, or set code',
    clear: 'Clear search',
    start: 'Find a card or a set in the catalogue',
    searchHint: (minimum: number) =>
      `Enter at least ${minimum} characters, such as Dark Magician, The Lost Millennium, or LOB-EN005.`,
    noMatches: (query: string) => `Nothing matches “${query}”.`,
    tryAnother: 'Try another card or set name, or check the set code.',
    catalogueFailed: 'The card catalogue did not answer.',
    cardSearchFailed: 'Card search did not answer.',
    setSearchFailed: 'Set search did not answer.',
    cataloguePending: 'Searching the catalogue…',
    cardsPending: 'Searching for cards…',
    setsPending: 'Searching for sets…',
    found: (counts: string[]) => `${counts.join(' and ')} found`,
    sets: 'Sets',
    matchingSets: 'Matching sets',
    cards: 'Cards',
    matchingCards: 'Matching cards',
    printings: 'Printings',
    openingSet: 'Opening the set…',
    setFailed: 'The set did not load.',
    retry: 'Try again',
    backToResults: 'Back to results',
    setCount: (count: number) => countOf(count, 'set'),
    cardCount: (count: number) => countOf(count, 'card'),
    printingCount: (count: number) => countOf(count, 'printing'),
  },
  detail: {
    printing: 'Printing',
    condition: 'Condition',
    replace: 'Replace',
    remove: 'Remove from slot',
    close: 'Close',
  },
};
