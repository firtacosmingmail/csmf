// Trailing-edge debounce: each call resets the delay, and only the last
// call within the window actually runs.
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number,
): ((...args: Args) => void) & { flush: () => void } {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let pendingArgs: Args | undefined;

  const debounced = (...args: Args) => {
    pendingArgs = args;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => {
      timeout = undefined;
      const toRun = pendingArgs;
      pendingArgs = undefined;
      if (toRun) fn(...toRun);
    }, delayMs);
  };

  debounced.flush = () => {
    if (!timeout) return;
    clearTimeout(timeout);
    timeout = undefined;
    const toRun = pendingArgs;
    pendingArgs = undefined;
    if (toRun) fn(...toRun);
  };

  return debounced;
}
