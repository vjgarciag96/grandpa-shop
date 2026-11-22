import type { SlotAddress } from "./binder";

const dropSlotAttribute = "data-drop-slot";
const filledAttribute = "data-drop-slot-filled";

/** A pocket under the pointer, and whether a copy is filed in it. */
export type DropSlot = {
  readonly address: SlotAddress;
  readonly filled: boolean;
};

export function dropSlotTarget(
  { page, position }: SlotAddress,
  filled: boolean,
): Record<string, string> {
  return {
    [dropSlotAttribute]: `${page}:${position}`,
    ...(filled && { [filledAttribute]: "" }),
  };
}

export function dropSlotAt(x: number, y: number): DropSlot | null {
  const pocket = document
    .elementFromPoint(x, y)
    ?.closest(`[${dropSlotAttribute}]`);
  const marker = pocket?.getAttribute(dropSlotAttribute);
  if (!pocket || !marker) return null;

  const [page, position] = marker.split(":");
  return {
    address: { page: Number(page), position: Number(position) },
    filled: pocket.hasAttribute(filledAttribute),
  };
}
