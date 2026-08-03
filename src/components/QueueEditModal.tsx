import { useState, useCallback } from 'react';
import { PieceType, PIECE_COLORS } from '../engine/types';
import { getPieceMatrix } from '../engine/systems/SrsPlusRotationSystem';
import { parsePieceInput, pieceToLetter } from '../engine/pieceInput';

const QUEUE_PREVIEW_CELL = 20;

interface QueueEditModalProps {
  currentPieces: PieceType[];
  onConfirm: (pieces: PieceType[]) => void;
  onClose: () => void;
}

/**
 * Modal for editing the upcoming queue. Mounted only while open so the input
 * always starts from the current queue contents.
 */
export function QueueEditModal({ currentPieces, onConfirm, onClose }: QueueEditModalProps) {
  const [input, setInput] = useState(() => currentPieces.map((p) => pieceToLetter(p)).join(''));

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-capitalize: store uppercase letters; whitespace/commas allowed but
    // stripped on parse.
    setInput(e.target.value.toUpperCase());
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm(parsePieceInput(input));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [input, onConfirm, onClose]);

  const parsed = parsePieceInput(input);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-sm shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit upcoming queue"
      >
        <h2 className="text-base font-bold text-slate-200 mb-4">Edit Upcoming Queue</h2>

        <div className="mb-4 flex flex-wrap gap-1.5 min-h-[36px]">
          {parsed.length > 0 ? (
            parsed.map((piece, index) => (
              <span
                key={`${piece}-${index}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded bg-slate-800"
                title={pieceToLetter(piece)}
                aria-hidden="true"
              >
                <PieceIcon piece={piece} />
              </span>
            ))
          ) : (
            <span className="text-xs text-slate-500">Type tetromino letters…</span>
          )}
        </div>

        <input
          autoFocus
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="e.g. T I O S Z"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          className="w-full mb-1 px-3 py-2 text-sm font-mono tracking-widest bg-slate-800 border border-slate-700 rounded text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-slate-500"
        />
        <p className="text-xs text-slate-500 mb-4">
          Letters: I, J, L, O, S, T, Z. Replace the next {parsed.length || '…'} piece
          {parsed.length === 1 ? '' : 's'}.
        </p>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(parsed)}
            disabled={parsed.length === 0}
            className="px-4 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function PieceIcon({ piece }: { piece: PieceType }) {
  const matrix = getPieceMatrix(piece, 0);
  const color = PIECE_COLORS[piece];
  return (
    <svg width={QUEUE_PREVIEW_CELL} height={QUEUE_PREVIEW_CELL} viewBox="0 0 4 4">
      {matrix.map((row, y) =>
        row.map((cell, x) =>
          cell ? (
            <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} />
          ) : null
        )
      )}
    </svg>
  );
}