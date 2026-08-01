import { EngineState, IEngineCore } from '../engine/interfaces/IEngineCore';
import { GameCanvas } from './GameCanvas';
import { SpectatorBoardCanvas } from './canvas/SpectatorBoardCanvas';
import { SpectatorStatsPanel } from './SpectatorStatsPanel';
import { AnnotationTool } from './AnnotationToolbar';
import { SpectatorBuffer } from '../p2p/SpectatorBuffer';

interface ActiveViewProps {
  isLocal: boolean;
  state: EngineState;
  engine: IEngineCore;
  annotationTool: AnnotationTool;
  annotationColor: string;
  autoColor: boolean;
  onReset: () => void;
  spectatorBuffer: SpectatorBuffer | null;
  onReturnToLocal: () => void;
}

/** Renders either the local game or the spectated board (see the view state machine). */
export function ActiveView({
  isLocal,
  state,
  engine,
  annotationTool,
  annotationColor,
  autoColor,
  onReset,
  spectatorBuffer,
  onReturnToLocal,
}: ActiveViewProps) {
  if (isLocal) {
    return (
      <GameCanvas
        state={state}
        engine={engine}
        annotationTool={annotationTool}
        annotationColor={annotationColor}
        autoColor={autoColor}
        onReset={onReset}
      />
    );
  }

  if (!spectatorBuffer) return null;

  return (
    <div className="flex h-full items-center justify-center gap-8">
      <SpectatorBoardCanvas buffer={spectatorBuffer} />
      <SpectatorStatsPanel buffer={spectatorBuffer} />
      <button
        onClick={onReturnToLocal}
        className="rounded bg-slate-800 px-3 py-1.5 text-xs text-slate-200 transition-colors hover:bg-slate-700"
      >
        Return to My Board
      </button>
    </div>
  );
}
