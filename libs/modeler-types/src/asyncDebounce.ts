import { debounce } from "lodash";

export interface AsyncDebounced<
  F extends (...args: never[]) => Promise<unknown>,
> {
  (...args: Parameters<F>): ReturnType<F>;
  flush(): Promise<void>;
  cancel(): void;
  pending(): boolean;
}

/** Runs asynchronous calls in invocation order, including after a rejection. */
export function serializeAsync<
  F extends (...args: never[]) => Promise<unknown>,
>(func: F): F {
  let tail: Promise<unknown> = Promise.resolve();
  return ((...args: Parameters<F>): ReturnType<F> => {
    const result = tail.then(() => func(...args));
    tail = result.catch(() => undefined);
    return result as ReturnType<F>;
  }) as unknown as F;
}

/** Lodash debounce with awaitable callers and explicit lifecycle controls. */
export function asyncDebounce<F extends (...args: never[]) => Promise<unknown>>(
  func: F,
  wait?: number,
  options?: { maxWait?: number },
): AsyncDebounced<F> {
  let resolves = new Set<(value: unknown) => void>();
  let rejects = new Set<(reason: unknown) => void>();
  const inFlight = new Set<Promise<unknown>>();

  const debounced = debounce(
    (args: Parameters<F>) => {
      const runResolves = resolves;
      const runRejects = rejects;
      resolves = new Set();
      rejects = new Set();

      const run = func(...args);
      inFlight.add(run);
      run
        .then((value) => {
          inFlight.delete(run);
          runResolves.forEach((resolve) => resolve(value));
        })
        .catch((error) => {
          inFlight.delete(run);
          runRejects.forEach((reject) => reject(error));
        });
    },
    wait,
    options,
  );

  const wrapper = (...args: Parameters<F>): ReturnType<F> =>
    new Promise((resolve, reject) => {
      resolves.add(resolve);
      rejects.add(reject);
      debounced(args);
    }) as ReturnType<F>;

  wrapper.flush = async (): Promise<void> => {
    debounced.flush();
    await Promise.all(inFlight);
  };
  wrapper.cancel = (): void => {
    debounced.cancel();
    resolves.forEach((resolve) => resolve(undefined));
    resolves = new Set();
    rejects = new Set();
  };
  wrapper.pending = (): boolean => resolves.size > 0 || inFlight.size > 0;

  return wrapper as AsyncDebounced<F>;
}
