import { useEffect, useRef } from 'react';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderQueue, QUEUE_PREVIEW_SIZE, QUEUE_GAP } from '../../render/QueueHoldRenderer';

const MAX_VISIBLE_QUEUE = 5;

const QUEUE_CANVAS_HEIGHT =
  MAX_VISIBLE_QUEUE * (QUEUE_PREVIEW_SIZE * 20) +
  (MAX_VISIBLE_QUEUE - 1) * QUEUE_GAP;

export function QueueCanvas({ state }: { state: EngineState }) {
  const queueRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const queueCanvas = queueRef.current;
    if (!queueCanvas) return;
    const queueCtx = queueCanvas.getContext('2d');
    if (!queueCtx) return;
    queueCtx.imageSmoothingEnabled = false;
    renderQueue(queueCtx, state.queue.slice(0, MAX_VISIBLE_QUEUE), {
      cellSize: 20,
    });
  }, [state]);

  return (
    <canvas
      ref={queueRef}
      data-testid="queue-canvas"
      width={QUEUE_PREVIEW_SIZE * 20}
      height={QUEUE_CANVAS_HEIGHT}
      className="rounded-lg border border-slate-800"
    />
  );
}