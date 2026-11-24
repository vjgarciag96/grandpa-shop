import type { Card, CardSet, MonsterStats, Price, Printing } from "./catalogue";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isList<T>(
  value: unknown,
  isItem: (item: unknown) => item is T,
): value is T[] {
  return Array.isArray(value) && value.every(isItem);
}

export function isCard(value: unknown): value is Card {
  return (
    isRecord(value) &&
    Number.isSafeInteger(value.passcode) &&
    typeof value.name === "string" &&
    (value.kind === "Monster" ||
      value.kind === "Spell" ||
      value.kind === "Trap") &&
    typeof value.type === "string" &&
    typeof value.text === "string" &&
    (value.monster === undefined || isMonsterStats(value.monster)) &&
    isList(value.printings, isPrinting)
  );
}

function isMonsterStats(value: unknown): value is MonsterStats {
  return (
    isRecord(value) &&
    typeof value.attribute === "string" &&
    typeof value.race === "string" &&
    [value.level, value.rank, value.linkRating, value.atk, value.def].every(
      (stat) => stat === undefined || Number.isInteger(stat),
    )
  );
}

function isPrinting(value: unknown): value is Printing {
  return (
    isRecord(value) &&
    typeof value.setCode === "string" &&
    typeof value.setName === "string" &&
    typeof value.rarity === "string"
  );
}

export function isCardSet(value: unknown): value is CardSet {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.prefix === "string" &&
    typeof value.printings === "number" &&
    Number.isSafeInteger(value.printings) &&
    value.printings >= 0
  );
}

type SetPrintingResponse = {
  setCode: string;
  rarity: string;
  passcode: number;
};

export function isSetPrinting(value: unknown): value is SetPrintingResponse {
  return (
    isRecord(value) &&
    typeof value.setCode === "string" &&
    typeof value.rarity === "string" &&
    Number.isSafeInteger(value.passcode)
  );
}

export function isPrice(value: unknown): value is Price {
  return (
    isRecord(value) &&
    typeof value.cents === "number" &&
    Number.isSafeInteger(value.cents) &&
    value.cents >= 0 &&
    typeof value.guideDate === "string" &&
    isCalendarDay(value.guideDate)
  );
}

function isCalendarDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}
