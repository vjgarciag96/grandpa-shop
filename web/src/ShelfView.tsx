import { useId, useLayoutEffect, useRef, useState } from 'react';
import { AppTitle } from './AppTitle';
import type { BinderCapacity } from './binder';
import { NewBinderDialog } from './NewBinderDialog';
import type { NameProblem, Shelf } from './shelf';
import { text } from './strings';

type Props = {
  binders: Shelf['binders'];
  lastOpened: number | null;
  /** Whether the shelf is shown because its last opened binder was just put back. */
  focusLastOpened: boolean;
  onOpen: (index: number) => void;
  onCreate: (name: string, capacity: BinderCapacity) => NameProblem | undefined;
};

/** The binders standing on the shelf's boards, in the order they were added, then a spot for a new one. */
export function ShelfView({ binders, lastOpened, focusLastOpened, onOpen, onCreate }: Props) {
  const [creating, setCreating] = useState(false);
  const lastOpenedSpine = useRef<HTMLButtonElement>(null);
  const newBinderButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const heading = useId();
  const mark = useId();
  const words = text.shelf;

  // Focusing without preventScroll brings a spine far down the shelf into view.
  useLayoutEffect(() => {
    if (focusLastOpened) lastOpenedSpine.current?.focus();
  }, [focusLastOpened]);

  useLayoutEffect(() => {
    if (creating || !returnFocus.current) return;
    newBinderButton.current?.focus({ preventScroll: true });
    returnFocus.current = false;
  }, [creating]);

  const startCreating = () => {
    returnFocus.current = true;
    setCreating(true);
  };

  return (
    <main className="shelf">
      <div inert={creating}>
        <header className="app-head">
          <AppTitle />
        </header>
        <section className="shelf__case" aria-labelledby={heading}>
          <h2 id={heading} className="shelf__title">
            {words.title}
          </h2>
          <p className="shelf__storage">{words.storage}</p>
          <ul className="shelf__boards" aria-labelledby={heading}>
            {binders.map(({ name }, index) => {
              const isLastOpened = index === lastOpened;
              return (
                <li
                  key={name}
                  className={isLastOpened ? 'shelf__slot shelf__slot--last-opened' : 'shelf__slot'}
                >
                  <button
                    ref={isLastOpened ? lastOpenedSpine : undefined}
                    type="button"
                    className="spine"
                    title={name}
                    aria-describedby={isLastOpened ? mark : undefined}
                    onClick={() => onOpen(index)}
                  >
                    <span className="spine__name">{name}</span>
                  </button>
                  {isLastOpened && (
                    <span className="spine__mark" id={mark}>
                      {words.lastOpened}
                    </span>
                  )}
                </li>
              );
            })}
            <li className="shelf__slot">
              <button
                ref={newBinderButton}
                type="button"
                className="shelf__new"
                aria-haspopup="dialog"
                onClick={startCreating}
              >
                <span className="shelf__plus" aria-hidden="true" />
                <span className="shelf__new-label">{words.newBinder}</span>
              </button>
            </li>
          </ul>
        </section>
      </div>
      {creating && <NewBinderDialog onCreate={onCreate} onClose={() => setCreating(false)} />}
    </main>
  );
}
