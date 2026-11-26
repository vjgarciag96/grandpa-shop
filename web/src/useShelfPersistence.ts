import { useEffect, useRef } from 'react';
import { initializeShelf, saveBinders, saveOpenBinder } from './savedShelf';
import type { Shelf } from './shelf';

/**
 * Saves the binders when they change, and the open binder's name each time one is opened.
 * Every opening passes through the shelf, so reopening a binder after another tab switched saves it again.
 */
export function useShelfPersistence(binders: Shelf['binders'], openName: string | null): void {
  const initialBinders = useRef(binders);
  useEffect(() => {
    if (binders === initialBinders.current) initializeShelf(binders);
    else saveBinders(binders);
  }, [binders]);

  useEffect(() => {
    if (openName !== null) saveOpenBinder(openName);
  }, [openName]);
}
