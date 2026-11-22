import { useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import type { SlotAddress } from "./binder";
import { emptySlotAt } from "./pocketHitTest";
import type { Card, Printing } from "./catalogue";
import { DRAG_START_PX } from "./tokens";

/** A printing being dragged: where the pointer is, and the empty slot under it, if any. */
type Drag = {
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
  phase: "pressed" | "dragging" | "canceled";
  source: Element;
};

/**
 * Drags a printing from the catalogue panel onto an empty slot. A press becomes a drag once it moves
 * `motion.dragStartPx`; a shorter press stays a tap. Slots are found by their `data-empty-slot` attribute.
 */
export function useDragToPocket(
  enabled: boolean,
  onDrop: (address: SlotAddress, card: Card, printing: Printing) => void,
) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const press = useRef<Press | null>(null);
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
    if (!enabled) cancel();

    const end = () => {
      press.current = null;
      setDrag(null);
    };
    const onMove = (event: globalThis.PointerEvent) => {
      const current = press.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (current.phase === "canceled") return;
      const moved = Math.hypot(
        event.clientX - current.startX,
        event.clientY - current.startY,
      );
      if (current.phase === "pressed" && moved < DRAG_START_PX) return;
      current.phase = "dragging";
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
      if (current.phase !== "pressed") swallowSourceClick(current.source);
      if (current.phase === "dragging") {
        const over = emptySlotAt(event.clientX, event.clientY);
        if (over) drop.current(over, current.card, current.printing);
      }
      end();
    };
    const onCancel = (event: globalThis.PointerEvent) => {
      if (press.current?.pointerId === event.pointerId) end();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && press.current?.phase === "dragging") {
        cancel();
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);

  const start = (card: Card, printing: Printing, event: PointerEvent) => {
    if (!enabled || event.button !== 0 || !event.isPrimary) return;
    if (press.current && press.current.pointerId !== event.pointerId) return;
    press.current = {
      card,
      printing,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      phase: "pressed",
      source: event.currentTarget,
    };
  };

  return { drag, start };
}

// A release can produce a click on the source row, even after Escape.
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
