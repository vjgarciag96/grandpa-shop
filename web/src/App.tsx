import { useCallback, useState } from "react";
import { BinderSpread } from "./BinderSpread";
import { CardPicker } from "./CardPicker";
import { CopyDetail } from "./CopyDetail";
import {
  changeCondition,
  emptyBinder,
  place,
  remove,
  slotAt,
  type SlotAddress,
} from "./binder";
import type { Catalogue } from "./catalogue";

/** The slot a dialog is open for, and which dialog. */
type Open = { dialog: "picker" | "detail"; address: SlotAddress };

export default function App({ catalogue }: { catalogue: Catalogue }) {
  const [binder, setBinder] = useState(emptyBinder);
  const [open, setOpen] = useState<Open | null>(null);
  const close = useCallback(() => setOpen(null), []);

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
        <BinderSpread
          binder={binder}
          spread={0}
          catalogue={catalogue}
          onSlot={openSlot}
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
