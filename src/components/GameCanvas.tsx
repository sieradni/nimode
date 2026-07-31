import { EngineState } from '../engine/interfaces/IEngineCore';
import { QueueHoldCanvas } from './canvas/QueueHoldCanvas';
import { GameBoardCanvas } from './canvas/GameBoardCanvas';

export function GameCanvas({ state }: { state: EngineState }) {
  return (
    <div className="flex gap-8 items-start">
      <QueueHoldCanvas state={state} />
      <GameBoardCanvas state={state} />
    </div>
  );
}
