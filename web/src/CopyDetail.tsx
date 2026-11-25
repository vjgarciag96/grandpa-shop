import { useMemo } from "react";
import { CONDITIONS, type Condition, type Copy } from "./binder";
import type { Catalogue, MonsterStats, Price, Printing } from "./catalogue";
import { Dialog } from "./Dialog";
import { useCatalogueRequest } from "./useCatalogueRequest";

type Props = {
  copy: Copy;
  title: string;
  catalogue: Catalogue;
  onCondition: (condition: Condition) => void;
  onReplace: () => void;
  onRemove: () => void;
  onClose: () => void;
};

/** What a slot holds: the card, the printing that was picked, and the copy's condition. */
export function CopyDetail({
  copy,
  title,
  catalogue,
  onCondition,
  onReplace,
  onRemove,
  onClose,
}: Props) {
  const { card, printing } = copy;
  const price = usePrice(catalogue, printing);
  return (
    <Dialog title={title} onClose={onClose}>
      <div className="detail">
        <img
          className="detail__image"
          src={catalogue.imageUrl(card.passcode)}
          alt={card.name}
        />
        <div className="detail__identity">
          <h3>{card.name}</h3>
          <p className="detail__type">{card.type}</p>
          {card.monster && (
            <p className="detail__stats">{statsLine(card.monster)}</p>
          )}
        </div>
        <div className="detail__content">
          <ul className="detail__printing" aria-label="Printing">
            <li className="detail__code">{printing.setCode}</li>
            <li className="detail__rarity">
              <span className="rarity-mark" aria-hidden="true" />
              {printing.rarity}
            </li>
            <li>{printing.setName}</li>
          </ul>
          {price && <p className="detail__price">{priceLine(price)}</p>}
          <label className="detail__condition">
            <span>Condition</span>
            <select
              value={copy.condition}
              onChange={(event) => onCondition(event.target.value as Condition)}
            >
              {CONDITIONS.map((condition) => (
                <option key={condition}>{condition}</option>
              ))}
            </select>
          </label>
          <p className="detail__text">{card.text}</p>
        </div>
        <div className="detail__actions">
          <button
            type="button"
            className="control control--tonal"
            onClick={onReplace}
          >
            Replace
          </button>
          <button
            type="button"
            className="control control--danger"
            onClick={onRemove}
          >
            Remove from slot
          </button>
        </div>
      </div>
    </Dialog>
  );
}

type PrintingKey = Pick<Printing, "setCode" | "rarity">;

function loadPrice(
  catalogue: Catalogue,
  key: PrintingKey,
  signal: AbortSignal,
  publish: (update: (previous: Price | null) => Price | null) => void,
) {
  void catalogue.price(key, signal).then(
    (price) => publish(() => price),
    () => publish(() => null),
  );
}

function usePrice(catalogue: Catalogue, { setCode, rarity }: Printing) {
  const key = useMemo(() => ({ setCode, rarity }), [setCode, rarity]);
  return useCatalogueRequest<PrintingKey, Price | null>(
    catalogue,
    key,
    loadPrice,
    null,
  ).result;
}

// The guide date parses as UTC midnight, so a viewer west of Greenwich would otherwise see the day before.
const guideDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** 40.06 € · Cardmarket, 23 Nov 2026: the euros keep their sign on the same line. */
function priceLine({ cents, guideDate }: Price): string {
  const euros = (cents / 100).toFixed(2);
  const day = guideDateFormat.format(new Date(guideDate));
  return `${euros}\u00a0€ · Cardmarket, ${day}`;
}

function statsLine(monster: MonsterStats): string {
  const rating =
    monster.rank !== undefined
      ? `Rank ${monster.rank}`
      : monster.linkRating !== undefined
        ? `Link ${monster.linkRating}`
        : `Level ${monster.level}`;
  const attack = `ATK ${monster.atk ?? "?"}`;
  const defense = monster.def !== undefined ? ` / DEF ${monster.def}` : "";
  return `${monster.attribute} · ${monster.race} · ${rating} · ${attack}${defense}`;
}
