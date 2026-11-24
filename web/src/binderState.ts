import { movedPrinting, placedPrinting, removedPrinting } from "./strings";
import { isTarget, type Aim } from "./aim";
import {
  moveCopy,
  place,
  removeCopy,
  slotAt,
  type Binder,
  type Copy,
  type SlotAddress,
} from "./binder";
import { announced, silence, type Announcement } from "./announcement";
import type { Card, Printing } from "./catalogue";

export type BinderState = {
  binder: Binder;
  aim: Aim | null;
  moveAnnouncement: Announcement;
  /** What the catalogue says about placing: decided in the same update as the placement. */
  announcement: Announcement;
};

export function binderState(binder: Binder): BinderState {
  return {
    binder,
    aim: null,
    moveAnnouncement: silence,
    announcement: silence,
  };
}

/** Files a Near Mint copy and announces any replacement. */
export function placeAt(
  current: BinderState,
  address: SlotAddress,
  card: Card,
  printing: Printing,
): BinderState {
  const replaced = slotAt(current.binder, address);
  return {
    ...current,
    binder: place(current.binder, address, {
      card,
      printing,
      condition: "Near Mint",
    }),
    aim: null,
    announcement: announced(
      current.announcement,
      placedPrinting(printing.setCode, address, replaced?.printing.setCode),
    ),
  };
}

export function moveAt(
  current: BinderState,
  to: SlotAddress,
  from: SlotAddress,
  copy: Copy,
): BinderState {
  const move = moveCopy(current.binder, from, to, copy);
  if (move.kind === "refused") return current;
  const swapped = move.kind === "swapped";
  return {
    ...current,
    binder: move.binder,
    aim:
      isTarget(current.aim, to) || (swapped && isTarget(current.aim, from))
        ? null
        : current.aim,
    moveAnnouncement: announced(
      current.moveAnnouncement,
      movedPrinting(
        copy.printing.setCode,
        to,
        from,
        swapped ? move.displaced.printing.setCode : undefined,
      ),
    ),
  };
}

/** Takes a dragged copy out. A catalogue target on its pocket stays, now empty. */
export function removeAt(
  current: BinderState,
  from: SlotAddress,
  copy: Copy,
): BinderState {
  const removal = removeCopy(current.binder, from, copy);
  if (removal.kind === "refused") return current;
  return {
    ...current,
    binder: removal.binder,
    moveAnnouncement: announced(
      current.moveAnnouncement,
      removedPrinting(copy.printing.setCode, from),
    ),
  };
}
