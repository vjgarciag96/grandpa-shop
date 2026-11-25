import { useCallback, useEffect, useState } from 'react';
import { spreadCount, type BinderCapacity } from './binder';
import { PAGE_FLIP_MS } from './tokens';

export type Turn = { from: number; direction: 'forward' | 'back' };

/**
 * Which spread is open and which sheet is in motion. Cutting cancels any in-flight turn.
 */
export function useSpreadTurns(capacity: BinderCapacity, cut: boolean) {
  const spreads = spreadCount(capacity);
  const [{ spread, turn }, setPosition] = useState<{
    spread: number;
    turn: Turn | null;
  }>({ spread: 0, turn: null });

  if (cut && turn) setPosition({ spread, turn: null });

  const go = useCallback(
    (direction: Turn['direction']) => {
      setPosition((position) => {
        const from = position.spread;
        const to = from + (direction === 'forward' ? 1 : -1);
        if (to < 0 || to >= spreads) return position;
        return { spread: to, turn: cut ? null : { from, direction } };
      });
    },
    [cut, spreads],
  );

  useEffect(() => {
    if (!turn) return;
    const done = setTimeout(() => {
      setPosition((position) => (position.turn === turn ? { ...position, turn: null } : position));
    }, PAGE_FLIP_MS);
    return () => clearTimeout(done);
  }, [turn]);

  return {
    spread,
    turn: cut ? null : turn,
    go,
    canGoBack: spread > 0,
    canGoForward: spread < spreads - 1,
  };
}
