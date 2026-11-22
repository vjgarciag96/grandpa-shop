import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { chooseSlot, choosePrinting, type Aim } from "./aim";
import { BinderSpread } from "./BinderSpread";
import { CataloguePanel, type Announcement } from "./CataloguePanel";
import { CopyDetail } from "./CopyDetail";
import { loadBinder, saveBinder } from "./savedBinder";
import {
  changeCondition,
  place,
  remove,
  slotAt,
  slotNameInSentence,
  slotName,
  spreadPages,
  type SlotAddress,
} from "./binder";
import type { Card, Catalogue, Printing } from "./catalogue";
import { PANEL_BESIDE_FROM_PX, STACK_BELOW_PX } from "./tokens";
import { useMediaQuery } from "./useMediaQuery";
import { useDragToPocket } from "./useDragToPocket";
import { useSpreadTurns } from "./useSpreadTurns";

export default function App({ catalogue }: { catalogue: Catalogue }) {
  const [binder, setBinder] = useState(loadBinder);
  const [detail, setDetail] = useState<SlotAddress | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [aim, setAim] = useState<Aim | null>(null);
  const [announcement, setAnnouncement] = useState<Announcement>({
    text: "",
    count: 0,
  });
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

  useEffect(() => {
    if (detail) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAim(null);
        setAnnouncement((current) => ({ ...current, text: "" }));
      }
      if (isTextField(event.target)) return;
      if (event.key === "ArrowRight") go("forward");
      if (event.key === "ArrowLeft") go("back");
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [detail, go]);

  const announce = (text: string) =>
    setAnnouncement((current) => ({ text, count: current.count + 1 }));

  const openPanel = (nextAim: Aim | null) => {
    setPanelOpen(true);
    setAim(nextAim);
    setPanelFocus((count) => count + 1);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setAim(null);
    setAnnouncement((current) => ({ ...current, text: "" }));
    addCards.current?.focus();
  };

  const placeAt = (address: SlotAddress, card: Card, printing: Printing) => {
    setBinder((current) =>
      place(current, address, { card, printing, condition: "Near Mint" }),
    );
    setAim(null);
    announce(`Placed ${printing.setCode} in ${slotNameInSentence(address)}.`);
  };

  const canDrag = panelOpen && beside && detail === null;
  const { drag, start: startDrag } = useDragToPocket(canDrag, placeAt);
  // While a printing is dragged, the binder and the panel show it as held.
  const shownAim: Aim | null = drag
    ? { kind: "holding", card: drag.card, printing: drag.printing }
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
              dropTarget={drag?.over ?? null}
              catalogue={catalogue}
              onSlot={onSlot}
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
          onPrintingPress={canDrag ? startDrag : undefined}
          onChoose={onPrinting}
          onClose={closePanel}
        />
      )}
      {drag && (
        <img
          className="drag-ghost"
          src={catalogue.imageUrl(drag.card.passcode)}
          alt=""
          style={{ left: drag.x, top: drag.y }}
        />
      )}
      {detail && copy && (
        <CopyDetail
          copy={copy}
          title={slotName(detail)}
          catalogue={catalogue}
          onClose={closeDetail}
          onCondition={(condition) =>
            setBinder((current) => changeCondition(current, detail, condition))
          }
          onReplace={() => {
            opener.current = null;
            setDetail(null);
            openPanel({ kind: "target", address: detail });
          }}
          onRemove={() => {
            setBinder((current) => remove(current, detail));
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
