import { pagesLabel, slotName, text } from './strings';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from 'react';
import { chooseSlot, choosePrinting, runStart, type Aim } from './aim';
import { BinderSpread } from './BinderSpread';
import { CataloguePanel } from './CataloguePanel';
import { CopyDetail } from './CopyDetail';
import { loadShelf } from './savedShelf';
import {
  addBinder,
  closeBinder,
  lastOpenedBinder,
  openBinder,
  openedBinder,
  replaceOpenBinder,
  type Shelf,
} from './shelf';
import { ShelfView } from './ShelfView';
import { AppTitle } from './AppTitle';
import { BinderSettingsDialog } from './BinderSettingsDialog';
import {
  changeCondition,
  firstSpreadPage,
  remove,
  resizeBinder,
  slotAt,
  spreadPages,
  type Binder,
  type Copy,
  type BinderCapacity,
  type SlotAddress,
} from './binder';
import type { Card, Catalogue, Printing, SetPrinting } from './catalogue';
import { announced, silenced } from './announcement';
import { LiveRegion } from './LiveRegion';
import { panelBesideFrom, STACK_BELOW_PX } from './tokens';
import { useMediaQuery, useMinimumViewportWidth } from './useMediaQuery';
import { useDragToPocket } from './useDragToPocket';
import { useShelfPersistence } from './useShelfPersistence';
import { useSpreadTurns } from './useSpreadTurns';

import {
  binderInteraction,
  moveAt,
  placeAt,
  placeRunAt,
  removeAt,
  type BinderInteraction,
  type BinderState,
} from './binderState';

/** Where focus goes once the desk has rendered. */
type FocusTarget = 'settings' | 'binder-name';

type DeskState = {
  shelf: Shelf;
  interaction: BinderInteraction;
  workspaceVersion: number;
};

/** Shows `shelf` on a fresh workspace: page 1, the catalogue closed, and stale desk callbacks ignored. */
function resetWorkspace(current: DeskState, shelf: Shelf): DeskState {
  return {
    ...current,
    shelf,
    interaction: binderInteraction(),
    workspaceVersion: current.workspaceVersion + 1,
  };
}

