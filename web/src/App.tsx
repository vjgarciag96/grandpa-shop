import { pagesLabel, slotName, text } from './strings';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from 'react';
import { chooseSlot, choosePrinting, type Aim } from './aim';
import { BinderSpread } from './BinderSpread';
import { CataloguePanel } from './CataloguePanel';
import { CopyDetail } from './CopyDetail';
import { loadShelf } from './savedShelf';
import { addBinder, openBinder, replaceOpenBinder, type Shelf } from './shelf';
import { ShelfDialog } from './ShelfDialog';
import {
  changeCondition,
  remove,
  slotAt,
  spreadPages,
  type Copy,
  type SlotAddress,
} from './binder';
import type { Card, Catalogue, Printing } from './catalogue';
import { announced, silenced } from './announcement';
import { LiveRegion } from './LiveRegion';
import { PANEL_BESIDE_FROM_PX, STACK_BELOW_PX } from './tokens';
import { useMediaQuery } from './useMediaQuery';
import { useDragToPocket } from './useDragToPocket';
import { useShelfPersistence, type BinderSelection } from './useShelfPersistence';
import { useSpreadTurns } from './useSpreadTurns';

import {
  binderInteraction,
  moveAt,
  placeAt,
  removeAt,
  type BinderInteraction,
  type BinderState,
} from './binderState';

type DeskState = {
  shelf: Shelf;
  interaction: BinderInteraction;
  workspaceVersion: number;
  selection: BinderSelection | null;
};

function reopenWorkspace(current: DeskState, shelf: Shelf): DeskState {
  return {
    ...current,
    shelf,
    interaction: binderInteraction(),
    workspaceVersion: current.workspaceVersion + 1,
  };
}

function chooseWorkspace(current: DeskState, shelf: Shelf): DeskState {
  return {
    ...reopenWorkspace(current, shelf),
    selection: { name: shelf.binders[shelf.activeIndex].name },
  };
}

export default function App({ catalogue }: { catalogue: Catalogue }) {
  const [{ shelf, interaction, workspaceVersion, selection }, setState] = useState<DeskState>(
    () => ({
      shelf: loadShelf(),
      interaction: binderInteraction(),
      workspaceVersion: 0,
      selection: null,
    }),
  );
  const [shelfOpen, setShelfOpen] = useState(false);
  const shelfButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef(false);
  const { activeIndex, binders } = shelf;
  const { name, binder } = binders[activeIndex];
  useShelfPersistence(binders, selection);

  useLayoutEffect(() => {
    if (!shelfOpen && restoreFocus.current) {
      shelfButton.current?.focus({ preventScroll: true });
      restoreFocus.current = false;
    }
  }, [shelfOpen]);

  const updateBinder = useCallback(
    (update: (state: BinderState) => BinderState) => {
      setState((current) => {
        if (current.workspaceVersion !== workspaceVersion) return current;
        const before = {
          ...current.interaction,
          binder: current.shelf.binders[current.shelf.activeIndex].binder,
        };
        const next = update(before);
        if (next === before) return current;
        const { binder, ...interaction } = next;
        return { ...current, shelf: replaceOpenBinder(current.shelf, binder), interaction };
      });
    },
    [workspaceVersion],
  );

  const showShelf = () => {
    restoreFocus.current = true;
    setShelfOpen(true);
  };
  const closeShelf = () => setShelfOpen(false);

  const selectBinder = (index: number) => {
    if (!binders[index]) return;
    setState((current) => chooseWorkspace(current, openBinder(current.shelf, index)));
    closeShelf();
  };

  const createBinder = (name: string) => {
    const addition = addBinder(shelf, name);
    if (addition.kind !== 'added') return addition.kind;
    setState((current) => {
      const added = current.shelf === shelf ? addition : addBinder(current.shelf, name);
      return added.kind === 'added' ? chooseWorkspace(current, added.shelf) : current;
    });
    closeShelf();
  };

  return (
    <>
      <BinderWorkspace
        key={workspaceVersion}
        name={name}
        state={{ binder, ...interaction }}
        setBinderState={updateBinder}
        catalogue={catalogue}
        shelfOpen={shelfOpen}
        shelfButton={shelfButton}
        onShelf={showShelf}
      />
      {shelfOpen && (
        <ShelfDialog
          shelf={shelf}
          onOpen={selectBinder}
          onCreate={createBinder}
          onClose={closeShelf}
        />
      )}
    </>
  );
}

type WorkspaceProps = {
  name: string;
  state: BinderState;
  setBinderState: (update: (state: BinderState) => BinderState) => void;
  catalogue: Catalogue;
  shelfOpen: boolean;
  shelfButton: Ref<HTMLButtonElement>;
  onShelf: () => void;
};

