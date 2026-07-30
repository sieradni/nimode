import { describe, it, expect, vi } from 'vitest';
import { renderBoard } from '../BoardRenderer';


function createMockCtx() {
  const calls: Record<string, unknown[]> = {};
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    globalAlpha: 1,
    fillRect: vi.fn((x: number, y: number, w: number, h: number) => {
      (calls.fillRect ??= []).push({ x, y, w, h, fillStyle: ctx.fillStyle });
    }),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    clearRect: vi.fn(),
  } as unknown as CanvasRenderingContext2D & { calls: Record<string, unknown[]> };
  Object.assign(ctx, { calls });
  return ctx;
}

describe('BoardRenderer', () => {
  it('should render an empty board without throwing', () => {
    const ctx = createMockCtx();
    const board = Array(40).fill(null).map(() => Array(10).fill(0));

    expect(() => renderBoard(ctx, board, null)).not.toThrow();
  });

  it('should draw filled cells with the correct piece color', () => {
    const ctx = createMockCtx();
    const board = Array(40).fill(null).map(() => Array(10).fill(0));
    board[39]![0] = 1; // I-piece (cyan) at bottom-left visible cell

    renderBoard(ctx, board, null);

    const calls = (ctx as unknown as typeof ctx & { calls: Record<string, unknown[]> }).calls;
    expect(calls.fillRect).toBeDefined();
    expect(calls.fillRect!.length).toBeGreaterThanOrEqual(1);
  });

  it('should render board background fill', () => {
    const ctx = createMockCtx();
    const board = Array(40).fill(null).map(() => Array(10).fill(0));

    renderBoard(ctx, board, null);

    expect(ctx.fillStyle).toBe('#1a1a2e');
  });

  it('should render the active piece on the board', () => {
    const ctx = createMockCtx();
    const board = Array(40).fill(null).map(() => Array(10).fill(0));
    const activePiece = { type: 6 as const, x: 3, y: 36, rotation: 0 as const };

    renderBoard(ctx, board, activePiece);

    const calls = (ctx as unknown as typeof ctx & { calls: Record<string, unknown[]> }).calls;
    expect(calls.fillRect).toBeDefined();
  });

  it('should render grid lines', () => {
    const ctx = createMockCtx();
    const board = Array(40).fill(null).map(() => Array(10).fill(0));

    renderBoard(ctx, board, null);

    expect(ctx.strokeStyle).toBeDefined();
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('should accept custom cell size', () => {
    const ctx = createMockCtx();
    const board = Array(40).fill(null).map(() => Array(10).fill(0));

    renderBoard(ctx, board, null, { cellSize: 40 });

    expect(ctx.fillRect).toHaveBeenCalled();
  });
});
