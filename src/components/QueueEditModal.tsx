import { useState, useCallback } from 'react';
import { PieceType, PIECE_COLORS } from '../engine/types';
import { getPieceMatrix } from '../engine/systems/SrsPlusRotationSystem';
import { parsePieceInput, pieceToLetter } from '../engine/pieceInput';
import { getBagBoundaryPositions } from '../render/bagBoundaries';

const QUEUE_PREVIEW_CELL = 20;
const PREVIEW_SLOT_COUNT = 8;

interface QueueEditModalProps {
  activePiece: PieceType | null;
  queue: PieceType[];
  bagRemaining: number;
  onConfirm: (pieces: PieceType[]) => void;
  onClose: () => void;
}

/**
 * Modal for editing the upcoming queue. Mounted only while open so the input
 * always starts from the current queue contents.
 */
export function QueueEditModal({
  activePiece,
  queue,
  bagRemaining,
  onConfirm,
  onClose,
}: QueueEditModalProps) {
  const [input, setInput] = useState(() =>
    queue.slice(0, PREVIEW_SLOT_COUNT - 1).map((p) => pieceToLetter(p)).join('')
  );

  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // Auto-capitalize: store uppercase letters; whitespace/commas allowed but
    // stripped on parse.
    setInput(e.target.value.toUpperCase());
  }, []);

  const parsed = parsePieceInput(input);

  const confirmFrom = useCallback(
    (typed: PieceType[]) => {
      // The actual queue after the edit: typed pieces replace the same-numbered
      // front of the current queue, and everything past the typed length is kept.
      const resultQueue: PieceType[] = [...typed, ...queue.slice(typed.length)];
      onConfirm(resultQueue);
    },
    [queue, onConfirm]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmFrom(parsePieceInput(input));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [input, confirmFrom, onClose]
  );

  // Preview = current falling piece (slot 0) + next 7 upcoming (8 slots total).
  const resultQueue: PieceType[] = [...parsed, ...queue.slice(parsed.length)];
  const upcoming = resultQueue.slice(0, PREVIEW_SLOT_COUNT - 1);
  const preview: (PieceType | null)[] = [activePiece, ...upcoming];
  // The falling piece consumes a slot of the current 7-bag, so boundary offsets
  // shift by +1 in the composite preview; every subsequent line recurs at +7.
  const boundaryPositions = getBagBoundaryPositions(
    PREVIEW_SLOT_COUNT,
    bagRemaining + 1
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Edit upcoming queue"
      >
        <h2 className="text-base font-bold text-slate-200 mb-4">Edit Upcoming Queue</h2>

        <fieldset className="mb-4 border border-slate-800 rounded-lg p-2">
          <legend className="px-1 text-[10px] uppercase tracking-wide text-slate-500">
            Result preview (next {PREVIEW_SLOT_COUNT} pieces)
          </legend>
          {preview.every((p) => p === null) ? (
            <span className="text-xs text-slate-500">Type tetromino letters…</span>
          ) : (
            <div className="flex flex-wrap items-center gap-1">
              {preview.map((piece, index) => {
                if (index > 0 && boundaryPositions.includes(index)) {
                  return (
                    <span key={`boundary-${index}`} className="flex items-center" aria-hidden="true">
                      <span data-testid="bag-boundary" className="mr-1 h-6 w-px bg-slate-500/50" />
                      {renderSlot(piece, `slot-${index}`)}
                    </span>
                  );
                }
                return renderSlot(piece, `slot-${index}`);
              })}
            </div>
          )}
        </fieldset>

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
            onClick={() => confirmFrom(parsed)}
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

function renderSlot(piece: PieceType | null, key: string) {
  return (
    <span
      key={key}
      data-testid="preview-slot"
      className={`inline-flex h-9 w-9 items-center justify-center rounded ${
        piece === null ? 'bg-slate-800/60' : 'bg-slate-800'
      }`}
      aria-hidden="true"
    >
      {piece !== null ? <PieceIcon piece={piece} /> : null}
    </span>
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