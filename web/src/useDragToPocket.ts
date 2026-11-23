import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { sameSlot, type Copy, type SlotAddress } from "./binder";
import {
  coveredMost,
  ghostAt,
  grabFraction,
  type Pocket,
  type Point,
  type Rect,
  type Size,
} from "./pocketGeometry";
import { pocketSizeOnScreen, pocketsOnScreen } from "./pocketsOnPage";
import type { Card, Printing } from "./catalogue";
import { DRAG_START_PX, DROP_MIN_COVER_SHARE } from "./tokens";

export type DragOrigin =
  | { kind: "printing"; card: Card; printing: Printing }
  | { kind: "copy"; from: SlotAddress; copy: Copy };

type Drag = {
  readonly origin: DragOrigin;
  /** The card under the pointer, or null until a pocket on screen gives it a size. */
  readonly ghost: Rect | null;
  /** The pocket a release now would drop into. */
  readonly target: SlotAddress | null;
};

type Press = {
  origin: DragOrigin;
  spread: number;
  pointerId: number;
  pointerType: string;
  startX: number;
  startY: number;
  phase: "pressed" | "dragging" | "canceled";
  source: Element;
  /** Where the press landed in the pressed pocket or row, as a fraction of its size. */
  grab: Point;
  /** A pocket's size, taken the first time the drag finds a pocket. */
  size: Size | null;
  /** Where the pointer last was while dragging. */
  pointer: Point;
  /** False from a spread turn until the pointer moves again: a turn never arms a drop. */
  armed: boolean;
  /** The pocket shown as the drop target; a release drops only there. */
  target: SlotAddress | null;
};

/**
 * A press becomes a drag once it moves `motion.dragStartPx`; a shorter press stays a tap.
 * The card is a pocket-sized rectangle held where the press grabbed it; it drops into the pocket it covers most, when that pocket takes it.
 * Pass a memoized `allowed`: each new object rechecks the active press and rebinds the listeners.
 */
export function useDragToPocket(
  allowed: Allowed,
  onDrop: (address: SlotAddress, origin: DragOrigin) => void,
) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const press = useRef<Press | null>(null);
  const escapeCanceledCopyDrag = useRef(false);
  const drop = useRef(onDrop);

  useLayoutEffect(() => {
    drop.current = onDrop;
  }, [onDrop]);

  useLayoutEffect(() => {
    const cancel = () => {
      if (press.current) {
        press.current.phase = "canceled";
        setDrag(null);
      }
    };
    const active = press.current;
    if (
      active &&
      (!mayDrag(active.origin, allowed) ||
        (active.origin.kind === "copy" && active.spread !== allowed.spread))
    ) {
      cancel();
    } else if (active && active.spread !== allowed.spread) {
      // The spread turned under a still pointer: nothing is a target until it moves.
      active.spread = allowed.spread;
      active.armed = false;
      active.target = null;
      setDrag((current) => current && { ...current, target: null });
    }

    const follow = (current: Press) => {
      sizeGhost(current);
      const { ghost, target } = hold(current);
      current.target = current.armed ? target : null;
      setDrag({ origin: current.origin, ghost, target: current.target });
    };
    const end = () => {
      press.current = null;
      setDrag(null);
    };
    const onMove = (event: globalThis.PointerEvent) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (current.phase === "canceled") return;
      if ((event.buttons & 1) === 0) {
        cancel();
        return;
      }
      const moved = Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      );
      if (current.phase === "pressed" && moved < DRAG_START_PX) return;
      current.phase = "dragging";
      current.armed = true;
      current.pointer = { x: event.clientX, y: event.clientY };
      follow(current);
    };
    // A scroll or a resize moves the pockets under a still pointer.
    const onLayout = () => {
      const current = press.current;
      if (current?.phase === "dragging") follow(current);
    };
    const onUp = (event: globalThis.PointerEvent) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (current.phase !== "pressed") swallowSourceClick(current.source);
      if (current.phase === "dragging" && event.button === 0) {
        current.pointer = { x: event.clientX, y: event.clientY };
        sizeGhost(current);
        const { target } = hold(current);
        if (target && current.target && sameSlot(target, current.target)) {
          drop.current(target, current.origin);
        }
      }
      end();
    };
    const onCancel = (event: globalThis.PointerEvent) => {
      if (press.current?.pointerId === event.pointerId) end();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Escape repeats still belong to the same press after the pointer is released.
      if (!event.repeat) escapeCanceledCopyDrag.current = false;
      if (press.current?.phase === "dragging") {
        if (press.current.origin.kind === "copy") {
          escapeCanceledCopyDrag.current = true;
        }
        cancel();
      }
      if (escapeCanceledCopyDrag.current) event.stopPropagation();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("scroll", onLayout, true);
    window.addEventListener("resize", onLayout);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("scroll", onLayout, true);
      window.removeEventListener("resize", onLayout);
    };
  }, [allowed]);

  const start = (origin: DragOrigin, event: PointerEvent): boolean => {
    if (event.button !== 0 || !event.isPrimary) return false;
    if (press.current && press.current.pointerId !== event.pointerId)
      return false;
    if (!mayDrag(origin, allowed)) return false;
    if (origin.kind === "copy" && !["mouse", "pen"].includes(event.pointerType))
      return false;
    press.current = {
      origin,
      spread: allowed.spread,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startX: event.clientX,
      startY: event.clientY,
      phase: "pressed",
      source: event.currentTarget,
      grab: grabFraction(
        { x: event.clientX, y: event.clientY },
        event.currentTarget.getBoundingClientRect(),
      ),
      size: null,
      pointer: { x: event.clientX, y: event.clientY },
      armed: true,
      target: null,
    };
    return true;
  };

  return { drag, start };
}

type Allowed = {
  readonly canDragPrinting: boolean;
  readonly canMoveCopy: boolean;
  readonly spread: number;
};

/** Fixes the card's size for the rest of [press] the first time a pocket on screen gives one. */
function sizeGhost(press: Press) {
  press.size ??= pocketSizeOnScreen();
}

/** The card [press] holds under its pointer, and the pocket on screen a release there would drop into. */
function hold(press: Press) {
  const ghost = press.size && ghostAt(press.pointer, press.grab, press.size);
  const covered =
    ghost && coveredMost(ghost, pocketsOnScreen(), DROP_MIN_COVER_SHARE);
  return { ghost, target: covered && dropAddress(press, covered) };
}

/**
 * The pocket a drag covering [pocket] most would drop into. A copy takes any pocket but its own.
 * A printing takes any pocket, except that touch never replaces a filed copy.
 */
function dropAddress(
  { origin, pointerType }: Press,
  { address, filled }: Pocket,
): SlotAddress | null {
  if (origin.kind === "printing") {
    return filled && pointerType === "touch" ? null : address;
  }
  return sameSlot(address, origin.from) ? null : address;
}

/** Whether this kind of origin may be dragged now. */
function mayDrag(origin: DragOrigin, allowed: Allowed): boolean {
  return origin.kind === "copy" ? allowed.canMoveCopy : allowed.canDragPrinting;
}

// A release can produce a click on the drag source, even after Escape.
function swallowSourceClick(source: Element) {
  const cleanup = () => window.removeEventListener("click", swallow, true);
  const swallow = (event: MouseEvent) => {
    if (event.detail === 0 || !event.composedPath().includes(source)) return;
    cleanup();
    event.stopPropagation();
    event.preventDefault();
  };
  window.addEventListener("click", swallow, true);
  window.setTimeout(cleanup, 0);
}