export default function App({ catalogue }: { catalogue: Catalogue }) {
  const [{ shelf, interaction, workspaceVersion }, setState] = useState<DeskState>(() => ({
    shelf: loadShelf(),
    interaction: binderInteraction(),
    workspaceVersion: 0,
  }));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backFromBinder, setBackFromBinder] = useState(false);
  const nameHeading = useRef<HTMLHeadingElement>(null);
  const settingsButton = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<FocusTarget | null>(null);
  const opened = openedBinder(shelf);
  useShelfPersistence(shelf.binders, opened?.name ?? null);

  useLayoutEffect(() => {
    if (settingsOpen || returnFocus.current === null) return;
    if (returnFocus.current === 'binder-name') {
      // A binder opened from far down the shelf starts at the top of the desk.
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0;
      nameHeading.current?.focus({ preventScroll: true });
    } else {
      settingsButton.current?.focus({ preventScroll: true });
    }
    returnFocus.current = null;
  }, [settingsOpen, shelf.showing]);

  const updateBinder = useCallback(
    (update: (state: BinderState) => BinderState) => {
      setState((current) => {
        if (current.workspaceVersion !== workspaceVersion) return current;
        const opened = openedBinder(current.shelf);
        if (!opened) return current;
        const before = { ...current.interaction, binder: opened.binder };
        const next = update(before);
        if (next === before) return current;
        const { binder, ...interaction } = next;
        return { ...current, shelf: replaceOpenBinder(current.shelf, binder), interaction };
      });
    },
    [workspaceVersion],
  );

  const openSettings = () => {
    returnFocus.current = 'settings';
    setSettingsOpen(true);
  };
  const closeSettings = () => setSettingsOpen(false);

  const saveCapacity = (binder: Binder, capacity: BinderCapacity) => {
    const resized = resizeBinder(binder, capacity);
    if (resized.kind === 'occupied') {
      return text.binderSettings.blockedResize(resized.address);
    }
    if (resized.binder !== binder) {
      setState((current) => {
        if (
          current.workspaceVersion !== workspaceVersion ||
          openedBinder(current.shelf)?.binder !== binder
        ) {
          return current;
        }
        return resetWorkspace(current, replaceOpenBinder(current.shelf, resized.binder));
      });
    }
    closeSettings();
  };

  const chooseBinder = (index: number) => {
    returnFocus.current = 'binder-name';
    setState((current) => resetWorkspace(current, openBinder(current.shelf, index)));
  };

  const createBinder = (name: string, capacity: BinderCapacity) => {
    const addition = addBinder(shelf, name, capacity);
    if (addition.kind !== 'added') return addition.kind;
    returnFocus.current = 'binder-name';
    setState((current) => {
      const added = current.shelf === shelf ? addition : addBinder(current.shelf, name, capacity);
      return added.kind === 'added' ? resetWorkspace(current, added.shelf) : current;
    });
  };

  const leaveBinder = () => {
    setBackFromBinder(true);
    setState((current) => resetWorkspace(current, closeBinder(current.shelf)));
  };

  if (!opened) {
    return (
      <ShelfView
        binders={shelf.binders}
        lastOpened={lastOpenedBinder(shelf)}
        focusLastOpened={backFromBinder}
        onOpen={chooseBinder}
        onCreate={createBinder}
      />
    );
  }

  const { name, binder } = opened;
  return (
    <>
      <BinderWorkspace
        key={workspaceVersion}
        name={name}
        state={{ binder, ...interaction }}
        setBinderState={updateBinder}
        catalogue={catalogue}
        modalOpen={settingsOpen}
        nameHeading={nameHeading}
        settingsButton={settingsButton}
        onBack={leaveBinder}
        onSettings={openSettings}
      />
      {settingsOpen && (
        <BinderSettingsDialog
          name={name}
          capacity={binder.capacity}
          onSave={(capacity) => saveCapacity(binder, capacity)}
          onClose={closeSettings}
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
  modalOpen: boolean;
  nameHeading: Ref<HTMLHeadingElement>;
  settingsButton: Ref<HTMLButtonElement>;
  onBack: () => void;
  onSettings: () => void;
};

function BinderWorkspace({
  name,
  state: { binder, aim, moveAnnouncement, announcement },
  setBinderState,
  catalogue,
  modalOpen,
  nameHeading,
  settingsButton,
  onBack,
  onSettings,
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
  const { grid } = binder.capacity;
  const beside = useMinimumViewportWidth(panelBesideFrom(grid), { excludeScrollbar: grid === 4 });
  const { spread, turn, go, canGoBack, canGoForward } = useSpreadTurns(
    binder.capacity,
    reducedMotion || stacked,
  );
  const { left, right } = spreadPages(binder.capacity, spread);

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

  const workspaceInert = detail !== null || modalOpen;

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

  const placeListed = (entries: readonly SetPrinting[]) => {
    if (workspaceInert) return false;
    const start = runStart(aim, firstSpreadPage(binder.capacity, spread));
    const next = placeRunAt({ binder, aim, moveAnnouncement, announcement }, start, entries);
    setBinderState(() => next);
    return next.binder !== binder;
  };

  const copy = detail && slotAt(binder, detail);
  const deskLayout = panelOpen ? (beside ? ' desk--beside' : ' desk--sheet') : '';

  return (
    <main className={`desk${deskLayout}`}>
      <div className="desk__main" inert={workspaceInert}>
        <header className="app-head">
          <AppTitle>
            <h2 ref={nameHeading} className="desk__binder-name" tabIndex={-1}>
              {name}
            </h2>
          </AppTitle>
          <div className="desk__actions">
            <button type="button" className="control control--text" onClick={onBack}>
              <span className="chevron chevron--back" aria-hidden="true" />
              {text.shelf.back}
            </button>
            <button
              ref={settingsButton}
              type="button"
              className="control control--tonal"
              aria-haspopup="dialog"
              onClick={onSettings}
            >
              {text.binderSettings.title}
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
          <div
            className="binder"
            style={{ '--pocket-columns': binder.capacity.grid } as CSSProperties}
          >
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
          onPlaceAll={placeListed}
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
