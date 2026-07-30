import { describe, it, expect, vi } from 'vitest';
import { renderQueue, renderHold } from '../QueueHoldRenderer';
import { PieceType } from '../../engine/types';

function createMockCtx() {
  const calls: Record<string, unknown[]> = {};
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
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

describe('renderQueue', () => {
  it('should render without throwing for an empty queue', () => {
    const ctx = createMockCtx();
    expect(() => renderQueue(ctx, [])).not.toThrow();
  });

  it('should draw each piece in the queue using fillRect', () => {
    const ctx = createMockCtx();
    const queue: PieceType[] = [1, 6];

    renderQueue(ctx, queue);

    const calls = (ctx as unknown as typeof ctx & { calls: Record<string, unknown[]> }).calls;
    expect(calls.fillRect).toBeDefined();
    const cellCalls = calls.fillRect!.filter(
      (c: unknown) => (c as Record<string, unknown>).fillStyle !== '#1a1a2e'
    );
    expect(cellCalls.length).toBeGreaterThanOrEqual(1);
  });

  it('should position pieces centered based on matrix dimensions', () => {
    const ctx = createMockCtx();
    const queue: PieceType[] = [4]; // O-piece, 2x2 matrix

    renderQueue(ctx, queue, { cellSize: 20 });

    const calls = (ctx as unknown as typeof ctx & { calls: Record<string, unknown[]> }).calls;
    const cellCalls = calls.fillRect!.filter(
      (c: unknown) => (c as Record<string, unknown>).fillStyle !== '#1a1a2e'
    );
    // O-piece has 4 filled cells, centered in 4x4 preview
    // offset = floor((4-2)/2) * 20 = 20
    expect(cellCalls.length).toBe(4);
    for (const c of cellCalls) {
      const call = c as Record<string, number>;
      expect(call.w).toBe(20);
      expect(call.h).toBe(20);
      expect(call.x).toBeGreaterThanOrEqual(20);
      expect(call.y).toBeGreaterThanOrEqual(20);
    }
  });

  it('should accept custom startX and startY', () => {
    const ctx = createMockCtx();
    const queue: PieceType[] = [1];

    renderQueue(ctx, queue, { cellSize: 20, startX: 50, startY: 100 });

    const calls = (ctx as unknown as typeof ctx & { calls: Record<string, unknown[]> }).calls;
    const cellCalls = calls.fillRect!.filter(
      (c: unknown) => (c as Record<string, unknown>).fillStyle !== '#1a1a2e'
    );
    expect(cellCalls.length).toBeGreaterThanOrEqual(1);
    const firstCall = cellCalls[0] as Record<string, number>;
    expect(firstCall.x).toBeGreaterThanOrEqual(50);
    expect(firstCall.y).toBeGreaterThanOrEqual(100);
  });
});

describe('renderHold', () => {
  it('should not throw when hold is null', () => {
    const ctx = createMockCtx();
    expect(() => renderHold(ctx, null)).not.toThrow();
  });

  it('should draw a held piece centered in preview box', () => {
    const ctx = createMockCtx();
    renderHold(ctx, 6); // T-piece

    const calls = (ctx as unknown as typeof ctx & { calls: Record<string, unknown[]> }).calls;
    expect(calls.fillRect).toBeDefined();
    const cellCalls = calls.fillRect!.filter(
      (c: unknown) => (c as Record<string, unknown>).fillStyle !== '#1a1a2e'
    );
    // T-piece has 4 filled cells at rotation 0
    expect(cellCalls.length).toBe(4);
  });

  it('should draw a border around the hold box', () => {
    const ctx = createMockCtx();
    renderHold(ctx, 6);

    expect(ctx.strokeRect).toHaveBeenCalled();
  });

  it('should accept custom cellSize', () => {
    const ctx = createMockCtx();
    renderHold(ctx, 1, { cellSize: 30 });

    const calls = (ctx as unknown as typeof ctx & { calls: Record<string, unknown[]> }).calls;
    expect(calls.fillRect).toBeDefined();
    const cellCalls = calls.fillRect!.filter(
      (c: unknown) => (c as Record<string, unknown>).fillStyle !== '#1a1a2e'
    );
    expect(cellCalls.length).toBe(4);
  });

  it('should draw background and border for null hold', () => {
    const ctx = createMockCtx();
    renderHold(ctx, null);

    const calls = (ctx as unknown as typeof ctx & { calls: Record<string, unknown[]> }).calls;
    const bgCalls = calls.fillRect!.filter(
      (c: unknown) => (c as Record<string, unknown>).fillStyle === '#1a1a2e'
    );
    expect(bgCalls.length).toBe(1);
    expect(ctx.strokeRect).toHaveBeenCalled();
  });
});
