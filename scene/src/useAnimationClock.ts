import { useEffect, useRef, useSyncExternalStore } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

const subscribeMotion = (notify: () => void) => {
  const media = window.matchMedia(QUERY);
  media.addEventListener('change', notify);
  return () => media.removeEventListener('change', notify);
};

export const usePrefersReducedMotion = () =>
  useSyncExternalStore(subscribeMotion, () => window.matchMedia(QUERY).matches);

/**
 * Calls onTick with animation time in ms. Time comes from timestamps, so speed is
 * the same on any display, and it stands still while paused or while the tab is hidden.
 */
export function useAnimationClock(running: boolean, onTick: (timeMs: number) => void) {
  const tick = useRef(onTick);
  tick.current = onTick;
  const elapsed = useRef(0);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last: number | null = null;

    const step = (now: number) => {
      if (last !== null) elapsed.current += now - last;
      last = now;
      tick.current(elapsed.current);
      raf = requestAnimationFrame(step);
    };
    const start = () => {
      last = null;
      raf = requestAnimationFrame(step);
    };
    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) start();
    };

    document.addEventListener('visibilitychange', onVisibility);
    if (!document.hidden) start();
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      cancelAnimationFrame(raf);
    };
  }, [running]);

  return elapsed;
}
