import {
  pageSlots,
  spreadPages,
  type Binder,
  type SlotAddress,
} from "./binder";
import type { Catalogue } from "./catalogue";
import { STACK_BELOW_PX } from "./tokens";
import { useMediaQuery } from "./useMediaQuery";

type Props = {
  binder: Binder;
  spread: number;
  catalogue: Catalogue;
  onSlot: (address: SlotAddress) => void;
};

export function BinderSpread({ binder, spread, catalogue, onSlot }: Props) {
  const { left, right } = spreadPages(spread);
  const stacked = useMediaQuery(`(max-width: ${STACK_BELOW_PX - 1}px)`);
  return (
    <div className={stacked ? "spread spread--stacked" : "spread"}>
      <PageSide page={left} side="left" {...{ binder, catalogue, onSlot }} />
      <div className="spine" aria-hidden="true" />
      <PageSide page={right} side="right" {...{ binder, catalogue, onSlot }} />
    </div>
  );
}

function PageSide({
  page,
  side,
  binder,
  catalogue,
  onSlot,
}: Omit<Props, "spread"> & { page: number | null; side: "left" | "right" }) {
  if (page === null) {
    return <div className={`page-side page-side--${side} page-side--cover`} />;
  }
  return (
    <section
      className={`page-side page-side--${side} page`}
      aria-label={`Page ${page}`}
    >
      <div className="page__grid">
        {pageSlots(binder, page).map((copy, position) => {
          const label = `Page ${page}, slot ${position + 1}`;
          return (
            <button
              key={position}
              type="button"
              className={copy ? "slot slot--filled" : "slot slot--empty"}
              aria-label={
                copy ? `${label}: ${copy.card.name}` : `${label}, empty`
              }
              onClick={() => onSlot({ page, position })}
            >
              {copy && (
                <img
                  src={catalogue.imageUrl(copy.card.passcode)}
                  alt={copy.card.name}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="page__number" aria-hidden="true">
        {page}
      </div>
    </section>
  );
}
