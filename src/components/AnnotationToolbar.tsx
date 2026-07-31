import { useState } from 'react';
import { PieceType } from '../engine/types/piece';

export type AnnotationTool = 'pen' | 'erase' | 'rect';

export interface AnnotationToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  tool?: AnnotationTool;
  onToolChange?: (tool: AnnotationTool) => void;
  onClearAll?: () => void;
  autoColor?: boolean;
  onAutoColorToggle?: (enabled: boolean) => void;
  pieceType?: PieceType;
  onPieceTypeChange?: (pieceType: PieceType) => void;
}

const TOOL_LABELS: Record<AnnotationTool, string> = {
  pen: 'Pen',
  erase: 'Eraser',
  rect: 'Rect Fill',
};

const PIECE_OPTIONS: { value: PieceType; label: string }[] = [
  { value: 1, label: 'I' },
  { value: 2, label: 'J' },
  { value: 3, label: 'L' },
  { value: 4, label: 'O' },
  { value: 5, label: 'S' },
  { value: 6, label: 'T' },
  { value: 7, label: 'Z' },
];

export function AnnotationToolbar({
  isOpen,
  onClose,
  tool: initialTool = 'pen',
  onToolChange,
  onClearAll,
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
          {(['pen', 'erase', 'rect'] as AnnotationTool[]).map((t) => (
            <button
              key={t}
              type="button"
              role="button"
              aria-pressed={tool === t}
              onClick={() => handleToolChange(t)}
              className={`px-3 py-1.5 text-xs rounded transition-colors ${
                tool === t
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              {TOOL_LABELS[t]}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        {tool === 'pen' && (
          <div className="flex items-center gap-2">
            <label htmlFor="piece-type" className="text-xs text-slate-400">
              Piece:
            </label>
            <select
              id="piece-type"
              role="combobox"
              aria-label="Piece type"
              value={pieceType}
              onChange={(e) => handlePieceTypeChange(Number(e.target.value) as PieceType)}
              className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-400"
            >
              {PIECE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <label className="flex items-center gap-1.5 cursor-pointer">
          <input
            type="checkbox"
            role="checkbox"
            aria-label="Auto-color"
            checked={autoColor}
            onChange={(e) => handleAutoColorToggle(e.target.checked)}
            className="w-4 h-4 accent-sky-500 rounded border-slate-600 bg-slate-800"
          />
          <span className="text-xs text-slate-300">Auto-color</span>
        </label>

        <div className="w-px h-6 bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={onClearAll}
          className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
        >
          Clear All
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Close annotation toolbar"
        className="p-2 rounded-full bg-slate-900/95 border border-slate-700 text-slate-400 hover:text-sky-400 hover:border-sky-400 transition-colors"
      >
        ✕
      </button>
    </div>
  );
}