import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { BOARD_WIDTH, RENDER_HEIGHT, RENDER_TOP_Y } from '../engine/types';
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

  describe('tap-to-erase on occupied cells (pen)', () => {
    function stateWithBoard(y: number, x: number): EngineState {
      const board = baseState.board.map((row) => [...row]);
      const row = board[y];
      if (row) row[x] = 1;
      return { ...baseState, board };
    }

    it('erases a placed block instead of painting when a pen stroke starts on it', () => {
      const onPen = vi.fn();
      const onErase = vi.fn();
      const { getByTestId } = render(
        <GameBoardCanvas
          state={stateWithBoard(RENDER_TOP_Y, 0)}
          onPen={onPen}
          onErase={onErase}
          annotationTool="pen"
          editMode="blocks"
          isDrawing
        />,
      );
      const canvas = getByTestId('board-canvas') as HTMLCanvasElement;
      setupCanvas(canvas);
      fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
      expect(onErase).toHaveBeenCalledWith(0, RENDER_TOP_Y);
      expect(onPen).not.toHaveBeenCalled();
    });

    it('erases a drawn annotation when a pen stroke starts on it', () => {
      const onPen = vi.fn();
      const onErase = vi.fn();
      const annotations = baseState.annotations.map((row) => [...row]);
      const row = annotations[RENDER_TOP_Y];
      if (row) row[0] = 1;
      const { getByTestId } = render(
        <GameBoardCanvas
          state={{ ...baseState, annotations }}
          onPen={onPen}
          onErase={onErase}
          annotationTool="pen"
          editMode="annotations"
          isDrawing
        />,
      );
      const canvas = getByTestId('board-canvas') as HTMLCanvasElement;
      setupCanvas(canvas);
      fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
      expect(onErase).toHaveBeenCalledWith(0, RENDER_TOP_Y);
      expect(onPen).not.toHaveBeenCalled();
    });

    it('still paints when a pen stroke starts on an empty cell', () => {
      const onPen = vi.fn();
      const onErase = vi.fn();
      const { getByTestId } = render(
        <GameBoardCanvas
          state={baseState}
          onPen={onPen}
          onErase={onErase}
          annotationTool="pen"
          editMode="blocks"
          isDrawing
        />,
      );
      const canvas = getByTestId('board-canvas') as HTMLCanvasElement;
      setupCanvas(canvas);
      fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
      expect(onPen).toHaveBeenCalled();
      expect(onErase).not.toHaveBeenCalled();
    });

    it('does not tap-erase for the rect tool', () => {
      const onPen = vi.fn();
      const onErase = vi.fn();
      const onFloodErase = vi.fn();
      const onRectFill = vi.fn();
      const { getByTestId } = render(
        <GameBoardCanvas
          state={stateWithBoard(RENDER_TOP_Y, 0)}
          onPen={onPen}
          onErase={onErase}
          onFloodErase={onFloodErase}
          onRectFill={onRectFill}
          annotationTool="rect"
          editMode="blocks"
          isDrawing
        />,
      );
      const canvas = getByTestId('board-canvas') as HTMLCanvasElement;
      setupCanvas(canvas);
      fireEvent.mouseDown(canvas, { clientX: 5, clientY: 5 });
      expect(onErase).not.toHaveBeenCalled();
      expect(onFloodErase).not.toHaveBeenCalled();
    });
  });

  describe('rect fill right-click', () => {
    it('flood-erases the blob under the cursor', () => {
      const onFloodErase = vi.fn();
      const { getByTestId } = render(
        <GameBoardCanvas
          state={baseState}
          onFloodErase={onFloodErase}
          annotationTool="rect"
          isDrawing
        />,
      );
      const canvas = getByTestId('board-canvas') as HTMLCanvasElement;
      setupCanvas(canvas);
      fireEvent.mouseDown(canvas, { button: 2, clientX: 5, clientY: 5 });
      expect(onFloodErase).toHaveBeenCalledWith(0, RENDER_TOP_Y);
    });

    it('flood-erases along the drag path', () => {
      const onFloodErase = vi.fn();
      const { getByTestId } = render(
        <GameBoardCanvas
          state={baseState}
          onFloodErase={onFloodErase}
          annotationTool="rect"
          isDrawing
        />,
      );
      const canvas = getByTestId('board-canvas') as HTMLCanvasElement;
      setupCanvas(canvas);
      fireEvent.mouseDown(canvas, { button: 2, clientX: 5, clientY: 5 });
      onFloodErase.mockClear();
      fireEvent.mouseMove(canvas, { clientX: 3 * BOARD_CELL_SIZE + 5, clientY: 5 });
      expect(onFloodErase).toHaveBeenCalled();
      const xs = new Set(onFloodErase.mock.calls.map((c) => c[0]));
      expect(xs.size).toBeGreaterThan(1);
    });
  });
});
