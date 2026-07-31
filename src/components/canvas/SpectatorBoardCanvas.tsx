import { useEffect, useRef } from 'react';
import { BOARD_WIDTH, VISIBLE_HEIGHT } from '../../engine/types';
import type { SpectatorBuffer } from '../../p2p/SpectatorBuffer';
import { renderSpectatorState, PREVIEW_SLOT } from '../../render/SpectatorRenderer';

const BOARD_CELL_SIZE = 30;
const PREVIEW_CELL_SIZE = 20;

export function SpectatorBoardCanvas({ buffer }: { buffer: SpectatorBuffer }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const loop = () => {
      renderSpectatorState(ctx, buffer.getInterpolatedState(performance.now()), {
        boardCellSize: BOARD_CELL_SIZE,
        previewCellSize: PREVIEW_CELL_SIZE,
      });
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [buffer]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="spectator-canvas"
      width={BOARD_WIDTH * BOARD_CELL_SIZE + PREVIEW_SLOT * PREVIEW_CELL_SIZE}
      height={VISIBLE_HEIGHT * BOARD_CELL_SIZE}
      className="rounded-lg border border-slate-800"
    />
  );
}
