import { describe, it, expect, vi } from 'vitest';
import { setupHiDpiCanvas } from '../canvasScaling';

function makeCanvas() {
  const scale = vi.fn();
  const canvas = {
    width: 0,
    height: 0,
    style: { width: '', height: '' },
    getContext: vi.fn(() => ({ scale, imageSmoothingEnabled: true })),
  } as unknown as HTMLCanvasElement;
  return { canvas, scale };
}

describe('setupHiDpiCanvas', () => {
  it('sizes the backing store by the device pixel ratio', () => {
    const { canvas, scale } = makeCanvas();
    const ctx = setupHiDpiCanvas(canvas, 300, 600, 2);

    expect(canvas.width).toBe(600);
    expect(canvas.height).toBe(1200);
    expect(scale).toHaveBeenCalledWith(2, 2);
    expect(ctx).not.toBeNull();
  });

  it('keeps the CSS size at the logical size', () => {
    const { canvas } = makeCanvas();
    setupHiDpiCanvas(canvas, 300, 600, 2);

    expect(canvas.style.width).toBe('300px');
    expect(canvas.style.height).toBe('600px');
  });

  it('handles a non-integer device pixel ratio', () => {
    const { canvas, scale } = makeCanvas();
    setupHiDpiCanvas(canvas, 300, 600, 1.5);

    expect(canvas.width).toBe(450);
    expect(canvas.height).toBe(900);
    expect(scale).toHaveBeenCalledWith(1.5, 1.5);
  });

  it('disables image smoothing so cell edges stay hard', () => {
    const { canvas } = makeCanvas();
    const ctx = setupHiDpiCanvas(canvas, 300, 600, 2);

    expect(ctx?.imageSmoothingEnabled).toBe(false);
  });

  it('falls back to a ratio of 1', () => {
    const { canvas, scale } = makeCanvas();
    setupHiDpiCanvas(canvas, 300, 600, 1);

    expect(canvas.width).toBe(300);
    expect(scale).toHaveBeenCalledWith(1, 1);
  });
});
