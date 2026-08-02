import { useRef, useState, useCallback } from 'react';
import { EngineState } from '../engine/interfaces/IEngineCore';
import { IEngineCore } from '../engine/interfaces/IEngineCore';
import { HoldCanvas } from './canvas/HoldCanvas';
import { GameBoardCanvas } from './canvas/GameBoardCanvas';
import { QueueCanvas } from './canvas/QueueCanvas';
import { AnnotationTool, EditMode } from '../engine/types';
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
}

export function GameCanvas({
  state,
  engine,
  annotationTool,
  annotationColor,
  editMode,
  onReset,
}: GameCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const layoutRef = useRef<HTMLDivElement>(null);
  const cellSize = useBoardScale(layoutRef);
  const previewCellSize = computePreviewCellSize(cellSize);
  const stroke = useAnnotationStroke();

  const handlePen = useCallback((x: number, y: number, color: string) => {
    if (editMode === 'blocks') {
      engine.handleInput({ type: 'BOARD_PEN', x, y, color });
    } else {
      engine.handleInput({ type: 'ANNOTATE_PEN', x, y, color });
    }
  }, [engine, editMode]);

  const handleErase = useCallback((x: number, y: number) => {
    if (editMode === 'blocks') {
      engine.handleInput({ type: 'BOARD_ERASE', x, y });
    } else {
      engine.handleInput({ type: 'ANNOTATE_ERASE', x, y });
    }
  }, [engine, editMode]);

  const handleFloodErase = useCallback((x: number, y: number) => {
    if (editMode === 'blocks') {
      engine.handleInput({ type: 'BOARD_FLOOD_ERASE', x, y });
    } else {
      engine.handleInput({ type: 'ANNOTATE_FLOOD_ERASE', x, y });
    }
  }, [engine, editMode]);

  const handleRectFill = useCallback((x1: number, y1: number, x2: number, y2: number, color: string) => {
    if (editMode === 'blocks') {
      engine.handleInput({ type: 'BOARD_RECT_FILL', x1, y1, x2, y2, color });
    } else {
      engine.handleInput({ type: 'ANNOTATE_RECT_FILL', x1, y1, x2, y2, color });
    }
  }, [engine, editMode]);

  const handleDrawingStart = useCallback(() => {
    stroke.begin();
    engine.handleInput({ type: 'EDIT_BEGIN', mode: editMode });
    setIsDrawing(true);
  }, [stroke, engine, editMode]);

  const handleDrawingEnd = useCallback(() => {
    setIsDrawing(false);
    const cells = stroke.end();
    // Closing the transaction commits the whole gesture as one undo step and
    // folds stroke auto-color into the same snapshot.
    engine.handleInput({ type: 'EDIT_COMMIT', cells });
  }, [stroke, engine]);

  const handleClearHold = useCallback(() => {
    engine.handleInput({ type: 'CLEAR_HOLD' });
  }, [engine]);

  const gap = LAYOUT_GAP_PX;

  return (
    <div ref={layoutRef} className="relative flex h-full w-full items-stretch">
      {/* Left column: Hold (top) + Stats (bottom) */}
      <div className="flex w-16 flex-shrink-0 flex-col items-center gap-3 self-center" style={{ gap: `${gap}px` }}>
        <HoldCanvas state={state} cellSize={previewCellSize} onClearHold={handleClearHold} />
        <StatsPanel stats={state.stats} cellSize={previewCellSize} />
      </div>

      {/* Center: Board */}
      <div className="flex min-w-0 flex-1 items-center justify-center" style={{ paddingLeft: `${gap}px`, paddingRight: `${gap}px` }}>
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
      <div className="flex w-16 flex-shrink-0 flex-col items-center self-center">
        <QueueCanvas state={state} cellSize={previewCellSize} />
      </div>

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
