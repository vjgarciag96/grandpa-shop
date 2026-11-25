import { useEffect, useMemo, useState } from "react";
import type { Catalogue } from "./catalogue";

type Request<Input, Result> = (
  catalogue: Catalogue,
  input: Input,
  signal: AbortSignal,
  publish: (update: (previous: Result) => Result) => void,
) => void;

/** Shows only the current request's answer and discards updates after cancellation. */
export function useCatalogueRequest<Input, Result>(
  catalogue: Catalogue,
  input: Input | null,
  request: Request<Input, Result>,
  pending: Result,
  delay = 0,
) {
  const [attempt, setAttempt] = useState(0);
  const key = useMemo(
    () => ({ catalogue, input, request, pending, delay, attempt }),
    [catalogue, input, request, pending, delay, attempt],
  );
  const [answer, setAnswer] = useState<{
    key: typeof key;
    result: Result;
  } | null>(null);

  useEffect(() => {
    if (key.input === null) return;
    const input = key.input;
    const controller = new AbortController();
    const start = () =>
      key.request(key.catalogue, input, controller.signal, (update) => {
        if (controller.signal.aborted) return;
        setAnswer((previous) => ({
          key,
          result: update(previous?.key === key ? previous.result : key.pending),
        }));
      });
    const timer =
      key.delay > 0 ? window.setTimeout(start, key.delay) : undefined;
    if (timer === undefined) start();
    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      controller.abort();
    };
  }, [key]);

  return {
    result: answer?.key === key ? answer.result : pending,
    retry: () => setAttempt((previous) => previous + 1),
  };
}
