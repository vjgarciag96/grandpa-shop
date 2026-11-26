import {
  CONDITIONS,
  isBinderCapacity,
  slotsPerPage,
  type Binder,
  type BinderCapacity,
  type Copy,
} from './binder';
import { initialShelf, type Shelf, type ShelfBinder } from './shelf';

// Each tab loads the binders once. A tab that only switches binders cannot overwrite edits.
const SHELF_KEY = 'grandpa-shop.dev-binder.v1';
const OPEN_BINDER_KEY = 'grandpa-shop.open-binder.v1';
const LEGACY_CAPACITY: BinderCapacity = { grid: 3, pages: 40 };

export function loadShelf(): Shelf {
  try {
    const local = storage();
    const saved = local?.getItem(SHELF_KEY);
    const shelf: unknown = JSON.parse(saved ?? 'null');
    const binders = readBinders(shelf);
    if (!binders) return initialShelf(readLegacyBinder(shelf));
    const openName = local?.getItem(OPEN_BINDER_KEY);
    const lastOpened = binders.findIndex(({ name }) => name === openName);
    return { binders, showing: { kind: 'shelf', lastOpened: lastOpened < 0 ? null : lastOpened } };
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

function readBinders(value: unknown): Shelf['binders'] | undefined {
  if (!isObject(value) || !Array.isArray(value.binders) || value.binders.length === 0) {
    return;
  }

  const names = new Set<string>();
  const binders: ShelfBinder[] = [];
  for (const entry of value.binders) {
    if (!isObject(entry) || typeof entry.name !== 'string') return;
    const name = entry.name.trim();
    if (!name || name !== entry.name || names.has(name)) return;
    const binder = readBinder(entry.binder);
    if (!binder) return;
    names.add(name);
    binders.push({ name, binder });
  }
  return binders;
}

function readLegacyBinder(value: unknown): Binder | undefined {
  if (!isObject(value) || 'binders' in value) return;
  return readBinder({ slots: value.slots });
}

function readBinder(value: unknown): Binder | undefined {
  if (!isObject(value) || !Array.isArray(value.slots)) return;
  const capacity = value.capacity === undefined ? LEGACY_CAPACITY : value.capacity;
  if (
    !isBinderCapacity(capacity) ||
    value.slots.length !== capacity.pages * slotsPerPage(capacity)
  ) {
    return;
  }
  if (!value.slots.every((slot) => slot === null || isCopy(slot))) return;
  return { capacity, slots: value.slots };
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
