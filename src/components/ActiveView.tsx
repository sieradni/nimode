import { useEffect, useState } from 'react';
import { EngineState, IEngineCore } from '../engine/interfaces/IEngineCore';
import { GameCanvas } from './GameCanvas';
import { AnnotationTool, EditMode, PieceType, RotationState } from '../engine/types';
import { SpectatorBuffer } from '../p2p/SpectatorBuffer';
import type { InterpolatedState } from '../p2p/SpectatorBuffer';

interface ActiveViewProps {
  isLocal: boolean;
  state: EngineState;
  engine: IEngineCore;
  annotationTool: AnnotationTool;
  annotationColor: string;
  editMode: EditMode;
  onReset: () => void;
  spectatorBuffer: SpectatorBuffer | null;
}

function interpolatedToEngineState(interp: InterpolatedState): EngineState {
  return {
    board: interp.matrix,
    activePiece: interp.activePiece
      ? {
          type: interp.activePiece.type as PieceType,
          x: interp.activePiece.x,
          y: interp.activePiece.y,
          rotation: interp.activePiece.r as RotationState,
        }
      : null,
    queue: interp.queue as PieceType[],
    hold: interp.hold as PieceType | null,
    canHold: true,
    stats: interp.stats,
    gameOver: false,
    paused: false,
    annotations: interp.annotations,
    userPalette: interp.userPalette,
    bagRemaining: 0,
  };
}

/** Renders either the local game or the spectated board (see the view state machine). */
export function ActiveView({
  isLocal,
  state,
  engine,
  annotationTool,
  annotationColor,
  editMode,
  onReset,
  spectatorBuffer,
}: ActiveViewProps) {
  const [spectatorState, setSpectatorState] = useState<EngineState | null>(null);

  useEffect(() => {
    if (!spectatorBuffer) return;
    const buffer = spectatorBuffer;
    let rafId: number;
    function tick(now: number) {
      const interp = buffer.getInterpolatedState(now);
      if (interp.hasData) {
        setSpectatorState(interpolatedToEngineState(interp));
      } else {
        // The remote board has gone quiet/stale: clear it so we don't
        // keep replaying an old snapshot on the spectated view.
        setSpectatorState(null);
      }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [spectatorBuffer]);

  if (isLocal) {
    return (
      <GameCanvas
        state={state}
        engine={engine}
        annotationTool={annotationTool}
        annotationColor={annotationColor}
        editMode={editMode}
        onReset={onReset}
      />
    );
  }

  if (!spectatorBuffer || !spectatorState) return null;

  return (
    <GameCanvas
      state={spectatorState}
      engine={engine}
      annotationTool={annotationTool}
      annotationColor={annotationColor}
      editMode={editMode}
      onReset={onReset}
      readOnly
    />
  );
}
