import {
  CONDITIONS,
  PAGES,
  SLOTS_PER_PAGE,
  emptyBinder,
  type Binder,
  type Copy,
} from "./binder";

// Temporary: keeps the binder in this browser until milestone 1 saves copies
// on the server. Delete this file and its use in App then.
const KEY = "grandpa-shop.dev-binder.v1";

/** The binder saved in this browser, or an empty one when there is none to trust. */
export function loadBinder(): Binder {
  try {
    const saved: unknown = JSON.parse(storage()?.getItem(KEY) ?? "null");
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
    typeof value.card.passcode === "number" &&
    typeof value.card.name === "string" &&
    Array.isArray(value.card.printings) &&
    isObject(value.printing) &&
    typeof value.printing.setCode === "string" &&
    typeof value.printing.rarity === "string" &&
    CONDITIONS.some((condition) => condition === value.condition)
  );
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
