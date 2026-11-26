import { useId, useLayoutEffect, useRef, useState, type Ref } from 'react';
import { AppTitle } from './AppTitle';
import type { BinderCapacity } from './binder';
import { NewBinderDialog } from './NewBinderDialog';
import type { NameProblem, Shelf } from './shelf';
import { text } from './strings';

type Props = {
  binders: Shelf['binders'];
  lastOpened: number | null;
  lastOpenedSpine: Ref<HTMLButtonElement>;
  onOpen: (index: number) => void;
  onCreate: (name: string, capacity: BinderCapacity) => NameProblem | undefined;
};

/** The binders standing on the shelf's boards, in the order they were added, then a spot for a new one. */
export function ShelfView({ binders, lastOpened, lastOpenedSpine, onOpen, onCreate }: Props) {
  const [creating, setCreating] = useState(false);
  const newBinderButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef(false);
  const heading = useId();
  const mark = useId();
  const words = text.shelf;

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
    <main className="desk shelf">
      <div className="desk__main" inert={creating}>
        <header className="desk__head">
          <AppTitle />
        </header>
        <section className="shelf__case" aria-labelledby={heading}>
          <h2 id={heading} className="shelf__title">
            {words.title}
          </h2>
          <p className="shelf__storage">{words.storage}</p>
          <ul className="shelf__boards" aria-labelledby={heading}>
            {binders.map(({ name }, index) => {
              const last = index === lastOpened;
              return (
                <li
                  key={name}
                  className={last ? 'shelf__slot shelf__slot--last-opened' : 'shelf__slot'}
                >
                  <button
                    ref={last ? lastOpenedSpine : undefined}
                    type="button"
                    className="spine"
                    title={name}
                    aria-describedby={last ? mark : undefined}
                    onClick={() => onOpen(index)}
                  >
                    <span className="spine__name">{name}</span>
                  </button>
                  {last && (
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
                <span className="spine__name">{words.newBinder}</span>
              </button>
            </li>
          </ul>
        </section>
      </div>
      {creating && <NewBinderDialog onCreate={onCreate} onClose={() => setCreating(false)} />}
    </main>
  );
}
