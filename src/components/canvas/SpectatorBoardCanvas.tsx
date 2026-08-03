import { useEffect, useRef, useState } from 'react';
import { BOARD_WIDTH, RENDER_HEIGHT } from '../../engine/types';
import type { SpectatorBuffer } from '../../p2p/SpectatorBuffer';
import { renderSpectatorState, PREVIEW_SLOT } from '../../render/SpectatorRenderer';

const BOARD_CELL_SIZE = 30;
const PREVIEW_CELL_SIZE = 20;

export function SpectatorBoardCanvas({ buffer }: { buffer: SpectatorBuffer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;

    let animationFrameId: number;
    const loop = () => {
      renderSpectatorState(ctx, buffer.getInterpolatedState(performance.now()), {
        boardCellSize: BOARD_CELL_SIZE,
        previewCellSize: PREVIEW_CELL_SIZE,
      });
      const nowHasData = buffer.hasData();
      setHasData((prev) => (prev === nowHasData ? prev : nowHasData));
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [buffer]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        data-testid="spectator-canvas"
        width={BOARD_WIDTH * BOARD_CELL_SIZE + PREVIEW_SLOT * PREVIEW_CELL_SIZE}
        height={RENDER_HEIGHT * BOARD_CELL_SIZE}
        className="rounded-lg border border-slate-800"
      />
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg">
          <span className="rounded bg-slate-900/85 px-3 py-1.5 text-xs text-slate-300">
            Waiting for player…
          </span>
        </div>
      )}
    </div>
  );
}