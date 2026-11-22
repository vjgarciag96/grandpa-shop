import { useRef, type PointerEvent } from "react";
import {
  pageSlots,
  spreadPages,
  type Binder,
  type SlotAddress,
} from "./binder";
import type { Catalogue } from "./catalogue";
import { SWIPE_THRESHOLD_PX } from "./tokens";
import type { Turn } from "./useSpreadTurns";

type Props = {
  binder: Binder;
  spread: number;
  stacked: boolean;
  turn: Turn | null;
  catalogue: Catalogue;
  onSlot: (address: SlotAddress) => void;
  onSwipe: (direction: Turn["direction"]) => void;
};

export function BinderSpread({
  binder,
  spread,
  stacked,
  turn,
  catalogue,
  onSlot,
  onSwipe,
}: Props) {
  const arriving = spreadPages(spread);
  const leaving = turn ? spreadPages(turn.from) : arriving;
  const left = turn?.direction === "forward" ? leaving.left : arriving.left;
  const right = turn?.direction === "back" ? leaving.right : arriving.right;
  const swipeStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressPointerClick = useRef(false);
  const sides = { binder, catalogue, onSlot, inert: turn !== null };
  const stopTracking = (event: PointerEvent) => {
    if (swipeStart.current?.id === event.pointerId) swipeStart.current = null;
  };

  return (
    <div
      className={stacked ? "spread spread--stacked" : "spread"}
      data-testid="spread"
      onPointerDown={(event) => {
        if (event.button !== 0 || event.isPrimary === false) return;
        suppressPointerClick.current = false;
        swipeStart.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        };
      }}
      onPointerCancel={stopTracking}
      onPointerLeave={stopTracking}
      onPointerUp={(event) => {
        const start = swipeStart.current;
        if (!start || start.id !== event.pointerId) return;
        swipeStart.current = null;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
          suppressPointerClick.current = true;
          onSwipe(dx < 0 ? "forward" : "back");
        }
      }}
      onClickCapture={(event) => {
        // Keyboard activation has no pointer click count.
        if (suppressPointerClick.current && event.detail > 0) {
          suppressPointerClick.current = false;
          event.stopPropagation();
        }
      }}
    >
      <PageSide page={left} side="left" {...sides} />
      <div className="spine" aria-hidden="true" />
      <PageSide page={right} side="right" {...sides} />
      {turn && (
        <TurningPage
          key={`${turn.from}-${turn.direction}`}
          direction={turn.direction}
          leaving={leaving}
          arriving={arriving}
          {...sides}
        />
      )}
    </div>
  );
}

/** The sheet being turned: its front is a page of the spread being left, its back a page of the next. */
function TurningPage({
  direction,
  leaving,
  arriving,
  ...sides
}: {
  direction: Turn["direction"];
  leaving: ReturnType<typeof spreadPages>;
  arriving: ReturnType<typeof spreadPages>;
} & Omit<SideProps, "page" | "side">) {
  const [frontSide, backSide]: ["left" | "right", "left" | "right"] =
    direction === "forward" ? ["right", "left"] : ["left", "right"];
  return (
    <div
      className={`page-turn page-turn--${direction}`}
      aria-hidden="true"
      inert
    >
      <div className="page-turn__face">
        <PageSide page={leaving[frontSide]} side={frontSide} {...sides} />
      </div>
      <div className="page-turn__face page-turn__face--back">
        <PageSide page={arriving[backSide]} side={backSide} {...sides} />
      </div>
    </div>
  );
}

type SideProps = {
  page: number | null;
  side: "left" | "right";
  binder: Binder;
  catalogue: Catalogue;
  onSlot: (address: SlotAddress) => void;
  inert: boolean;
};

function PageSide({ page, side, binder, catalogue, onSlot, inert }: SideProps) {
  if (page === null) {
    return <div className={`page-side page-side--${side} page-side--cover`} />;
  }
  return (
    <section
      className={`page-side page-side--${side} page`}
      aria-label={`Page ${page}`}
      inert={inert}
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
                  draggable={false}
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
