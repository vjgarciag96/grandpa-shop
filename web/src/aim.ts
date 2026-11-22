import { sameSlot, type SlotAddress } from "./binder";
import type { Card, Printing } from "./catalogue";

/**
 * Where the catalogue panel's next printing goes: into a target slot, or held until a slot is chosen.
 * A target is an empty slot, or a filled one whose copy is being replaced.
 */
export type Aim =
  | { readonly kind: "target"; readonly address: SlotAddress }
  | {
      readonly kind: "holding";
      readonly card: Card;
      readonly printing: Printing;
    };

/** What choosing a slot in the binder does, given the aim and whether the slot holds a copy. */
export type SlotChoice =
  | {
      readonly kind: "place";
      readonly card: Card;
      readonly printing: Printing;
    }
  | { readonly kind: "refuse" }
  | { readonly kind: "open-detail" }
  | { readonly kind: "target" };

/** What choosing a printing in the panel does: place it in the target, or change the aim. */
export type PrintingChoice =
  | { readonly kind: "place"; readonly address: SlotAddress }
  | { readonly kind: "aim"; readonly aim: Aim | null };

export function chooseSlot(aim: Aim | null, filled: boolean): SlotChoice {
  if (aim?.kind === "holding") {
    return filled
      ? { kind: "refuse" }
      : { kind: "place", card: aim.card, printing: aim.printing };
  }
  return filled ? { kind: "open-detail" } : { kind: "target" };
}

export function choosePrinting(
  aim: Aim | null,
  card: Card,
  printing: Printing,
): PrintingChoice {
  if (aim?.kind === "target") return { kind: "place", address: aim.address };
  if (isHeld(aim, card, printing)) return { kind: "aim", aim: null };
  return { kind: "aim", aim: { kind: "holding", card, printing } };
}

export function isHeld(aim: Aim | null, card: Card, printing: Printing) {
  return (
    aim?.kind === "holding" &&
    aim.card.passcode === card.passcode &&
    aim.printing.setCode === printing.setCode &&
    aim.printing.rarity === printing.rarity &&
    aim.printing.setName === printing.setName
  );
}

export function isTarget(aim: Aim | null, address: SlotAddress) {
  return aim?.kind === "target" && sameSlot(aim.address, address);
}
