import { useEffect, useRef } from 'react';
import { initializeShelf, saveBinders, saveOpenBinder } from './savedShelf';
import type { Shelf } from './shelf';

export type BinderSelection = { readonly name: string };

export function useShelfPersistence(
  binders: Shelf['binders'],
  selection: BinderSelection | null,
): void {
  const initialBinders = useRef(binders);
  useEffect(() => {
    if (binders === initialBinders.current) initializeShelf(binders);
    else saveBinders(binders);
  }, [binders]);

  useEffect(() => {
    if (selection) saveOpenBinder(selection.name);
  }, [selection]);
}
