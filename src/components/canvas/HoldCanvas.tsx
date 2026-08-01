import { useEffect, useRef } from 'react';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderHold } from '../../render/QueueHoldRenderer';
import { QUEUE_PREVIEW_SIZE } from '../../render/QueueHoldRenderer';

export const PREVIEW_CELL_SIZE = 20;

export function HoldCanvas({ state }: { state: EngineState }) {
  const holdRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const holdCanvas = holdRef.current;
    if (!holdCanvas) return;
    const holdCtx = holdCanvas.getContext('2d');
    if (!holdCtx) return;
    holdCtx.imageSmoothingEnabled = false;
    renderHold(holdCtx, state.hold, { cellSize: PREVIEW_CELL_SIZE });
  }, [state]);

  return (
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
  );
}