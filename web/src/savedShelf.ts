import { CONDITIONS, PAGES, SLOTS_PER_PAGE, type Binder, type Copy } from './binder';

import { initialShelf, type Shelf } from './shelf';

// Each tab loads the binders once. A tab that only switches binders cannot overwrite edits.
const SHELF_KEY = 'grandpa-shop.dev-binder.v1';
const OPEN_BINDER_KEY = 'grandpa-shop.open-binder.v1';

export function loadShelf(): Shelf {
  try {
    const local = storage();
    const saved = local?.getItem(SHELF_KEY);
    const shelf: unknown = JSON.parse(saved ?? 'null');
    if (!hasBinders(shelf)) return initialShelf(readLegacyBinder(shelf));
    const { binders } = shelf;
    const openName = local?.getItem(OPEN_BINDER_KEY);
    const activeIndex = binders.findIndex(({ name }) => name === openName);
    return { binders, activeIndex: Math.max(activeIndex, 0) };
  } catch {
    return initialShelf();
  }
}

export function initializeShelf(binders: Shelf['binders']): void {
  try {
    const saved = storage()?.getItem(SHELF_KEY) ?? null;
    if (saved === null) {
      saveBinders(binders);
      return;
    }
    const legacy = readLegacyBinder(JSON.parse(saved));
    // Replacing the legacy record avoids holding two copies of every filed card in storage.
    if (legacy) saveBinders(initialShelf(legacy).binders);
  } catch {
    // Leave unreadable storage intact until the user makes a change.
  }
}

export function saveBinders(binders: Shelf['binders']): void {
  try {
    storage()?.setItem(SHELF_KEY, JSON.stringify({ binders }));
  } catch {
    // A full or refused storage only costs changes on the next reload.
  }
}

export function saveOpenBinder(name: string): void {
  try {
    storage()?.setItem(OPEN_BINDER_KEY, name);
  } catch {
    // The open binder is still usable when browser storage is unavailable.
  }
}

// Reading window.localStorage itself throws when the browser blocks site data.
function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

function hasBinders(value: unknown): value is Pick<Shelf, 'binders'> {
  if (!isObject(value) || !Array.isArray(value.binders) || value.binders.length === 0) {
    return false;
  }

  const names = new Set<string>();
  return value.binders.every((entry: unknown) => {
    if (!isObject(entry) || typeof entry.name !== 'string' || !isBinder(entry.binder)) return false;
    const name = entry.name.trim();
    if (!name || name !== entry.name || names.has(name)) return false;
    names.add(name);
    return true;
  });
}

function readLegacyBinder(value: unknown): Binder | undefined {
  if (!isObject(value) || 'binders' in value || !isBinder(value)) return;
  return { slots: value.slots };
}

function isBinder(value: unknown): value is Binder {
  if (!isObject(value) || !Array.isArray(value.slots)) return false;
  return (
    value.slots.length === PAGES * SLOTS_PER_PAGE &&
    value.slots.every((slot) => slot === null || isCopy(slot))
  );
}

function isCopy(value: unknown): value is Copy {
  return (
    isObject(value) &&
    isObject(value.card) &&
    typeof value.card.passcode === 'number' &&
    hasStrings(value.card, ['name', 'kind', 'type', 'text']) &&
    (value.card.monster === undefined || isMonsterStats(value.card.monster)) &&
    Array.isArray(value.card.printings) &&
    isObject(value.printing) &&
    hasStrings(value.printing, ['setCode', 'setName', 'rarity']) &&
    CONDITIONS.some((condition) => condition === value.condition)
  );
}

// The copy detail shows every stat, so each must be text or a number.
function isMonsterStats(value: unknown): boolean {
  return (
    isObject(value) &&
    Object.values(value).every((stat) => typeof stat === 'string' || typeof stat === 'number')
  );
}

function hasStrings(value: Record<string, unknown>, keys: string[]): boolean {
  return keys.every((key) => typeof value[key] === 'string');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
