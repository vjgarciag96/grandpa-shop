import { fireEvent } from "@testing-library/react";

/** jsdom does no layout, so the element under the pointer is whatever the test says it is. */
export function pointerIsOver(element: Element | null) {
  document.elementFromPoint = () => element;
}

/** Presses the primary button on a catalogue printing row, at the panel's side of the screen. */
export function press(row: Element, pointerType = "mouse") {
  fireEvent.pointerDown(row, {
    pointerType,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: 900,
    clientY: 300,
  });
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
  pointerIsOver(destination);
  press(row);
  moveTo(400, 300);
  release(row, 400, 300);
}

/** Presses a filed copy and drags it past the drag distance, over `target`. */
export function dragCopy(
  source: HTMLElement,
  target: Element | null,
  pointerType = "mouse",
) {
  pointerIsOver(target);
  fireEvent.pointerDown(source, {
    pointerType,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: 1,
    clientX: 700,
    clientY: 300,
  });
  moveTo(400, 300);
}

/** Releases a dragged copy over `target`; the browser then clicks the copy the press began on. */
export function releaseCopy(source: HTMLElement, target: Element = source) {
  fireEvent.pointerUp(target, {
    pointerId: 1,
    button: 0,
    clientX: 400,
    clientY: 300,
  });
  fireEvent.click(source, { detail: 1 });
}

/** Drags a filed copy with the mouse and drops it on a pocket. */
export function moveCopyWithMouse(source: HTMLElement, destination: Element) {
  dragCopy(source, destination);
  releaseCopy(source, destination);
}
