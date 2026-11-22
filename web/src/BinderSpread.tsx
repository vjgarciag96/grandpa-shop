import { useRef } from "react";
import {
  pageSlots,
  spreadPages,
  type Binder,
  type SlotAddress,
} from "./binder";
import type { Catalogue } from "./catalogue";
import { SWIPE_THRESHOLD_PX } from "./tokens";

/** A page lifting from the gutter while the binder turns away from [from]. */
export type Turn = { from: number; direction: "forward" | "back" };

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
  const { left, right } = spreadPages(spread);
  const swipeStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const sides = { binder, catalogue, onSlot };

  return (
    <div
      className={stacked ? "spread spread--stacked" : "spread"}
      data-testid="spread"
      onPointerDown={(event) => {
        if (event.button !== 0 || event.isPrimary === false) return;
        swiped.current = false;
        swipeStart.current = {
          id: event.pointerId,
          x: event.clientX,
          y: event.clientY,
        };
      }}
      onPointerCancel={(event) => {
        if (swipeStart.current?.id === event.pointerId) {
          swipeStart.current = null;
        }
      }}
      onPointerUp={(event) => {
        const start = swipeStart.current;
        if (!start || start.id !== event.pointerId) return;
        swipeStart.current = null;
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) >= SWIPE_THRESHOLD_PX && Math.abs(dx) > Math.abs(dy)) {
          swiped.current = true;
          onSwipe(dx < 0 ? "forward" : "back");
        }
      }}
      onClickCapture={(event) => {
        if (swiped.current && event.detail > 0) {
          swiped.current = false;
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
          turn={turn}
          {...sides}
        />
      )}
    </div>
  );
}

/** The sheet being turned: its front is a page of the spread being left, its back a page of the next. */
function TurningPage({
  turn,
  ...sides
}: { turn: Turn } & Omit<SideProps, "page" | "side">) {
  const leaving = spreadPages(turn.from);
  const arriving = spreadPages(
    turn.from + (turn.direction === "forward" ? 1 : -1),
  );
  const [front, back] =
    turn.direction === "forward"
      ? [leaving.right, arriving.left]
      : [leaving.left, arriving.right];
  const [frontSide, backSide]: ["left" | "right", "left" | "right"] =
    turn.direction === "forward" ? ["right", "left"] : ["left", "right"];
  return (
    <div
      className={`page-turn page-turn--${turn.direction}`}
      aria-hidden="true"
      inert
    >
      <div className="page-turn__face">
        <PageSide page={front} side={frontSide} {...sides} />
      </div>
      <div className="page-turn__face page-turn__face--back">
        <PageSide page={back} side={backSide} {...sides} />
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
};

function PageSide({ page, side, binder, catalogue, onSlot }: SideProps) {
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
