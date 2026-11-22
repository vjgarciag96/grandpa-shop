import type { SlotAddress } from "./binder";

const emptySlotAttribute = "data-empty-slot";

export function emptySlotTarget({ page, position }: SlotAddress) {
  return { [emptySlotAttribute]: `${page}:${position}` };
}

export function emptySlotAt(x: number, y: number): SlotAddress | null {
  const marker = document
    .elementFromPoint(x, y)
    ?.closest(`[${emptySlotAttribute}]`)
    ?.getAttribute(emptySlotAttribute);
  if (!marker) return null;

  const [page, position] = marker.split(":");
  return { page: Number(page), position: Number(position) };
}
