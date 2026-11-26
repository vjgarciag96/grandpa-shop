import type { Card, Printing } from './catalogue';

export const CONDITIONS = [
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
] as const;

export type Condition = (typeof CONDITIONS)[number];

/** One physical card: a printing of a card, in some condition. */
export type Copy = {
  readonly card: Card;
  readonly printing: Printing;
  readonly condition: Condition;
};

export const POCKET_GRIDS = [2, 3, 4] as const;
export type PocketGrid = (typeof POCKET_GRIDS)[number];

export const MIN_BINDER_PAGES = 1;
export const MAX_BINDER_PAGES = 200;

export type BinderCapacity = { readonly grid: PocketGrid; readonly pages: number };

export const DEFAULT_BINDER_CAPACITY: BinderCapacity = { grid: 3, pages: 40 };

export function isBinderCapacity(value: unknown): value is BinderCapacity {
  if (typeof value !== 'object' || value === null) return false;
  const { grid, pages } = value as Partial<BinderCapacity>;
  return (
    POCKET_GRIDS.some((option) => option === grid) &&
    typeof pages === 'number' &&
    Number.isInteger(pages) &&
    pages >= MIN_BINDER_PAGES &&
    pages <= MAX_BINDER_PAGES
  );
}

export function slotsPerPage({ grid }: BinderCapacity): number {
  return grid * grid;
}

/** A page starts at 1 and its slot positions start at 0, in row-major order. */
export type SlotAddress = { readonly page: number; readonly position: number };

/** Whether two addresses name the same slot. */
export function sameSlot(a: SlotAddress, b: SlotAddress): boolean {
  return a.page === b.page && a.position === b.position;
}

export type Binder = {
  readonly capacity: BinderCapacity;
  readonly slots: ReadonlyArray<Copy | null>;
};

export function emptyBinder(capacity: BinderCapacity = DEFAULT_BINDER_CAPACITY): Binder {
  return { capacity, slots: emptySlots(capacity) };
}

export type BinderResize =
  | { readonly kind: 'resized'; readonly binder: Binder }
  | { readonly kind: 'occupied'; readonly address: SlotAddress };

export function resizeBinder(binder: Binder, capacity: BinderCapacity): BinderResize {
  if (capacity.pages === binder.capacity.pages && capacity.grid === binder.capacity.grid) {
    return { kind: 'resized', binder };
  }

  const slots = emptySlots(capacity);
  const oldWidth = slotsPerPage(binder.capacity);
  for (const [index, copy] of binder.slots.entries()) {
    if (copy === null) continue;
    const address = { page: Math.floor(index / oldWidth) + 1, position: index % oldWidth };
    if (!hasSlot(capacity, address)) return { kind: 'occupied', address };
    slots[indexOf(capacity, address)] = copy;
  }
  return { kind: 'resized', binder: { capacity, slots } };
}

export function place(binder: Binder, address: SlotAddress, copy: Copy): Binder {
  const slots = [...binder.slots];
  slots[indexOf(binder.capacity, address)] = copy;
  return { ...binder, slots };
}

/** What filing copies in order from a slot did: all of them placed, or none because too few empty slots follow. */
export type RunPlacement =
  | { readonly kind: 'placed'; readonly binder: Binder; readonly filled: readonly SlotAddress[] }
  | { readonly kind: 'refused'; readonly emptySlots: number };

/** Files `copies` in order into the empty slots from `start` to the end of the binder. Filled slots are skipped, never replaced. */
export function placeRun(
  binder: Binder,
  start: SlotAddress,
  copies: readonly Copy[],
): RunPlacement {
  const width = slotsPerPage(binder.capacity);
  const slots = [...binder.slots];
  const filled: SlotAddress[] = [];
  for (
    let index = indexOf(binder.capacity, start);
    index < slots.length && filled.length < copies.length;
    index++
  ) {
    if (slots[index] !== null) continue;
    slots[index] = copies[filled.length];
    filled.push({ page: Math.floor(index / width) + 1, position: index % width });
  }
  if (filled.length < copies.length) return { kind: 'refused', emptySlots: filled.length };
  return { kind: 'placed', binder: { ...binder, slots }, filled };
}

