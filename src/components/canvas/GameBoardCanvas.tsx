import { useEffect, useRef } from 'react';
import { BOARD_WIDTH, VISIBLE_HEIGHT } from '../../engine/types';
import { EngineState } from '../../engine/interfaces/IEngineCore';
import { renderBoard } from '../../render/BoardRenderer';
import { renderStatsOverlay } from '../../render/StatsOverlayRenderer';

export const BOARD_CELL_SIZE = 30;

export function GameBoardCanvas({ state }: { state: EngineState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderBoard(ctx, state.board, state.activePiece, { cellSize: BOARD_CELL_SIZE });
    renderStatsOverlay(ctx, state.stats, canvas.width, canvas.height);
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      data-testid="board-canvas"
      width={BOARD_WIDTH * BOARD_CELL_SIZE}
      height={VISIBLE_HEIGHT * BOARD_CELL_SIZE}
      className="rounded-lg border border-slate-800"
    />
  );
}
