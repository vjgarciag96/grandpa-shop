import { useCallback, useState } from "react";
import { BinderSpread } from "./BinderSpread";
import { CardPicker } from "./CardPicker";
import { emptyBinder, place, type SlotAddress } from "./binder";
import type { Catalogue } from "./catalogue";

export default function App({ catalogue }: { catalogue: Catalogue }) {
  const [binder, setBinder] = useState(emptyBinder);
  const [filling, setFilling] = useState<SlotAddress | null>(null);
  const closePicker = useCallback(() => setFilling(null), []);

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
          onSlot={setFilling}
        />
      </div>
      {filling && (
        <CardPicker
          catalogue={catalogue}
          title={`Fill page ${filling.page}, slot ${filling.position + 1}`}
          onClose={closePicker}
          onPick={(card, printing) => {
            setBinder((current) =>
              place(current, filling, {
                card,
                printing,
                condition: "Near Mint",
              }),
            );
            setFilling(null);
          }}
        />
      )}
    </main>
  );
}
