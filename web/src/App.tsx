import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { chooseSlot, choosePrinting, isTarget, type Aim } from "./aim";
import { BinderSpread } from "./BinderSpread";
import { CataloguePanel } from "./CataloguePanel";
import { CopyDetail } from "./CopyDetail";
import { loadBinder, saveBinder } from "./savedBinder";
import {
  changeCondition,
  moveCopy,
  place,
  remove,
  removeCopy,
  slotAt,
  slotNameInSentence,
  slotName,
  spreadPages,
  type Binder,
  type Copy,
  type SlotAddress,
} from "./binder";
import type { Card, Catalogue, Printing } from "./catalogue";
import {
  announced,
  silence,
  silenced,
  type Announcement,
} from "./announcement";
import { LiveRegion } from "./LiveRegion";
import { PANEL_BESIDE_FROM_PX, STACK_BELOW_PX } from "./tokens";
import { useMediaQuery } from "./useMediaQuery";
import { useDragToPocket } from "./useDragToPocket";
import { useSpreadTurns } from "./useSpreadTurns";

type BinderState = {
  binder: Binder;
  aim: Aim | null;
  moveAnnouncement: Announcement;
  /** What the catalogue says about placing: decided in the same update as the placement. */
  announcement: Announcement;
};

export default function App({ catalogue }: { catalogue: Catalogue }) {
  const [{ binder, aim, moveAnnouncement, announcement }, setBinderState] =
    useState<BinderState>(() => ({
      binder: loadBinder(),
      aim: null,
      moveAnnouncement: silence,
      announcement: silence,
    }));
  const [detail, setDetail] = useState<SlotAddress | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelFocus, setPanelFocus] = useState(0);
  const closeDetail = useCallback(() => setDetail(null), []);
  const opener = useRef<HTMLButtonElement>(null);
  const addCards = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    if (detail === null && opener.current) {
      opener.current.focus({ preventScroll: true });
      opener.current = null;
    }
  }, [detail]);

  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const stacked = useMediaQuery(`(width < ${STACK_BELOW_PX}px)`);
  const beside = useMediaQuery(`(width >= ${PANEL_BESIDE_FROM_PX}px)`);
  const { spread, turn, go, canGoBack, canGoForward } = useSpreadTurns(
    reducedMotion || stacked,
  );
  const { left, right } = spreadPages(spread);

  useEffect(() => saveBinder(binder), [binder]);

  const setAim = useCallback(
    (aim: Aim | null) => setBinderState((current) => ({ ...current, aim })),
    [],
  );

  const silenceCatalogue = useCallback(
    () =>
      setBinderState((current) => ({
        ...current,
        announcement: silenced(current.announcement),
      })),
    [],
  );

  useEffect(() => {
    if (detail) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAim(null);
        silenceCatalogue();
      }
      if (isTextField(event.target)) return;
      if (event.key === "ArrowRight") go("forward");
      if (event.key === "ArrowLeft") go("back");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [detail, go, setAim, silenceCatalogue]);

  const announce = (text: string) =>
    setBinderState((current) => ({
      ...current,
      announcement: announced(current.announcement, text),
    }));

  const openPanel = (nextAim: Aim | null) => {
    setPanelOpen(true);
    setAim(nextAim);
    setPanelFocus((count) => count + 1);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setAim(null);
    silenceCatalogue();
    addCards.current?.focus();
  };

  /** Files a Near Mint copy, and names the copy it replaced, if any. */
  const placeAt = (address: SlotAddress, card: Card, printing: Printing) => {
    setBinderState((current) => {
      const replaced = slotAt(current.binder, address);
      const placed = `Placed ${printing.setCode} in ${slotNameInSentence(address)}`;
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
          replaced
            ? `${placed}, replacing ${replaced.printing.setCode}.`
            : `${placed}.`,
        ),
      };
    });
  };

  const canDragPrinting = panelOpen && beside && detail === null;
  const canMoveCopy = turn === null && detail === null;

  const visible = (page: number) => page === left || page === right;

  const moveAt = (to: SlotAddress, from: SlotAddress, copy: Copy) => {
    if (!canMoveCopy || !visible(from.page) || !visible(to.page)) return;

    setBinderState((current) => {
      const move = moveCopy(current.binder, from, to, copy);
      if (move.kind === "refused") return current;
      const swapped = move.kind === "swapped";
      const moved = `${copy.printing.setCode} to ${slotNameInSentence(to)}`;
      return {
        ...current,
        binder: move.binder,
        aim:
          isTarget(current.aim, to) || (swapped && isTarget(current.aim, from))
            ? null
            : current.aim,
        moveAnnouncement: announced(
          current.moveAnnouncement,
          swapped
            ? `Swapped ${moved} and ${move.displaced.printing.setCode} to ${slotNameInSentence(from)}.`
            : `Moved ${moved}.`,
        ),
      };
    });
  };

  /** Takes a dragged copy out of the binder. A catalogue target on its pocket stays, now empty. */
  const removeAt = (from: SlotAddress, copy: Copy) => {
    if (!canMoveCopy || !visible(from.page)) return;

    setBinderState((current) => {
      const removal = removeCopy(current.binder, from, copy);
      if (removal.kind === "refused") return current;
      return {
        ...current,
        binder: removal.binder,
        moveAnnouncement: announced(
          current.moveAnnouncement,
          `Removed ${copy.printing.setCode} from ${slotNameInSentence(from)}.`,
        ),
      };
    });
  };

  const allowedDrags = useMemo(
    () => ({ canDragPrinting, canMoveCopy, spread }),
    [canDragPrinting, canMoveCopy, spread],
  );
  const { drag, start: startDrag } = useDragToPocket(
    allowedDrags,
    (target, origin) => {
      if (origin.kind === "printing") {
        if (target.kind === "pocket") {
          placeAt(target.address, origin.card, origin.printing);
        }
      } else if (target.kind === "off-binder") {
        removeAt(origin.from, origin.copy);
      } else {
        moveAt(target.address, origin.from, origin.copy);
      }
    },
  );
  const origin = drag?.origin;
  /** The pocket of a copy whose card is off the binder, which a release now would empty. */
  const removing =
    origin?.kind === "copy" && drag?.target?.kind === "off-binder"
      ? origin.from
      : null;
  const shownAim: Aim | null =
    origin?.kind === "printing"
      ? { kind: "holding", card: origin.card, printing: origin.printing }
      : aim;

  const onSlot = (address: SlotAddress, button: HTMLButtonElement) => {
    const choice = chooseSlot(aim, slotAt(binder, address) !== null);
    switch (choice.kind) {
      case "place":
        return placeAt(address, choice.card, choice.printing);
      case "refuse":
        return announce(`${slotName(address)} is filled.`);
      case "open-detail":
        opener.current = button;
        return setDetail(address);
      case "target":
        return openPanel({ kind: "target", address });
    }
  };

  const onPrinting = (card: Card, printing: Printing) => {
    const choice = choosePrinting(aim, card, printing);
    if (choice.kind === "place") placeAt(choice.address, card, printing);
    else setAim(choice.aim);
  };

  const copy = detail && slotAt(binder, detail);
  const deskLayout = panelOpen
    ? beside
      ? " desk--beside"
      : " desk--sheet"
    : "";

  return (
    <main className={`desk${deskLayout}`}>
      <div className="desk__main" inert={detail !== null}>
        <header className="desk__head">
          <div className="desk__identity">
            <span className="desk__mark" aria-hidden="true" />
            <div>
              <h1>Grandpa Shop</h1>
              <p>Cards you place are kept in this browser for now.</p>
            </div>
          </div>
          <div className="desk__actions">
            <button
              ref={addCards}
              type="button"
              className="control control--tonal"
              onClick={() => openPanel(null)}
            >
              <span aria-hidden="true">+</span> Add cards
            </button>
            <nav className="binder__turns" aria-label="Turn the binder">
              <button
                type="button"
                className="control control--icon control--tonal"
                aria-label="Previous spread"
                disabled={!canGoBack}
                onClick={() => go("back")}
              >
                <span className="chevron chevron--back" aria-hidden="true" />
              </button>
              <span className="binder__position" aria-live="polite">
                {pagesLabel(left, right)}
              </span>
              <button
                type="button"
                className="control control--icon control--tonal"
                aria-label="Next spread"
                disabled={!canGoForward}
                onClick={() => go("forward")}
              >
                <span className="chevron" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </header>
        <div className="desk__binder">
          <div className="binder">
            <BinderSpread
              binder={binder}
              spread={spread}
              stacked={stacked}
              turn={turn}
              aim={shownAim}
              dropTarget={
                drag?.target?.kind === "pocket" ? drag.target.address : null
              }
              movingCopy={origin?.kind === "copy"}
              removing={removing}
              catalogue={catalogue}
              onSlot={onSlot}
              onCopyPress={(from, copy, event) =>
                startDrag({ kind: "copy", from, copy }, event)
              }
              onSwipe={go}
            />
          </div>
        </div>
      </div>
      {panelOpen && (
        <CataloguePanel
          catalogue={catalogue}
          aim={shownAim}
          replacing={
            aim?.kind === "target" ? slotAt(binder, aim.address) : null
          }
          announcement={announcement}
          beside={beside}
          inert={detail !== null}
          focusRequest={panelFocus}
          onPrintingPress={
            canDragPrinting
              ? (card, printing, event) =>
                  startDrag({ kind: "printing", card, printing }, event)
              : undefined
          }
          onChoose={onPrinting}
          onClose={closePanel}
        />
      )}
      <LiveRegion
        className="binder__announcement"
        announcement={moveAnnouncement}
      />
      {drag?.ghost && origin && (
        <img
          className={
            removing ? "drag-ghost drag-ghost--removing" : "drag-ghost"
          }
          src={catalogue.imageUrl(
            (origin.kind === "printing" ? origin.card : origin.copy.card)
              .passcode,
          )}
          alt=""
          style={{
            left: drag.ghost.left,
            top: drag.ghost.top,
            width: drag.ghost.width,
            height: drag.ghost.height,
          }}
        />
      )}
      {detail && copy && (
        <CopyDetail
          copy={copy}
          title={slotName(detail)}
          catalogue={catalogue}
          onClose={closeDetail}
          onCondition={(condition) =>
            setBinderState((current) => ({
              ...current,
              binder: changeCondition(current.binder, detail, condition),
            }))
          }
          onReplace={() => {
            opener.current = null;
            setDetail(null);
            openPanel({ kind: "target", address: detail });
          }}
          onRemove={() => {
            setBinderState((current) => ({
              ...current,
              binder: remove(current.binder, detail),
            }));
            closeDetail();
          }}
        />
      )}
    </main>
  );
}

function pagesLabel(left: number | null, right: number | null): string {
  return left && right ? `Pages ${left}–${right}` : `Page ${left ?? right}`;
}

function isTextField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable ||
      ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
  );
}
