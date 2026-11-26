import { emptyBinder, type Binder, type BinderCapacity } from './binder';
import { text } from './strings';

export type ShelfBinder = { readonly name: string; readonly binder: Binder };

/** What the shelf shows: itself, marking the binder opened last, or one open binder. */
export type ShelfShowing =
  | { readonly kind: 'shelf'; readonly lastOpened: number | null }
  | { readonly kind: 'binder'; readonly index: number };

export type Shelf = {
  readonly binders: readonly ShelfBinder[];
  readonly showing: ShelfShowing;
};

export type BinderAddition =
  | { readonly kind: 'added'; readonly shelf: Shelf }
  | { readonly kind: 'blank-name' | 'duplicate-name' };

/** Why a new binder's name was refused. */
export type NameProblem = Exclude<BinderAddition['kind'], 'added'>;

export function initialShelf(binder = emptyBinder()): Shelf {
  return {
    binders: [{ name: text.shelf.defaultName, binder }],
    showing: { kind: 'shelf', lastOpened: null },
  };
}

export function addBinder(shelf: Shelf, name: string, capacity?: BinderCapacity): BinderAddition {
  const trimmed = name.trim();
  if (!trimmed) return { kind: 'blank-name' };
  if (shelf.binders.some((entry) => entry.name === trimmed)) return { kind: 'duplicate-name' };

  return {
    kind: 'added',
    shelf: {
      binders: [...shelf.binders, { name: trimmed, binder: emptyBinder(capacity) }],
      showing: { kind: 'binder', index: shelf.binders.length },
    },
  };
}

export function openBinder(shelf: Shelf, index: number): Shelf {
  if (!shelf.binders[index]) return shelf;
  return { ...shelf, showing: { kind: 'binder', index } };
}

/** Puts the open binder back on the shelf and marks it as the one opened last. */
export function closeBinder(shelf: Shelf): Shelf {
  if (shelf.showing.kind !== 'binder') return shelf;
  return { ...shelf, showing: { kind: 'shelf', lastOpened: shelf.showing.index } };
}

export function openedBinder(shelf: Shelf): ShelfBinder | undefined {
  return shelf.showing.kind === 'binder' ? shelf.binders[shelf.showing.index] : undefined;
}

/** The shelf position marked as opened last, while the shelf itself is shown. */
export function lastOpenedBinder(shelf: Shelf): number | null {
  return shelf.showing.kind === 'shelf' ? shelf.showing.lastOpened : null;
}

export function replaceOpenBinder(shelf: Shelf, binder: Binder): Shelf {
  const { showing } = shelf;
  if (showing.kind !== 'binder' || shelf.binders[showing.index].binder === binder) return shelf;

  return {
    ...shelf,
    binders: shelf.binders.map((entry, index) =>
      index === showing.index ? { ...entry, binder } : entry,
    ),
  };
}
