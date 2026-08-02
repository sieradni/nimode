import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { BOARD_WIDTH, RENDER_HEIGHT } from '../engine/types';
import { GameBoardCanvas, BOARD_CELL_SIZE } from '../components/canvas/GameBoardCanvas';
import type { EngineState } from '../engine/interfaces/IEngineCore';

vi.mock('../render/BoardRenderer', () => ({ renderBoard: vi.fn() }));

const baseState = {
  board: Array.from({ length: 40 }, () => Array(BOARD_WIDTH).fill(0)),
  activePiece: { type: 6, x: 3, y: 36, rotation: 0 },
  annotations: Array.from({ length: 40 }, () => Array(BOARD_WIDTH).fill(0)),
  userPalette: ['#ffffff'],
  queue: [1, 2, 3],
  hold: 7,
  canHold: true,
  stats: {} as unknown as EngineState['stats'],
  gameOver: false,
  paused: false,
} as unknown as EngineState;

function setupCanvas(canvas: HTMLCanvasElement): void {
  Object.defineProperty(canvas, 'width', { value: BOARD_WIDTH * BOARD_CELL_SIZE, configurable: true });
  Object.defineProperty(canvas, 'height', { value: RENDER_HEIGHT * BOARD_CELL_SIZE, configurable: true });
  vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    width: BOARD_WIDTH * BOARD_CELL_SIZE,
    height: RENDER_HEIGHT * BOARD_CELL_SIZE,
    bottom: RENDER_HEIGHT * BOARD_CELL_SIZE,
    right: BOARD_WIDTH * BOARD_CELL_SIZE,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  HTMLCanvasElement.prototype.getContext = vi.fn(
    () =>
      ({
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        beginPath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        stroke: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        transform: vi.fn(),
        clearRect: vi.fn(),
      }) as unknown as CanvasRenderingContext2D,
  ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

describe('GameBoardCanvas', () => {
  it('emits continuous pen strokes along a drag path', () => {
    const onPen = vi.fn();
    const { getByTestId } = render(
      <GameBoardCanvas
        state={baseState}
        onPen={onPen}
        annotationTool="pen"
        isDrawing
      />,
    );
    const canvas = getByTestId('board-canvas') as HTMLCanvasElement;
    setupCanvas(canvas);
    fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
    expect(onPen).toHaveBeenCalled();
    onPen.mockClear();
    fireEvent.mouseMove(canvas, { clientX: 2 * BOARD_CELL_SIZE + 5, clientY: BOARD_CELL_SIZE + 5 });
    expect(onPen).toHaveBeenCalled();
    const xs = new Set(onPen.mock.calls.map((c) => c[0]));
    expect(xs.size).toBeGreaterThan(1);
  });

  it('emits continuous erase strokes along a drag path', () => {
    const onErase = vi.fn();
    const { getByTestId } = render(
      <GameBoardCanvas
        state={baseState}
        onErase={onErase}
        annotationTool="erase"
        isDrawing
      />,
    );
    const canvas = getByTestId('board-canvas') as HTMLCanvasElement;
    setupCanvas(canvas);
    fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
    fireEvent.mouseMove(canvas, { clientX: 3 * BOARD_CELL_SIZE + 5, clientY: 5 });
    expect(onErase).toHaveBeenCalled();
    const xs = new Set(onErase.mock.calls.map((c) => c[0]));
    expect(xs.size).toBeGreaterThan(1);
  });

  it('does not emit during mousemove when drawing is false', () => {
    const onPen = vi.fn();
    const { getByTestId } = render(
      <GameBoardCanvas
        state={baseState}
        onPen={onPen}
        annotationTool="pen"
        isDrawing={false}
      />,
    );
    const canvas = getByTestId('board-canvas') as HTMLCanvasElement;
    setupCanvas(canvas);
    fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
    expect(onPen).not.toHaveBeenCalled();
  });
});
