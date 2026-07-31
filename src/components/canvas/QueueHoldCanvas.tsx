import { useEffect, useRef } from 'react';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import {
  renderHold,
  renderQueue,
  QUEUE_PREVIEW_SIZE,
  QUEUE_GAP,
} from '../../render/QueueHoldRenderer';

export const PREVIEW_CELL_SIZE = 20;

const MAX_VISIBLE_QUEUE = 5;

const QUEUE_CANVAS_HEIGHT =
  MAX_VISIBLE_QUEUE * (QUEUE_PREVIEW_SIZE * PREVIEW_CELL_SIZE) +
  (MAX_VISIBLE_QUEUE - 1) * QUEUE_GAP;

export function QueueHoldCanvas({ state }: { state: EngineState }) {
  const holdRef = useRef<HTMLCanvasElement>(null);
  const queueRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const holdCanvas = holdRef.current;
    if (holdCanvas) {
      const holdCtx = holdCanvas.getContext('2d');
      if (holdCtx) {
        renderHold(holdCtx, state.hold, { cellSize: PREVIEW_CELL_SIZE });
      }
    }
    const queueCanvas = queueRef.current;
    if (queueCanvas) {
      const queueCtx = queueCanvas.getContext('2d');
      if (queueCtx) {
        renderQueue(queueCtx, state.queue.slice(0, MAX_VISIBLE_QUEUE), {
          cellSize: PREVIEW_CELL_SIZE,
        });
      }
    }
  }, [state]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center">
        <h2 className="text-sm font-semibold mb-2 text-slate-400">HOLD</h2>
        <canvas
          ref={holdRef}
          data-testid="hold-canvas"
          width={QUEUE_PREVIEW_SIZE * PREVIEW_CELL_SIZE}
          height={QUEUE_PREVIEW_SIZE * PREVIEW_CELL_SIZE}
          className="rounded-lg border border-slate-800"
        />
      </div>
      <div className="flex flex-col items-center">
        <h2 className="text-sm font-semibold mb-2 text-slate-400">NEXT</h2>
        <canvas
          ref={queueRef}
          data-testid="queue-canvas"
          width={QUEUE_PREVIEW_SIZE * PREVIEW_CELL_SIZE}
          height={QUEUE_CANVAS_HEIGHT}
          className="rounded-lg border border-slate-800"
        />
      </div>
    </div>
  );
}
