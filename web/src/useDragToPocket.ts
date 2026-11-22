import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { SlotAddress } from "./binder";
import type { Card, Printing } from "./catalogue";
import { DRAG_START_PX } from "./tokens";

/** A printing being dragged: where the pointer is, and the empty slot under it, if any. */
export type Drag = {
  readonly card: Card;
  readonly printing: Printing;
  readonly x: number;
  readonly y: number;
  readonly over: SlotAddress | null;
};

type Press = {
  card: Card;
  printing: Printing;
  pointerId: number;
  startX: number;
  startY: number;
  dragging: boolean;
};

/**
 * Drags a printing from the catalogue panel onto an empty slot. A press becomes a drag once it moves
 * `motion.dragStartPx`; a shorter press stays a tap. Slots are found by their `data-empty-slot` attribute.
 */
export function useDragToPocket(
  onDrop: (address: SlotAddress, card: Card, printing: Printing) => void,
) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const press = useRef<Press | null>(null);
  const drop = useRef(onDrop);

  useEffect(() => {
    drop.current = onDrop;
  }, [onDrop]);

  useEffect(() => {
    const end = () => {
      press.current = null;
      setDrag(null);
    };
    const onMove = (event: globalThis.PointerEvent) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;
      const moved = Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      );
      if (!current.dragging && moved < DRAG_START_PX) return;
      current.dragging = true;
      setDrag({
        card: current.card,
        printing: current.printing,
        x: event.clientX,
        y: event.clientY,
        over: emptySlotAt(event.clientX, event.clientY),
      });
    };
    const onUp = (event: globalThis.PointerEvent) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (current.dragging) {
        swallowNextClick();
        const over = emptySlotAt(event.clientX, event.clientY);
        if (over) drop.current(over, current.card, current.printing);
      }
      end();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && press.current?.dragging) end();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", end);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const start = (card: Card, printing: Printing, event: PointerEvent) => {
    if (event.button !== 0 || !event.isPrimary) return;
    press.current = {
      card,
      printing,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
    };
  };

  return { drag, start };
}

function emptySlotAt(x: number, y: number): SlotAddress | null {
  const slot = document
    .elementFromPoint(x, y)
    ?.closest<HTMLElement>("[data-empty-slot]");
  if (!slot) return null;
  const [page, position] = (slot.dataset.emptySlot ?? "").split(":");
  return { page: Number(page), position: Number(position) };
}

// The press that ended a drag also ends in a click on the printing; that click must not pick it up.
function swallowNextClick() {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
  };
  window.addEventListener("click", swallow, { capture: true, once: true });
  window.setTimeout(
    () => window.removeEventListener("click", swallow, { capture: true }),
    0,
  );
}
