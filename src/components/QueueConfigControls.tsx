import { useState, useEffect, useCallback } from 'react';
import { GameConfigStore } from '../engine/configStore';
import { PieceType, PIECE_NAMES } from '../engine/types';

const QUEUE_SLOTS = 6;

interface QueueConfigControlsProps {
  store: GameConfigStore;
}

function slotValue(piece: PieceType | undefined): number {
  if (piece === undefined || piece < 1) return 0;
  return piece;
}

export function QueueConfigControls({ store }: QueueConfigControlsProps) {
  const [config, setConfig] = useState(() => store.getConfig());

  const refresh = useCallback(() => {
    setConfig(store.getConfig());
  }, [store]);

  useEffect(() => {
    store.subscribe(refresh);
    return () => store.unsubscribe(refresh);
  }, [store, refresh]);

  const handleSlotChange = (index: number, value: string) => {
    const piece = parseInt(value, 10) as PieceType;
    const queue: PieceType[] = [];
    for (let i = 0; i < QUEUE_SLOTS; i++) {
      if (i === index) {
        queue.push(piece);
      } else {
        queue.push((config.queue[i] ?? 0) as PieceType);
      }
    }
    store.setConfig({ ...config, queue: filterQueue(queue) });
  };

  function filterQueue(queue: PieceType[]): PieceType[] {
    return queue.filter((p) => p >= 1);
  }

  const handleRandomize = () => {
    const pieceTypes: PieceType[] = [1, 2, 3, 4, 5, 6, 7];
    const queue: PieceType[] = Array.from({ length: QUEUE_SLOTS }, () => {
      const idx = Math.floor(Math.random() * pieceTypes.length);
      const picked = pieceTypes[idx]!;
      return picked;
    });
    store.setConfig({ ...config, queue: filterQueue(queue) });
  };

  const handleClear = () => {
    store.setConfig({ ...config, queue: [] });
  };

  return (
    <div className="mb-4 space-y-3 border-t border-slate-800 pt-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Upcoming Queue Preset
      </h3>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: QUEUE_SLOTS }).map((_, index) => (
          <select
            key={index}
            value={slotValue(config.queue[index])}
            onChange={(e) => handleSlotChange(index, e.target.value)}
            className="w-12 px-1 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200"
            aria-label={`Queue slot ${index + 1}`}
          >
            <option value={0}>Empty</option>
            {([1, 2, 3, 4, 5, 6, 7] as const).map((pt) => (
              <option key={pt} value={pt}>
                {PIECE_NAMES[pt]}
              </option>
            ))}
          </select>
        ))}
      </div>
      {config.queue.length > 0 && (
        <p className="text-xs text-slate-500">
          Preset: {config.queue.map((p) => PIECE_NAMES[p]).join(', ')}
        </p>
      )}
      {config.queue.length === 0 && (
        <p className="text-xs text-slate-500">
          Empty queue uses the randomizer for new games.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleRandomize}
          className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
        >
          Randomize
        </button>
        <button
          onClick={handleClear}
          className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
        >
          Clear
        </button>
      </div>
    </div>
  );
}