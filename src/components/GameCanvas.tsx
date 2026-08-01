import { useRef, useState } from 'react';
import { EngineState } from '../engine/interfaces/IEngineCore';
import { IEngineCore } from '../engine/interfaces/IEngineCore';
import { HoldCanvas } from './canvas/HoldCanvas';
import { GameBoardCanvas } from './canvas/GameBoardCanvas';
import { QueueCanvas } from './canvas/QueueCanvas';
import { AnnotationTool } from './AnnotationToolbar';
import { StatsPanel } from './StatsPanel';
import { useBoardScale } from './canvas/useBoardScale';
import { useAnnotationStroke } from './canvas/useAnnotationStroke';
import { ANNOTATION_PLAIN } from '../render/annotationColors';

interface GameCanvasProps {
  state: EngineState;
  engine: IEngineCore;
  annotationTool: AnnotationTool;
  annotationColor: string;
  autoColor: boolean;
  onReset: () => void;
}

export function GameCanvas({
  state,
  engine,
  annotationTool,
  annotationColor,
  autoColor,
  onReset,
}: GameCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const boardAreaRef = useRef<HTMLDivElement>(null);
  const cellSize = useBoardScale(boardAreaRef);
  const stroke = useAnnotationStroke();

  const handleAnnotationPen = (x: number, y: number) => {
    // Drawn cells carry a neutral marker; only auto-color assigns a piece type.
    engine.handleInput({ type: 'ANNOTATE_PEN', x, y, pieceType: ANNOTATION_PLAIN });
  };

  const handleAnnotationErase = (x: number, y: number) => {
    engine.handleInput({ type: 'ANNOTATE_ERASE', x, y });
  };

  const handleAnnotationFloodErase = (x: number, y: number) => {
    engine.handleInput({ type: 'ANNOTATE_FLOOD_ERASE', x, y });
  };

  const handleAnnotationRectFill = (x1: number, y1: number, x2: number, y2: number) => {
    engine.handleInput({ type: 'ANNOTATE_RECT_FILL', x1, y1, x2, y2, pieceType: ANNOTATION_PLAIN });
  };

  const handleDrawingStart = () => {
    stroke.begin();
    setIsDrawing(true);
  };

  const handleDrawingEnd = () => {
    setIsDrawing(false);
    const cells = stroke.end();
    // Auto-color matches the shape the player just drew, so a piece drawn
    // adjacent to an existing one is still recognised (US-7.5).
    if (autoColor && cells.length > 0) {
      engine.handleInput({ type: 'ANNOTATE_AUTO_COLOR_STROKE', cells });
    }
  };

  return (
    <div className="relative flex h-full w-full items-stretch gap-4">
      <div className="flex w-40 flex-shrink-0 flex-col gap-4 self-center">
        <StatsPanel stats={state.stats} />
      </div>

      <div ref={boardAreaRef} className="flex min-w-0 flex-1 items-center justify-center">
        <GameBoardCanvas
          state={state}
          cellSize={cellSize}
          annotationColor={annotationColor}
          onAnnotationPen={handleAnnotationPen}
          onAnnotationErase={handleAnnotationErase}
          onAnnotationFloodErase={handleAnnotationFloodErase}
          onAnnotationRectFill={handleAnnotationRectFill}
          annotationTool={annotationTool}
          isDrawing={isDrawing}
          onDrawingStart={handleDrawingStart}
          onDrawingEnd={handleDrawingEnd}
          onStrokeCell={stroke.add}
        />
      </div>

      <div className="flex w-24 flex-shrink-0 flex-col items-center gap-4 self-center">
        <QueueCanvas state={state} />
        <HoldCanvas state={state} />
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
