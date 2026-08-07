import { useEffect, useState } from 'react';

/**
 * Vertical space that the Discord iOS client paints over the top of the
 * Activity iframe as a blurred pill/bar. Content placed above this is
 * hidden behind the blur, so the game should stay below it on touch screens.
 */
export const MOBILE_TOP_CHROME_PX = 64;

function hasCoarsePointer(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Number of pixels of browser chrome to reserve at the top of the viewport.
 * Coarse pointers (phones/tablets used inside Discord) get a fixed offset for
 * the blurred overlay; fine pointers (desktop) get none, so the board keeps
 * all of the tall aspect.
 */
export function useTopChromeInset(): number {
  const [inset, setInset] = useState<number>(() =>
    hasCoarsePointer() ? MOBILE_TOP_CHROME_PX : 0,
  );

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(pointer: coarse)');
    const update = () => setInset(query.matches ? MOBILE_TOP_CHROME_PX : 0);
    update();
    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }
    return;
  }, []);

  return inset;
}