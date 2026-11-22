import { CONDITIONS, type Condition, type Copy } from "./binder";
import type { Catalogue, MonsterStats } from "./catalogue";
import { Dialog } from "./Dialog";

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
  return (
    <Dialog title={title} className="copy-dialog" onClose={onClose}>
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
