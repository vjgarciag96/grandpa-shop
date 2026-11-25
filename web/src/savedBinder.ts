import { CONDITIONS, PAGES, SLOTS_PER_PAGE, emptyBinder, type Binder, type Copy } from './binder';

// Temporary: keeps the binder in this browser until milestone 1 saves copies
// on the server. Delete this file, its test, and its use in App then.
// Change the key's version whenever Card, Printing, or Copy changes shape.
// Each tab reads the binder once on load, so with two tabs open the last one
// to change the binder wins.
const KEY = 'grandpa-shop.dev-binder.v1';

/** The binder saved in this browser, or an empty one when there is none to trust. */
export function loadBinder(): Binder {
  try {
    const saved: unknown = JSON.parse(storage()?.getItem(KEY) ?? 'null');
    return isBinder(saved) ? saved : emptyBinder();
  } catch {
    return emptyBinder();
  }
}

export function saveBinder(binder: Binder): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(binder));
  } catch {
    // A full or refused storage only costs the binder on the next reload.
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
