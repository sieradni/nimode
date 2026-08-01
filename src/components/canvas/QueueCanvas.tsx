import { useEffect, useRef } from 'react';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderQueue, QUEUE_PREVIEW_SIZE, QUEUE_GAP } from '../../render/QueueHoldRenderer';
import { setupHiDpiCanvas } from './canvasScaling';

const MAX_VISIBLE_QUEUE = 5;
const QUEUE_CELL_SIZE = 20;

const QUEUE_CANVAS_WIDTH = QUEUE_PREVIEW_SIZE * QUEUE_CELL_SIZE;
const QUEUE_CANVAS_HEIGHT =
  MAX_VISIBLE_QUEUE * (QUEUE_PREVIEW_SIZE * QUEUE_CELL_SIZE) +
  (MAX_VISIBLE_QUEUE - 1) * QUEUE_GAP;

export function QueueCanvas({ state }: { state: EngineState }) {
  const queueRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const queueCanvas = queueRef.current;
    if (!queueCanvas) return;
    const queueCtx = setupHiDpiCanvas(queueCanvas, QUEUE_CANVAS_WIDTH, QUEUE_CANVAS_HEIGHT);
    if (!queueCtx) return;
    renderQueue(queueCtx, state.queue.slice(0, MAX_VISIBLE_QUEUE), {
      cellSize: QUEUE_CELL_SIZE,
    });
  }, [state]);

  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Next</h2>
      <canvas
        ref={queueRef}
        data-testid="queue-canvas"
        width={QUEUE_CANVAS_WIDTH}
        height={QUEUE_CANVAS_HEIGHT}
        className="rounded-lg border border-slate-800"
      />
    </div>
  );
}
