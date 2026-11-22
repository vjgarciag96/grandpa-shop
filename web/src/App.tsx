import { useCallback, useEffect, useState } from "react";
import { BinderSpread } from "./BinderSpread";
import { CardPicker } from "./CardPicker";
import { CopyDetail } from "./CopyDetail";
import {
  changeCondition,
  emptyBinder,
  place,
  remove,
  slotAt,
  spreadPages,
  type SlotAddress,
} from "./binder";
import type { Catalogue } from "./catalogue";
import { useMediaQuery, useStackedPages } from "./useMediaQuery";
import { useSpreadTurns } from "./useSpreadTurns";

/** The slot a dialog is open for, and which dialog. */
type Open = { dialog: "picker" | "detail"; address: SlotAddress };

export default function App({ catalogue }: { catalogue: Catalogue }) {
  const [binder, setBinder] = useState(emptyBinder);
  const [open, setOpen] = useState<Open | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const stacked = useStackedPages();
  const { spread, turn, go, canGoBack, canGoForward } = useSpreadTurns(
    reducedMotion || stacked,
  );
  const { left, right } = spreadPages(spread);

  useEffect(() => {
    if (open) return;
    const turnOnArrow = (event: KeyboardEvent) => {
      if (isTextField(event.target)) return;
      if (event.key === "ArrowRight") go("forward");
      if (event.key === "ArrowLeft") go("back");
    };
    document.addEventListener("keydown", turnOnArrow);
    return () => document.removeEventListener("keydown", turnOnArrow);
  }, [open, go]);

  const openSlot = (address: SlotAddress) =>
    setOpen({ dialog: slotAt(binder, address) ? "detail" : "picker", address });
  const copy = open && slotAt(binder, open.address);
  const title =
    open && `Page ${open.address.page}, slot ${open.address.position + 1}`;

  return (
    <main className="desk">
      <header className="desk__head">
        <h1>Grandpa Shop</h1>
        <p>Cards you place stay until the page reloads. Saving comes later.</p>
      </header>
      <div className="binder">
        <nav className="binder__turns" aria-label="Turn the binder">
          <button
            type="button"
            aria-label="Previous spread"
            disabled={!canGoBack}
            onClick={() => go("back")}
          >
            ‹
          </button>
          <span aria-live="polite">{pagesLabel(left, right)}</span>
          <button
            type="button"
            aria-label="Next spread"
            disabled={!canGoForward}
            onClick={() => go("forward")}
          >
            ›
          </button>
        </nav>
        <BinderSpread
          binder={binder}
          spread={spread}
          stacked={stacked}
          turn={turn}
          catalogue={catalogue}
          onSlot={openSlot}
          onSwipe={go}
        />
      </div>
      {open?.dialog === "picker" && (
        <CardPicker
          catalogue={catalogue}
          title={`Fill ${title?.toLowerCase()}`}
          onClose={close}
          onPick={(card, printing) => {
            setBinder((current) =>
              place(current, open.address, {
                card,
                printing,
                condition: "Near Mint",
              }),
            );
            close();
          }}
        />
      )}
      {open?.dialog === "detail" && copy && (
        <CopyDetail
          copy={copy}
          title={title ?? ""}
          catalogue={catalogue}
          onClose={close}
          onCondition={(condition) =>
            setBinder((current) =>
              changeCondition(current, open.address, condition),
            )
          }
          onReplace={() => setOpen({ dialog: "picker", address: open.address })}
          onRemove={() => {
            setBinder((current) => remove(current, open.address));
            close();
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
