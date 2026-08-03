import { useEffect, useRef } from 'react';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderQueue, QUEUE_PREVIEW_SIZE, QUEUE_GAP } from '../../render/QueueHoldRenderer';
import { setupHiDpiCanvas } from './canvasScaling';

const MAX_VISIBLE_QUEUE = 5;

interface QueueCanvasProps {
  state: EngineState;
  cellSize: number;
  onClick: () => void;
}

export function QueueCanvas({ state, cellSize, onClick }: QueueCanvasProps) {
  const queueRef = useRef<HTMLCanvasElement>(null);

  const canvasWidth = QUEUE_PREVIEW_SIZE * cellSize;
  const canvasHeight =
    MAX_VISIBLE_QUEUE * (QUEUE_PREVIEW_SIZE * cellSize) + (MAX_VISIBLE_QUEUE - 1) * QUEUE_GAP;

  useEffect(() => {
    const queueCanvas = queueRef.current;
    if (!queueCanvas) return;
    const queueCtx = setupHiDpiCanvas(queueCanvas, canvasWidth, canvasHeight);
    if (!queueCtx) return;
    renderQueue(queueCtx, state.queue.slice(0, MAX_VISIBLE_QUEUE), {
      cellSize,
      bagRemaining: state.bagRemaining,
    });
  }, [state, cellSize, canvasWidth, canvasHeight]);

  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Next</h2>
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg border border-slate-800 p-0 transition-colors hover:border-slate-500 hover:bg-slate-800/40 cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-slate-400"
        aria-label="Edit upcoming queue"
        title="Click to edit the upcoming queue"
      >
        <canvas
          ref={queueRef}
          data-testid="queue-canvas"
          width={canvasWidth}
          height={canvasHeight}
          className="rounded-lg"
        />
      </button>
    </div>
  );
}
