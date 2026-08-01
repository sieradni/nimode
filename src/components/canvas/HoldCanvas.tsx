import { useEffect, useRef } from 'react';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderHold } from '../../render/QueueHoldRenderer';
import { QUEUE_PREVIEW_SIZE } from '../../render/QueueHoldRenderer';
import { setupHiDpiCanvas } from './canvasScaling';

interface HoldCanvasProps {
  state: EngineState;
  cellSize: number;
  onClearHold?: () => void;
}

export function HoldCanvas({ state, cellSize, onClearHold }: HoldCanvasProps) {
  const holdRef = useRef<HTMLCanvasElement>(null);

  const size = QUEUE_PREVIEW_SIZE * cellSize;

  useEffect(() => {
    const holdCanvas = holdRef.current;
    if (!holdCanvas) return;
    const holdCtx = setupHiDpiCanvas(holdCanvas, size, size);
    if (!holdCtx) return;
    renderHold(holdCtx, state.hold, { cellSize });
  }, [state, size, cellSize]);

  const hasHold = state.hold !== null;

  return (
    <div className="relative flex flex-col items-center">
      <div className="mb-1 flex w-full items-center justify-between">
        <h2 className="text-[10px] uppercase tracking-wide text-slate-500">Hold</h2>
        {hasHold && onClearHold && (
          <button
            type="button"
            onClick={onClearHold}
            aria-label="Clear hold"
            title="Clear hold"
            className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-[10px] leading-none text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
          >
            ✕
          </button>
        )}
      </div>
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
