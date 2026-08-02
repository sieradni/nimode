import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { EngineState } from '../engine/interfaces/IEngineCore';
import { BOARD_WIDTH, VISIBLE_HEIGHT } from '../engine/types';
import { MIN_CELL_SIZE, computePreviewCellSize } from './canvas/useBoardScale';
import { renderBoard } from '../render/BoardRenderer';
import { renderQueue, renderHold } from '../render/QueueHoldRenderer';
import { GameCanvas } from './GameCanvas';
import { IEngineCore } from '../engine/interfaces/IEngineCore';

vi.mock('../render/BoardRenderer', () => ({
  renderBoard: vi.fn(),
}));
vi.mock('../render/QueueHoldRenderer', () => ({
  renderQueue: vi.fn(),
  renderHold: vi.fn(),
  QUEUE_PREVIEW_SIZE: 4,
  QUEUE_GAP: 4,
}));

function createState(): EngineState {
  const board = Array.from({ length: 40 }, () => Array(10).fill(0));
  const annotations = Array.from({ length: 40 }, () => Array(10).fill(0));
  return {
    board,
    activePiece: { type: 6, x: 3, y: 36, rotation: 0 },
    queue: [1, 2, 3, 4, 5, 6],
    hold: 7,
    canHold: true,
    stats: {
      piecesPlaced: 0,
      linesCleared: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      quads: 0,
      tSpins: 0,
      tSpinMinis: 0,
      pps: 0,
      apm: 0,
      kpp: 0,
      finesse: 0,
      efficiency: 0,
      attack: 0,
    },
    gameOver: false,
    paused: false,
    annotations,
    userPalette: ['#ffffff'],
  };
}

function createMockEngine(): IEngineCore {
  return {
    initialize: vi.fn(),
    updateConfig: vi.fn(),
    tick: vi.fn(),
    handleInput: vi.fn(),
    getState: vi.fn(),
    reset: vi.fn(),
    setQueue: vi.fn(),
    undo: vi.fn().mockReturnValue(true),
    redo: vi.fn().mockReturnValue(true),
    canUndo: vi.fn().mockReturnValue(true),
    canRedo: vi.fn().mockReturnValue(true),
    isAutoColorEnabled: vi.fn().mockReturnValue(true),
  };
}

/** In jsdom containers report zero size so useBoardScale clamps to MIN_CELL_SIZE. */
const previewCellSize = computePreviewCellSize(MIN_CELL_SIZE);

describe('GameCanvas', () => {
  let mockCtx: CanvasRenderingContext2D;
  const mockEngine = createMockEngine();

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx = {} as unknown as CanvasRenderingContext2D;
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => mockCtx
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  });

  it('renders board, hold, and queue canvases', () => {
    render(
      <GameCanvas
        state={createState()}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
         onReset={vi.fn()}
       />
    );
    expect(screen.getByTestId('board-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('hold-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('queue-canvas')).toBeInTheDocument();
  });

  it('sizes the board canvas to the visible playfield', () => {
    render(
      <GameCanvas
        state={createState()}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
         onReset={vi.fn()}
       />
    );
    const canvas = screen.getByTestId('board-canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(BOARD_WIDTH * MIN_CELL_SIZE);
    expect(canvas.height).toBe(VISIBLE_HEIGHT * MIN_CELL_SIZE);
  });

  it('sizes the hold canvas to one 4x4 preview slot at the preview cell size', () => {
    render(
      <GameCanvas
        state={createState()}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
         onReset={vi.fn()}
       />
    );
    const canvas = screen.getByTestId('hold-canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(4 * previewCellSize);
    expect(canvas.height).toBe(4 * previewCellSize);
  });

  it('sizes the queue canvas to five preview slots plus gaps at the preview cell size', () => {
    render(
      <GameCanvas
        state={createState()}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
         onReset={vi.fn()}
       />
    );
    const canvas = screen.getByTestId('queue-canvas') as HTMLCanvasElement;
    expect(canvas.width).toBe(4 * previewCellSize);
    expect(canvas.height).toBe(5 * 4 * previewCellSize + 4 * 4);
  });

  it('renders the board and active piece on mount', () => {
    const state = createState();
    render(
      <GameCanvas
        state={state}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
         onReset={vi.fn()}
       />
    );
    expect(vi.mocked(renderBoard)).toHaveBeenCalledWith(mockCtx, state.board, state.activePiece, state.annotations, {
      cellSize: MIN_CELL_SIZE,
      palette: state.userPalette,
    });
  });

  it('renders the hold piece on mount', () => {
    const state = createState();
    render(
      <GameCanvas
        state={state}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
         onReset={vi.fn()}
       />
    );
    expect(vi.mocked(renderHold)).toHaveBeenCalledWith(mockCtx, state.hold, { cellSize: previewCellSize });
  });

  it('renders the queue sliced to 5 previews', () => {
    const state = createState();
    render(
      <GameCanvas
        state={state}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
         onReset={vi.fn()}
       />
    );
    expect(vi.mocked(renderQueue)).toHaveBeenCalledWith(mockCtx, [1, 2, 3, 4, 5], {
      cellSize: previewCellSize,
    });
  });

  it('redraws when a new state object is provided', () => {
    const { rerender } = render(
      <GameCanvas
        state={createState()}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
         onReset={vi.fn()}
       />
    );
    expect(vi.mocked(renderBoard)).toHaveBeenCalledTimes(1);
    rerender(
      <GameCanvas
        state={createState()}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
         onReset={vi.fn()}
       />
    );
    expect(vi.mocked(renderBoard)).toHaveBeenCalledTimes(2);
  });

  it('renders a clear-hold button when a piece is held', () => {
    render(
      <GameCanvas
        state={createState()}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
        onReset={vi.fn()}
      />
    );
    expect(screen.getByLabelText('Clear hold')).toBeInTheDocument();
  });

  it('dispatches CLEAR_HOLD when the clear-hold button is clicked', () => {
    render(
      <GameCanvas
        state={createState()}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
        onReset={vi.fn()}
      />
    );
    screen.getByLabelText('Clear hold').click();
    expect(mockEngine.handleInput).toHaveBeenCalledWith({ type: 'CLEAR_HOLD' });
  });

  it('does not render the clear-hold button when nothing is held', () => {
    const state = createState();
    state.hold = null;
    render(
      <GameCanvas
        state={state}
        engine={mockEngine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
        onReset={vi.fn()}
      />
    );
    expect(screen.queryByLabelText('Clear hold')).not.toBeInTheDocument();
  });
});
