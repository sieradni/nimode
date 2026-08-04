import { useEffect, useState } from 'react';

const REFERENCE_MIN_DIMENSION = 720;
const MIN_SCALE = 0.6;
const MAX_SCALE = 1.25;

/**
 * A proportional UI scale derived from the smaller viewport dimension, so
 * floating chrome (the top-right buttons) shrinks and grows with the board
 * instead of dominating a small Discord Activity window.
 */
export function useUiScale(): number {
  const [scale, setScale] = useState<number>(() =>
    Math.max(MIN_SCALE, Math.min(MAX_SCALE, Math.min(window.innerWidth, window.innerHeight) / REFERENCE_MIN_DIMENSION)),
  );

  useEffect(() => {
    const measure = () => {
      const minDimension = Math.min(window.innerWidth, window.innerHeight);
      const computed = minDimension / REFERENCE_MIN_DIMENSION;
      setScale(Math.max(MIN_SCALE, Math.min(MAX_SCALE, computed)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  return scale;
}
