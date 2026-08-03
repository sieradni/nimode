import { useRef, useState, useCallback } from 'react';
import { EngineState } from '../engine/interfaces/IEngineCore';
import { IEngineCore } from '../engine/interfaces/IEngineCore';
import { HoldCanvas } from './canvas/HoldCanvas';
import { GameBoardCanvas } from './canvas/GameBoardCanvas';
import { QueueCanvas } from './canvas/QueueCanvas';
import { QueueEditModal } from './QueueEditModal';
import { AnnotationTool, EditMode, RENDER_HEIGHT, PieceType } from '../engine/types';
import { StatsPanel } from './StatsPanel';
import { useBoardScale, computePreviewCellSize, LAYOUT_GAP_PX } from './canvas/useBoardScale';
import { useAnnotationStroke } from './canvas/useAnnotationStroke';

interface GameCanvasProps {
  state: EngineState;
  engine: IEngineCore;
  annotationTool: AnnotationTool;
  annotationColor: string;
  editMode: EditMode;
  onReset: () => void;
  readOnly?: boolean;
}

export function GameCanvas({
  state,
  engine,
  annotationTool,
  annotationColor,
  editMode,
  onReset,
  readOnly = false,
}: GameCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);
  const cellSize = useBoardScale(layoutRef);
  const previewCellSize = computePreviewCellSize(cellSize);
  const stroke = useAnnotationStroke();

const handlePen = useCallback((x: number, y: number, color: string) => {
    if (readOnly) return;
    if (editMode === 'blocks') {
      engine.handleInput({ type: 'BOARD_PEN', x, y, color });
    } else {
      engine.handleInput({ type: 'ANNOTATE_PEN', x, y, color });
    }
  }, [engine, editMode, readOnly]);

  const handleErase = useCallback((x: number, y: number) => {
    if (readOnly) return;
    if (editMode === 'blocks') {
      engine.handleInput({ type: 'BOARD_ERASE', x, y });
    } else {
      engine.handleInput({ type: 'ANNOTATE_ERASE', x, y });
    }
  }, [engine, editMode, readOnly]);

  const handleFloodErase = useCallback((x: number, y: number) => {
    if (readOnly) return;
    if (editMode === 'blocks') {
      engine.handleInput({ type: 'BOARD_FLOOD_ERASE', x, y });
    } else {
      engine.handleInput({ type: 'ANNOTATE_FLOOD_ERASE', x, y });
    }
  }, [engine, editMode, readOnly]);

  const handleRectFill = useCallback((x1: number, y1: number, x2: number, y2: number, color: string) => {
    if (readOnly) return;
    if (editMode === 'blocks') {
      engine.handleInput({ type: 'BOARD_RECT_FILL', x1, y1, x2, y2, color });
    } else {
      engine.handleInput({ type: 'ANNOTATE_RECT_FILL', x1, y1, x2, y2, color });
    }
  }, [engine, editMode, readOnly]);

  const handleDrawingStart = useCallback(() => {
    if (readOnly) return;
    stroke.begin();
    engine.handleInput({ type: 'EDIT_BEGIN', mode: editMode });
    setIsDrawing(true);
  }, [stroke, engine, editMode, readOnly]);

  const handleDrawingEnd = useCallback(() => {
    if (readOnly) return;
    setIsDrawing(false);
    const cells = stroke.end();
    engine.handleInput({ type: 'EDIT_COMMIT', cells });
  }, [stroke, engine, readOnly]);

  const handleClearHold = useCallback(() => {
    if (readOnly) return;
    engine.handleInput({ type: 'CLEAR_HOLD' });
  }, [engine, readOnly]);

  const handleQueueOpen = useCallback(() => {
    if (readOnly) return;
    engine.setPaused(true);
    setQueueModalOpen(true);
  }, [engine, readOnly]);

  const handleQueueClose = useCallback(() => {
    if (readOnly) return;
    engine.setPaused(false);
    setQueueModalOpen(false);
  }, [engine, readOnly]);

  const handleQueueConfirm = useCallback(
    (resultQueue: PieceType[]) => {
      if (readOnly) return;
      engine.setQueue(resultQueue);
      engine.setPaused(false);
      setQueueModalOpen(false);
    },
    [engine, readOnly]
  );

  const gap = LAYOUT_GAP_PX;
  const previewColumnWidth = previewCellSize * 4;
  // Offset the side panels down by ~10% of the board's vertical height so they
  // sit slightly below the top edge rather than flush against it.
  const panelTopOffset = Math.round(0.1 * RENDER_HEIGHT * cellSize);

  return (
    <div
      ref={layoutRef}
      className="relative flex h-full w-full items-center justify-center gap-3"
      style={{ gap: `${gap}px` }}
    >
      {/* Left column: Hold (top) + Stats (bottom) */}
      <div className="flex flex-col items-center gap-3 self-start" style={{ width: previewColumnWidth, gap: `${gap}px`, marginTop: panelTopOffset }}>
        <HoldCanvas state={state} cellSize={previewCellSize} onClearHold={handleClearHold} />
        <StatsPanel stats={state.stats} cellSize={previewCellSize} />
      </div>

      {/* Center: Board */}
      <div className="flex items-center justify-center">
        <GameBoardCanvas
          state={state}
          cellSize={cellSize}
          annotationColor={annotationColor}
          onPen={handlePen}
          onErase={handleErase}
          onFloodErase={handleFloodErase}
          onRectFill={handleRectFill}
          annotationTool={annotationTool}
          isDrawing={isDrawing}
          onDrawingStart={handleDrawingStart}
          onDrawingEnd={handleDrawingEnd}
          onStrokeCell={stroke.add}
        />
      </div>

      {/* Right column: Queue (top-right adjacent) */}
      <div className="flex flex-col items-center self-start" style={{ width: previewColumnWidth, marginTop: panelTopOffset }}>
        <QueueCanvas state={state} cellSize={previewCellSize} onClick={handleQueueOpen} />
      </div>

      {queueModalOpen && (
        <QueueEditModal
          activePiece={state.activePiece?.type ?? null}
          queue={state.queue}
          bagRemaining={state.bagRemaining}
          onConfirm={handleQueueConfirm}
          onClose={handleQueueClose}
        />
      )}

      {state.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <div className="text-center">
            <h2 className="text-xl font-bold text-slate-200 mb-4">GAME OVER</h2>
            <button
              onClick={onReset}
              className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
            >
              Press R or Click to Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
