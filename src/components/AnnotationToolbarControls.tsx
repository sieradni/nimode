import { PieceType } from '../engine/types/piece';
import type { AnnotationTool } from './canvas/canvasConstants';

interface AnnotationToolbarControlsProps {
  tool: AnnotationTool;
  autoColor: boolean;
  pieceType: PieceType;
  onAutoColorToggle: (enabled: boolean) => void;
  onPieceTypeChange: (pieceType: PieceType) => void;
}

const PIECE_OPTIONS: { value: PieceType; label: string }[] = [
  { value: 1, label: 'I' },
  { value: 2, label: 'J' },
  { value: 3, label: 'L' },
  { value: 4, label: 'O' },
  { value: 5, label: 'S' },
  { value: 6, label: 'T' },
  { value: 7, label: 'Z' },
];

export function AnnotationToolbarControls({
  tool,
  autoColor,
  pieceType,
  onAutoColorToggle,
  onPieceTypeChange,
}: AnnotationToolbarControlsProps) {
  return (
    <>
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
            onChange={(e) => onPieceTypeChange(Number(e.target.value) as PieceType)}
            className="px-2 py-1 text-xs bg-slate-800 border border-slate-700 rounded text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-400"
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
          onChange={(e) => onAutoColorToggle(e.target.checked)}
          className="w-4 h-4 accent-slate-500 rounded border-slate-600 bg-slate-800"
        />
        <span className="text-xs text-slate-300">Auto-color</span>
      </label>
    </>
  );
}
