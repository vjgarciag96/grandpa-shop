import { fireEvent } from "@testing-library/react";
import { centreOf } from "./layout";

// These drive a drag on the boxes `stubLayout` lays out, so a test using them stubs the layout first.

/** A point well away from the binder and the panel. */
export const awayFromBinder = { x: 800, y: 700 } as const;

/** Presses the primary button on [element] at (x, y). */
export function pressAt(
  element: Element,
  x: number,
  y: number,
  pointerType = "mouse",
) {
  fireEvent.pointerDown(element, {
    pointerType,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: x,
    clientY: y,
  });
}

/** Presses the primary button on a catalogue printing row at the centre of its box, so the card is held by its centre. */
export function press(row: Element, pointerType = "mouse") {
  const { x, y } = centreOf(row);
  pressAt(row, x, y, pointerType);
}

/** Moves the pointer; `buttons` is the set of buttons still held, the primary one by default. */
export function moveTo(x: number, y: number, buttons = 1) {
  fireEvent.pointerMove(window, {
    pointerId: 1,
    clientX: x,
    clientY: y,
    buttons,
  });
}

/** Moves the pointer to the centre of [pocket], so a card held by its centre covers it exactly. */
export function moveOnto(pocket: Element, buttons = 1) {
  const { x, y } = centreOf(pocket);
  moveTo(x, y, buttons);
}

/** Releases the primary button; the browser then clicks the row the press began on. */
export function release(row: Element, x: number, y: number) {
  fireEvent.pointerUp(window, {
    pointerId: 1,
    button: 0,
    clientX: x,
    clientY: y,
  });
  fireEvent.click(row, { detail: 1 });
}

/** Releases the primary button over the centre of [pocket]. */
export function releaseOnto(row: Element, pocket: Element) {
  const { x, y } = centreOf(pocket);
  release(row, x, y);
}

/** Releases the secondary button, which a browser follows with a context menu, not a click. */
export function releaseSecondary(x: number, y: number) {
  fireEvent.pointerUp(window, {
    pointerId: 1,
    button: 2,
    clientX: x,
    clientY: y,
  });
}

/** Drags a catalogue printing with the mouse and drops it on a pocket. */
export function dragPrintingWithMouse(row: Element, destination: Element) {
  press(row);
  moveOnto(destination);
  releaseOnto(row, destination);
}

/** Presses a filed copy at its centre and drags it onto the centre of `target`, or away from the binder for null. */
export function dragCopy(
  source: HTMLElement,
  target: Element | null,
  pointerType = "mouse",
) {
  const from = centreOf(source);
  pressAt(source, from.x, from.y, pointerType);
  if (target) moveOnto(target);
  else moveTo(awayFromBinder.x, awayFromBinder.y);
}

/** Releases a dragged copy over the centre of `target`; the browser then clicks the copy the press began on. */
export function releaseCopy(source: HTMLElement, target: Element = source) {
  const { x, y } = centreOf(target);
  fireEvent.pointerUp(target, {
    pointerId: 1,
    button: 0,
    clientX: x,
    clientY: y,
  });
  fireEvent.click(source, { detail: 1 });
}

/** Drags a filed copy with the mouse and drops it on a pocket. */
export function moveCopyWithMouse(source: HTMLElement, destination: Element) {
  dragCopy(source, destination);
  releaseCopy(source, destination);
}

/** Drags a filed copy with the mouse away from the binder and releases it there. */
export function removeCopyWithMouse(source: HTMLElement) {
  dragCopy(source, null);
  release(source, awayFromBinder.x, awayFromBinder.y);
}
