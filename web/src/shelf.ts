import { emptyBinder, type Binder, type BinderCapacity } from './binder';
import { text } from './strings';

export type ShelfBinder = { readonly name: string; readonly binder: Binder };

export type Shelf = {
  readonly binders: readonly ShelfBinder[];
  readonly activeIndex: number;
};

export type BinderAddition =
  | { readonly kind: 'added'; readonly shelf: Shelf }
  | { readonly kind: 'blank-name' | 'duplicate-name' };

export function initialShelf(binder = emptyBinder()): Shelf {
  return {
    binders: [{ name: text.shelf.defaultName, binder }],
    activeIndex: 0,
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
      activeIndex: shelf.binders.length,
    },
  };
}

export function openBinder(shelf: Shelf, index: number): Shelf {
  if (index === shelf.activeIndex || !shelf.binders[index]) return shelf;
  return { ...shelf, activeIndex: index };
}

export function replaceOpenBinder(shelf: Shelf, binder: Binder): Shelf {
  if (shelf.binders[shelf.activeIndex].binder === binder) return shelf;

  return {
    ...shelf,
    binders: shelf.binders.map((entry, index) =>
      index === shelf.activeIndex ? { ...entry, binder } : entry,
    ),
  };
}
