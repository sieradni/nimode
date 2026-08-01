import { useState } from 'react';
import { EngineState } from '../engine/interfaces/IEngineCore';
import { IEngineCore } from '../engine/interfaces/IEngineCore';
import { QueueHoldCanvas } from './canvas/QueueHoldCanvas';
import { GameBoardCanvas } from './canvas/GameBoardCanvas';
import { AnnotationTool } from './AnnotationToolbar';

interface GameCanvasProps {
  state: EngineState;
  engine: IEngineCore;
  annotationTool: AnnotationTool;
  annotationPieceType: number;
  autoColor: boolean;
}

export function GameCanvas({
  state,
  engine,
  annotationTool,
  annotationPieceType,
  autoColor,
}: GameCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);

  const handleAnnotationPen = (x: number, y: number, pieceType: number) => {
    engine.handleInput({ type: 'ANNOTATE_PEN', x, y, pieceType });
  };

  const handleAnnotationErase = (x: number, y: number) => {
    engine.handleInput({ type: 'ANNOTATE_ERASE', x, y });
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
    <div className="flex gap-8 items-start">
      <QueueHoldCanvas state={state} />
      <GameBoardCanvas
        state={state}
        onAnnotationPen={handleAnnotationPen}
        onAnnotationErase={handleAnnotationErase}
        onAnnotationRectFill={handleAnnotationRectFill}
        annotationTool={annotationTool}
        annotationPieceType={annotationPieceType}
        isDrawing={isDrawing}
        onDrawingStart={handleDrawingStart}
        onDrawingEnd={handleDrawingEnd}
      />
    </div>
  );
}
