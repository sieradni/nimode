/**
 * Canvas backing-store scaling.
 *
 * A canvas whose backing store matches its CSS size renders at 1x, so on a
 * HiDPI display every line and edge is resampled and looks soft. Sizing the
 * backing store by `devicePixelRatio` and scaling the context back down means
 * drawing code keeps working in logical pixels while output stays sharp.
 */

export function getDevicePixelRatio(): number {
  if (typeof window === 'undefined') return 1;
  const ratio = window.devicePixelRatio;
  return typeof ratio === 'number' && ratio > 0 ? ratio : 1;
}

export function setupHiDpiCanvas(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  ratio: number = getDevicePixelRatio(),
): CanvasRenderingContext2D | null {
  canvas.width = Math.round(cssWidth * ratio);
  canvas.height = Math.round(cssHeight * ratio);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // `scale` is absent from stub contexts used in tests.
  if (typeof ctx.scale === 'function') {
    ctx.scale(ratio, ratio);
  }
  // Cells are axis-aligned rectangles; smoothing only blurs their edges.
  ctx.imageSmoothingEnabled = false;
  return ctx;
}