function BinderWorkspace({
  name,
  state: { binder, aim, moveAnnouncement, announcement },
  setBinderState,
  catalogue,
  shelfOpen,
  shelfButton,
  onShelf,
}: WorkspaceProps) {
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

  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const stacked = useMediaQuery(`(width < ${STACK_BELOW_PX}px)`);
  const beside = useMediaQuery(`(width >= ${PANEL_BESIDE_FROM_PX}px)`);
  const { spread, turn, go, canGoBack, canGoForward } = useSpreadTurns(reducedMotion || stacked);
  const { left, right } = spreadPages(spread);

  const setAim = useCallback(
    (aim: Aim | null) => setBinderState((current) => ({ ...current, aim })),
    [setBinderState],
  );

  const silenceCatalogue = useCallback(
    () =>
      setBinderState((current) => ({
        ...current,
        announcement: silenced(current.announcement),
      })),
    [setBinderState],
  );

  const workspaceInert = detail !== null || shelfOpen;

  useEffect(() => {
    if (workspaceInert) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setAim(null);
        silenceCatalogue();
      }
      if (isTextField(event.target)) return;
      if (event.key === 'ArrowRight') go('forward');
      if (event.key === 'ArrowLeft') go('back');
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [workspaceInert, go, setAim, silenceCatalogue]);

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

  const fileCopy = (address: SlotAddress, card: Card, printing: Printing) =>
    setBinderState((current) => placeAt(current, address, card, printing));

  const canDragPrinting = panelOpen && beside && !workspaceInert;
  const canMoveCopy = turn === null && !workspaceInert;

  const visible = (page: number) => page === left || page === right;

  const moveVisibleCopy = (to: SlotAddress, from: SlotAddress, copy: Copy) => {
    if (!canMoveCopy || !visible(from.page) || !visible(to.page)) return;

    setBinderState((current) => moveAt(current, to, from, copy));
  };

  /** Takes a dragged copy out of the binder. A catalogue target on its pocket stays, now empty. */
  const removeVisibleCopy = (from: SlotAddress, copy: Copy) => {
    if (!canMoveCopy || !visible(from.page)) return;

    setBinderState((current) => removeAt(current, from, copy));
  };

  const allowedDrags = useMemo(
    () => ({ canDragPrinting, canMoveCopy, spread }),
    [canDragPrinting, canMoveCopy, spread],
  );
  const { drag, start: startDrag } = useDragToPocket(allowedDrags, (drop) => {
    switch (drop.kind) {
      case 'place':
        return fileCopy(drop.to, drop.card, drop.printing);
      case 'move':
        return moveVisibleCopy(drop.to, drop.from, drop.copy);
      case 'remove':
        return removeVisibleCopy(drop.from, drop.copy);
    }
  });
  const origin = drag?.origin;
  /** The pocket of a copy whose card is off the binder, which a release now would empty. */
  const pocketBeingEmptied = drag?.drop?.kind === 'remove' ? drag.drop.from : null;
  const shownAim: Aim | null =
    origin?.kind === 'printing'
      ? { kind: 'holding', card: origin.card, printing: origin.printing }
      : aim;

  const onSlot = (address: SlotAddress, button: HTMLButtonElement) => {
    const choice = chooseSlot(aim, slotAt(binder, address) !== null);
    switch (choice.kind) {
      case 'place':
        return fileCopy(address, choice.card, choice.printing);
      case 'refuse':
        return announce(text.binder.filledPocket(address));
      case 'open-detail':
        opener.current = button;
        return setDetail(address);
      case 'target':
        return openPanel({ kind: 'target', address });
    }
  };

  const onPrinting = (card: Card, printing: Printing) => {
    const choice = choosePrinting(aim, card, printing);
    if (choice.kind === 'place') fileCopy(choice.address, card, printing);
    else setAim(choice.aim);
  };

  const copy = detail && slotAt(binder, detail);
  const deskLayout = panelOpen ? (beside ? ' desk--beside' : ' desk--sheet') : '';

  return (
    <main className={`desk${deskLayout}`}>
      <div className="desk__main" inert={workspaceInert}>
        <header className="desk__head">
          <div className="desk__identity">
            <span className="desk__mark" aria-hidden="true" />
            <div>
              <h1>{text.binder.title}</h1>
              <p className="desk__binder-name">{name}</p>
            </div>
          </div>
          <div className="desk__actions">
            <button
              ref={shelfButton}
              type="button"
              className="control control--tonal"
              aria-haspopup="dialog"
              onClick={onShelf}
            >
              {text.shelf.title}
            </button>
            <button
              ref={addCards}
              type="button"
              className="control control--tonal"
              onClick={() => openPanel(null)}
            >
              <span aria-hidden="true">+</span> {text.binder.addCards}
            </button>
            <nav className="binder__turns" aria-label={text.binder.turns}>
              <button
                type="button"
                className="control control--icon control--tonal"
                aria-label={text.binder.previousSpread}
                disabled={!canGoBack}
                onClick={() => go('back')}
              >
                <span className="chevron chevron--back" aria-hidden="true" />
              </button>
              <span className="binder__position" aria-live="polite">
                {pagesLabel(left, right)}
              </span>
              <button
                type="button"
                className="control control--icon control--tonal"
                aria-label={text.binder.nextSpread}
                disabled={!canGoForward}
                onClick={() => go('forward')}
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
              dropTarget={drag?.drop && drag.drop.kind !== 'remove' ? drag.drop.to : null}
              movingCopy={origin?.kind === 'copy'}
              pocketBeingEmptied={pocketBeingEmptied}
              catalogue={catalogue}
              onSlot={onSlot}
              onCopyPress={(from, copy, event) => startDrag({ kind: 'copy', from, copy }, event)}
              onSwipe={go}
            />
          </div>
        </div>
      </div>
      {panelOpen && (
        <CataloguePanel
          catalogue={catalogue}
          aim={shownAim}
          replacing={aim?.kind === 'target' ? slotAt(binder, aim.address) : null}
          announcement={announcement}
          beside={beside}
          inert={workspaceInert}
          focusRequest={panelFocus}
          onPrintingPress={
            canDragPrinting
              ? (card, printing, event) => startDrag({ kind: 'printing', card, printing }, event)
              : undefined
          }
          onChoose={onPrinting}
          onClose={closePanel}
        />
      )}
      <LiveRegion className="binder__announcement" announcement={moveAnnouncement} />
      {drag?.ghost && origin && (
        <img
          className={pocketBeingEmptied ? 'drag-ghost drag-ghost--removing' : 'drag-ghost'}
          src={catalogue.imageUrl(
            (origin.kind === 'printing' ? origin.card : origin.copy.card).passcode,
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
            openPanel({ kind: 'target', address: detail });
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

function isTextField(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))
  );
}
