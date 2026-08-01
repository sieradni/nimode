import { useState } from 'react';
import { EngineState } from '../engine/interfaces/IEngineCore';
import { IEngineCore } from '../engine/interfaces/IEngineCore';
import { HoldCanvas } from './canvas/HoldCanvas';
import { GameBoardCanvas } from './canvas/GameBoardCanvas';
import { QueueCanvas } from './canvas/QueueCanvas';
import { AnnotationTool } from './AnnotationToolbar';
import { StatsPanel } from './StatsPanel';

interface GameCanvasProps {
  state: EngineState;
  engine: IEngineCore;
  annotationTool: AnnotationTool;
  annotationPieceType: number;
  autoColor: boolean;
  onReset: () => void;
}

export function GameCanvas({
  state,
  engine,
  annotationTool,
  annotationPieceType,
  autoColor,
  onReset,
}: GameCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);

  const handleAnnotationPen = (x: number, y: number, pieceType: number) => {
    engine.handleInput({ type: 'ANNOTATE_PEN', x, y, pieceType });
  };

  const handleAnnotationErase = (x: number, y: number) => {
    engine.handleInput({ type: 'ANNOTATE_ERASE', x, y });
  };

  const handleAnnotationFloodErase = (x: number, y: number) => {
    engine.handleInput({ type: 'ANNOTATE_FLOOD_ERASE', x, y });
  };

  const handleAnnotationRectFill = (x1: number, y1: number, x2: number, y2: number, pieceType: number) => {
    engine.handleInput({ type: 'ANNOTATE_RECT_FILL', x1, y1, x2, y2, pieceType });
  };

  const handleDrawingStart = () => {
    setIsDrawing(true);
  };

  const handleDrawingEnd = () => {
    setIsDrawing(false);
    if (autoColor) {
      engine.handleInput({ type: 'ANNOTATE_AUTO_COLOR' });
    }
  };

  return (
    <div className="relative flex gap-8 items-start">
      <HoldCanvas state={state} />
      <div className="flex flex-col gap-4 items-center">
        <GameBoardCanvas
          state={state}
          onAnnotationPen={handleAnnotationPen}
          onAnnotationErase={handleAnnotationErase}
          onAnnotationFloodErase={handleAnnotationFloodErase}
          onAnnotationRectFill={handleAnnotationRectFill}
          annotationTool={annotationTool}
          annotationPieceType={annotationPieceType}
          isDrawing={isDrawing}
          onDrawingStart={handleDrawingStart}
          onDrawingEnd={handleDrawingEnd}
        />
        <QueueCanvas state={state} />
      </div>
      <StatsPanel stats={state.stats} />
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
