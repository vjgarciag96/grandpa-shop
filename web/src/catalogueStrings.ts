import type { Aim } from "./aim";
import { slotName, slotNameInSentence, type Copy } from "./binder";

export function catalogueHeading(
  aim: Aim | null,
  replacing: Copy | null,
): { title: string; hint?: string } {
  if (aim?.kind === "holding") {
    return {
      title: `Holding ${aim.printing.setCode}`,
      hint: "Choose an empty slot",
    };
  }
  if (aim?.kind === "target") {
    return replacing
      ? {
          title: `Replacing ${replacing.card.name}`,
          hint: slotName(aim.address),
        }
      : { title: `Adding to ${slotNameInSentence(aim.address)}` };
  }
  return {
    title: "Add cards",
    hint: "Pick up a printing, then choose an empty slot",
  };
}

export function countOf(count: number, noun: string): string {
  return `${count} ${count === 1 ? noun : `${noun}s`}`;
}
