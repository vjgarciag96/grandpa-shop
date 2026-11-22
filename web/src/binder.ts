import type { Card, Printing } from "./catalogue";

export const CONDITIONS = [
  "Near Mint",
  "Lightly Played",
  "Moderately Played",
  "Heavily Played",
  "Damaged",
] as const;

export type Condition = (typeof CONDITIONS)[number];

/** One physical card: a printing of a card, in some condition. */
export type Copy = {
  readonly card: Card;
  readonly printing: Printing;
  readonly condition: Condition;
};

export const PAGES = 40;
export const SLOTS_PER_PAGE = 9;
/** Page 1 faces the inside cover, then pages 2–3 face each other, and page 40 faces the back cover. */
export const SPREADS = PAGES / 2 + 1;

/** A page is numbered from 1; a position on it runs 0 to 8, left to right, top to bottom. */
export type SlotAddress = { readonly page: number; readonly position: number };

/** Whether two addresses name the same slot. */
export function sameSlot(a: SlotAddress, b: SlotAddress): boolean {
  return a.page === b.page && a.position === b.position;
}

/** How a slot is named to the person using the binder, such as "Page 1, slot 3". */
export function slotName({ page, position }: SlotAddress): string {
  return `Page ${page}, slot ${position + 1}`;
}

/** A slot's name inside a sentence, such as "page 1, slot 3". */
export function slotNameInSentence(address: SlotAddress): string {
  return `page ${address.page}, slot ${address.position + 1}`;
}

export type Binder = { readonly slots: ReadonlyArray<Copy | null> };

export function emptyBinder(): Binder {
  return { slots: Array<Copy | null>(PAGES * SLOTS_PER_PAGE).fill(null) };
}

export function place(
  binder: Binder,
  address: SlotAddress,
  copy: Copy,
): Binder {
  const slots = [...binder.slots];
  slots[indexOf(address)] = copy;
  return { slots };
}

export function remove(binder: Binder, address: SlotAddress): Binder {
  const slots = [...binder.slots];
  slots[indexOf(address)] = null;
  return { slots };
}

/** Moves `copy` from `from` to `to`. A copy already in `to` takes `from`. Same binder back if `from` no longer holds `copy` or `from` is `to`. */
export function moveCopy(
  binder: Binder,
  from: SlotAddress,
  to: SlotAddress,
  copy: Copy,
): Binder {
  const source = indexOf(from);
  const destination = indexOf(to);
  if (binder.slots[source] !== copy || source === destination) {
    return binder;
  }
  const slots = [...binder.slots];
  slots[source] = binder.slots[destination];
  slots[destination] = copy;
  return { slots };
}

export function changeCondition(
  binder: Binder,
  address: SlotAddress,
  condition: Condition,
): Binder {
  const copy = binder.slots[indexOf(address)];
  return copy ? place(binder, address, { ...copy, condition }) : binder;
}

export function slotAt(binder: Binder, address: SlotAddress): Copy | null {
  return binder.slots[indexOf(address)];
}

export function pageSlots(
  binder: Binder,
  page: number,
): ReadonlyArray<Copy | null> {
  const start = indexOf({ page, position: 0 });
  return binder.slots.slice(start, start + SLOTS_PER_PAGE);
}

export function spreadPages(spread: number): {
  left: number | null;
  right: number | null;
} {
  const left = spread * 2;
  const right = left + 1;
  return {
    left: left >= 1 && left <= PAGES ? left : null,
    right: right <= PAGES ? right : null,
  };
}

function indexOf({ page, position }: SlotAddress): number {
  if (page < 1 || page > PAGES || position < 0 || position >= SLOTS_PER_PAGE) {
    throw new RangeError(`No slot at page ${page}, position ${position}`);
  }
  return (page - 1) * SLOTS_PER_PAGE + position;
}
