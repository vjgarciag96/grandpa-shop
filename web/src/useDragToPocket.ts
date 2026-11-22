import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { sameSlot, type Copy, type SlotAddress } from "./binder";
import { dropSlotAt, type DropSlot } from "./pocketHitTest";
import type { Card, Printing } from "./catalogue";
import { DRAG_START_PX } from "./tokens";

export type DragOrigin =
  | { kind: "printing"; card: Card; printing: Printing }
  | { kind: "copy"; from: SlotAddress; copy: Copy };

type Drag = {
  readonly origin: DragOrigin;
  readonly x: number;
  readonly y: number;
  readonly over: SlotAddress | null;
};

type Press = {
  origin: DragOrigin;
  spread: number;
  pointerId: number;
  startX: number;
  startY: number;
  phase: "pressed" | "dragging" | "canceled";
  source: Element;
};

/**
 * A press becomes a drag once it moves `motion.dragStartPx`; a shorter press stays a tap.
 * Slots are found by their `data-drop-slot` attribute.
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
    }

    const end = () => {
      press.current = null;
      setDrag(null);
    };
    const onMove = (event: globalThis.PointerEvent) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (current.phase === "canceled") return;
      if (current.origin.kind === "copy" && (event.buttons & 1) === 0) {
        cancel();
        return;
      }
      const moved = Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      );
      if (current.phase === "pressed" && moved < DRAG_START_PX) return;
      current.phase = "dragging";
      setDrag({
        origin: current.origin,
        x: event.clientX,
        y: event.clientY,
        over: dropAddress(
          current.origin,
          dropSlotAt(event.clientX, event.clientY),
        ),
      });
    };
    const onUp = (event: globalThis.PointerEvent) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (current.phase !== "pressed") swallowSourceClick(current.source);
      if (
        current.phase === "dragging" &&
        (current.origin.kind === "printing" || event.button === 0)
      ) {
        const over = dropAddress(
          current.origin,
          dropSlotAt(event.clientX, event.clientY),
        );
        if (over) drop.current(over, current.origin);
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
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKeyDown, true);
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
      startX: event.clientX,
      startY: event.clientY,
      phase: "pressed",
      source: event.currentTarget,
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

/** Whether this kind of origin may be dragged now. */
function mayDrag(origin: DragOrigin, allowed: Allowed): boolean {
  return origin.kind === "copy" ? allowed.canMoveCopy : allowed.canDragPrinting;
}

/** The pocket a drag would drop into: a copy takes any pocket but its own, a printing only an empty one. */
function dropAddress(
  origin: DragOrigin,
  hit: DropSlot | null,
): SlotAddress | null {
  if (!hit) return null;
  if (origin.kind === "printing") return hit.filled ? null : hit.address;
  return sameSlot(hit.address, origin.from) ? null : hit.address;
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
