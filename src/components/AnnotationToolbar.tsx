import { useState } from 'react';
import { PieceType } from '../engine/types/piece';
import { AnnotationToolbarControls } from './AnnotationToolbarControls';
import type { AnnotationTool } from './canvas/canvasConstants';

export type { AnnotationTool } from './canvas/canvasConstants';

export interface AnnotationToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  tool?: AnnotationTool;
  onToolChange?: (tool: AnnotationTool) => void;
  onClearAll?: () => void;
  onResetBoard?: () => void;
  autoColor?: boolean;
  onAutoColorToggle?: (enabled: boolean) => void;
  pieceType?: PieceType;
  onPieceTypeChange?: (pieceType: PieceType) => void;
}

const TOOL_LABELS: Record<AnnotationTool, string> = {
  pen: 'Pen',
  erase: 'Eraser',
  floodErase: 'Flood Erase',
  rect: 'Rect Fill',
};

export function AnnotationToolbar({
  isOpen,
  onClose,
  tool: initialTool = 'pen',
  onToolChange,
  onClearAll,
  onResetBoard,
  autoColor: initialAutoColor = false,
  onAutoColorToggle,
  pieceType: initialPieceType = 1,
  onPieceTypeChange,
}: AnnotationToolbarProps) {
  const [tool, setTool] = useState<AnnotationTool>(initialTool);
  const [autoColor, setAutoColor] = useState<boolean>(initialAutoColor);
  const [pieceType, setPieceType] = useState<PieceType>(initialPieceType);

  const handleToolChange = (newTool: AnnotationTool) => {
    setTool(newTool);
    onToolChange?.(newTool);
  };

  const handleAutoColorToggle = (enabled: boolean) => {
    setAutoColor(enabled);
    onAutoColorToggle?.(enabled);
  };

  const handlePieceTypeChange = (newPieceType: PieceType) => {
    setPieceType(newPieceType);
    onPieceTypeChange?.(newPieceType);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-2">
      <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-3 flex items-center gap-2">
        <div className="flex items-center gap-1 bg-slate-800 rounded p-1">
          {(['pen', 'erase', 'floodErase', 'rect'] as AnnotationTool[]).map((t) => (
            <button
              key={t}
              type="button"
              role="button"
              aria-pressed={tool === t}
              onClick={() => handleToolChange(t)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                tool === t
                  ? 'bg-slate-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {TOOL_LABELS[t]}
            </button>
          ))}
        </div>

        <AnnotationToolbarControls
          tool={tool}
          autoColor={autoColor}
          pieceType={pieceType}
          onAutoColorToggle={handleAutoColorToggle}
          onPieceTypeChange={handlePieceTypeChange}
        />

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={onClearAll}
          className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
        >
          Clear All
        </button>

        {onResetBoard && (
          <button
            type="button"
            onClick={onResetBoard}
            className="px-3 py-1.5 text-xs rounded bg-red-900/60 hover:bg-red-800/60 text-red-200 transition-colors"
          >
            Reset Board
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close annotation toolbar"
        className="p-2 rounded-full bg-slate-900/95 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-400 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}