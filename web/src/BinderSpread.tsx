import { useRef, type PointerEvent } from "react";
import { isTarget, type Aim } from "./aim";
import {
  pageSlots,
  sameSlot,
  slotName,
  spreadPages,
  type Binder,
  type Copy,
  type SlotAddress,
} from "./binder";
import { binderMarker, pocketMarker } from "./pocketsOnPage";
import type { Catalogue } from "./catalogue";
import { SWIPE_THRESHOLD_PX } from "./tokens";
import type { Turn } from "./useSpreadTurns";

type OpenSlot = (address: SlotAddress, button: HTMLButtonElement) => void;
type PressCopy = (
  from: SlotAddress,
  copy: Copy,
  event: PointerEvent,
) => boolean;

type Props = {
  binder: Binder;
  spread: number;
  stacked: boolean;
  turn: Turn | null;
  aim: Aim | null;
  /** The slot the drag would drop into: empty or filled, never the source. */
  dropTarget: SlotAddress | null;
  movingCopy: boolean;
  /** The slot of a copy dragged off the binder: it looks empty until the copy leaves on release. */
  removing: SlotAddress | null;
  catalogue: Catalogue;
  onSlot: OpenSlot;
  onCopyPress: PressCopy;
  onSwipe: (direction: Turn["direction"]) => void;
};

export function BinderSpread({
  binder,
  spread,
  stacked,
  turn,
  aim,
  dropTarget,
  movingCopy,
  removing,
  catalogue,
  onSlot,
  onCopyPress,
  onSwipe,
}: Props) {
  const arriving = spreadPages(spread);
  const leaving = turn ? spreadPages(turn.from) : arriving;
  const left = turn?.direction === "forward" ? leaving.left : arriving.left;
  const right = turn?.direction === "back" ? leaving.right : arriving.right;
  const swipeStart = useRef<{ id: number; x: number; y: number } | null>(null);
  const suppressPointerClick = useRef(false);
  const sides = {
    binder,
    aim,
    dropTarget,
    movingCopy,
    removing,
    catalogue,
    onSlot,
    onCopyPress,
    inert: turn !== null,
  };
  const stopTracking = (event: PointerEvent) => {
    if (swipeStart.current?.id === event.pointerId) swipeStart.current = null;
  };

  return (
    <div
      className={stacked ? "spread spread--stacked" : "spread"}
      data-testid="spread"
      {...binderMarker()}
      onPointerDownCapture={(event) => {
        if (event.button === 0 && event.isPrimary !== false) {
          suppressPointerClick.current = false;
        }
      }}
      onPointerDown={(event) => {
        if (event.button !== 0 || event.isPrimary === false) return;
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
  aim: Aim | null;
  dropTarget: SlotAddress | null;
  movingCopy: boolean;
  removing: SlotAddress | null;
  catalogue: Catalogue;
  onSlot: OpenSlot;
  onCopyPress: PressCopy;
  inert: boolean;
};

function PageSide({
  page,
  side,
  binder,
  aim,
  dropTarget,
  movingCopy,
  removing,
  catalogue,
  onSlot,
  onCopyPress,
  inert,
}: SideProps) {
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
          const address = { page, position };
          const label = slotName(address);
          const dropping = dropTarget !== null && sameSlot(dropTarget, address);
          const shown =
            removing !== null && sameSlot(removing, address) ? null : copy;
          const aimed =
            isTarget(aim, address) ||
            ((movingCopy || aim?.kind === "holding") && !copy) ||
            (dropping && copy !== null);
          const className = [
            shown ? "slot slot--filled" : "slot slot--empty",
            aimed && "slot--aimed",
            dropping && !copy && "slot--drop",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={position}
              type="button"
              className={className}
              {...(inert ? undefined : pocketMarker(address, copy !== null))}
              aria-label={
                copy ? `${label}: ${copy.card.name}` : `${label}, empty`
              }
              onPointerDown={(event) => {
                if (copy && !inert && onCopyPress(address, copy, event)) {
                  event.stopPropagation();
                }
              }}
              onClick={(event) => onSlot(address, event.currentTarget)}
            >
              {shown && (
                <img
                  src={catalogue.imageUrl(shown.card.passcode)}
                  alt={shown.card.name}
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