export function remove(binder: Binder, address: SlotAddress): Binder {
  const slots = [...binder.slots];
  slots[indexOf(binder.capacity, address)] = null;
  return { ...binder, slots };
}

/** What moving a copy did: nothing, a move into an empty slot, or a swap with the copy that was there. */
export type CopyMove =
  | { readonly kind: 'refused' }
  | { readonly kind: 'moved'; readonly binder: Binder }
  | {
      readonly kind: 'swapped';
      readonly binder: Binder;
      readonly displaced: Copy;
    };

/** Moves `copy` from `from` to `to`. A copy already in `to` takes `from`. Refused if `from` no longer holds `copy` or `from` is `to`. */
export function moveCopy(binder: Binder, from: SlotAddress, to: SlotAddress, copy: Copy): CopyMove {
  const source = indexOf(binder.capacity, from);
  const destination = indexOf(binder.capacity, to);
  if (binder.slots[source] !== copy || source === destination) {
    return { kind: 'refused' };
  }
  const displaced = binder.slots[destination];
  const slots = [...binder.slots];
  slots[source] = displaced;
  slots[destination] = copy;
  return displaced
    ? { kind: 'swapped', binder: { ...binder, slots }, displaced }
    : { kind: 'moved', binder: { ...binder, slots } };
}

/** What removing a copy did: nothing, or took it out of its slot. */
export type CopyRemoval =
  { readonly kind: 'refused' } | { readonly kind: 'removed'; readonly binder: Binder };

/** Takes `copy` out of `from`. Refused if `from` no longer holds `copy`. */
export function removeCopy(binder: Binder, from: SlotAddress, copy: Copy): CopyRemoval {
  return binder.slots[indexOf(binder.capacity, from)] === copy
    ? { kind: 'removed', binder: remove(binder, from) }
    : { kind: 'refused' };
}

export function changeCondition(
  binder: Binder,
  address: SlotAddress,
  condition: Condition,
): Binder {
  const copy = binder.slots[indexOf(binder.capacity, address)];
  return copy ? place(binder, address, { ...copy, condition }) : binder;
}

export function slotAt(binder: Binder, address: SlotAddress): Copy | null {
  return binder.slots[indexOf(binder.capacity, address)];
}

export function pageSlots(binder: Binder, page: number): ReadonlyArray<Copy | null> {
  const start = indexOf(binder.capacity, { page, position: 0 });
  return binder.slots.slice(start, start + slotsPerPage(binder.capacity));
}

export function spreadCount({ pages }: BinderCapacity): number {
  return Math.floor(pages / 2) + 1;
}

export function spreadPages(
  { pages }: BinderCapacity,
  spread: number,
): { left: number | null; right: number | null } {
  const left = spread * 2;
  const right = left + 1;
  return {
    left: left >= 1 && left <= pages ? left : null,
    right: right <= pages ? right : null,
  };
}

/** The first page an open spread shows: page 1 on the first spread, the left page on every other. */
export function firstSpreadPage(capacity: BinderCapacity, spread: number): number {
  const { left, right } = spreadPages(capacity, spread);
  // Every spread shows at least one page, because a binder has at least one.
  return (left ?? right) as number;
}

function emptySlots(capacity: BinderCapacity): Array<Copy | null> {
  if (!isBinderCapacity(capacity)) throw new RangeError('Invalid binder capacity');
  return Array<Copy | null>(capacity.pages * slotsPerPage(capacity)).fill(null);
}

function hasSlot(capacity: BinderCapacity, { page, position }: SlotAddress): boolean {
  return (
    Number.isInteger(page) &&
    page >= 1 &&
    page <= capacity.pages &&
    Number.isInteger(position) &&
    position >= 0 &&
    position < slotsPerPage(capacity)
  );
}

function indexOf(capacity: BinderCapacity, address: SlotAddress): number {
  const { page, position } = address;
  if (!hasSlot(capacity, address))
    throw new RangeError(`No slot at page ${page}, position ${position}`);
  return (page - 1) * slotsPerPage(capacity) + position;
}
