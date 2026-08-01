import { useEffect, useRef } from 'react';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderHold } from '../../render/QueueHoldRenderer';
import { QUEUE_PREVIEW_SIZE } from '../../render/QueueHoldRenderer';
import { setupHiDpiCanvas } from './canvasScaling';

export const PREVIEW_CELL_SIZE = 20;

export function HoldCanvas({ state }: { state: EngineState }) {
  const holdRef = useRef<HTMLCanvasElement>(null);

  const size = QUEUE_PREVIEW_SIZE * PREVIEW_CELL_SIZE;

  useEffect(() => {
    const holdCanvas = holdRef.current;
    if (!holdCanvas) return;
    const holdCtx = setupHiDpiCanvas(holdCanvas, size, size);
    if (!holdCtx) return;
    renderHold(holdCtx, state.hold, { cellSize: PREVIEW_CELL_SIZE });
  }, [state, size]);

  return (
    <div className="flex flex-col items-center">
      <h2 className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">Hold</h2>
      <canvas
        ref={holdRef}
        data-testid="hold-canvas"
        width={size}
        height={size}
        className="rounded-lg border border-slate-800"
      />
    </div>
  );
}