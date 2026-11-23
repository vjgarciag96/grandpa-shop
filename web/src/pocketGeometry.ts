import type { SlotAddress } from "./binder";

export type Point = { readonly x: number; readonly y: number };
export type Size = { readonly width: number; readonly height: number };
/** A rectangle in viewport pixels. A DOMRect is one. */
export type Rect = Size & { readonly left: number; readonly top: number };

/** A slot on screen: where it is, whether it holds a copy, and the part of it you can see. */
export type Pocket = {
  readonly address: SlotAddress;
  readonly filled: boolean;
  readonly rect: Rect;
};

/**
 * The pocket [ghost] covers most by area, filled or empty, the earlier page and slot on a tie.
 * A pocket counts only when it covers at least [minShare] of the ghost's area; null when none does.
 */
export function coveredMost(
  ghost: Rect,
  pockets: readonly Pocket[],
  minShare: number,
): Pocket | null {
  const least = minShare * ghost.width * ghost.height;
  let best: { pocket: Pocket; area: number } | null = null;
  for (const pocket of pockets) {
    const area = overlap(ghost, pocket.rect);
    if (area <= 0 || area < least) continue;
    if (
      !best ||
      area > best.area ||
      (area === best.area && readsBefore(pocket.address, best.pocket.address))
    ) {
      best = { pocket, area };
    }
  }
  return best?.pocket ?? null;
}

/** The part of [rect] inside [area], or null when none of it is. */
export function visiblePart(rect: Rect, area: Rect): Rect | null {
  const left = Math.max(rect.left, area.left);
  const top = Math.max(rect.top, area.top);
  const right = Math.min(rect.left + rect.width, area.left + area.width);
  const bottom = Math.min(rect.top + rect.height, area.top + area.height);
  return right > left && bottom > top
    ? { left, top, width: right - left, height: bottom - top }
    : null;
}

/** Where in [rect] the press at [point] landed, as a fraction of its size on each axis. */
export function grabFraction(point: Point, rect: Rect): Point {
  return {
    x: fraction(point.x - rect.left, rect.width),
    y: fraction(point.y - rect.top, rect.height),
  };
}

/** The card of [size] held at [grab] under the pointer at [pointer]. */
export function ghostAt(pointer: Point, grab: Point, size: Size): Rect {
  return {
    left: pointer.x - grab.x * size.width,
    top: pointer.y - grab.y * size.height,
    width: size.width,
    height: size.height,
  };
}

function overlap(a: Rect, b: Rect): number {
  const width =
    Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left);
  const height =
    Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top);
  return width > 0 && height > 0 ? width * height : 0;
}

function readsBefore(a: SlotAddress, b: SlotAddress): boolean {
  return a.page !== b.page ? a.page < b.page : a.position < b.position;
}

// A missing layout has no size; the centre keeps the card on the pointer.
function fraction(offset: number, length: number): number {
  return length > 0 ? offset / length : 0.5;
}
