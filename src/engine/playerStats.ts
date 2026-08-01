import { StatsTracker } from './statsTracker';
import { FinesseTracker, FinesseInputKind } from './finesseTracker';
import { ActivePiece, GameStats } from './types';
import { LockResult } from './tSpinDetector';

export class PlayerStats {
  private readonly statsTracker = new StatsTracker();
  private readonly finesseTracker = new FinesseTracker();

  tick(dt: number): void {
    this.statsTracker.tick(dt);
  }

  recordKeyPress(): void {
    this.statsTracker.recordKeyPress();
  }

  recordInput(kind: FinesseInputKind): void {
    this.finesseTracker.recordInput(kind);
  }

  onPieceSpawn(piece: ActivePiece | null): void {
    if (piece) {
      this.finesseTracker.beginPiece(piece.x, piece.rotation);
    }
  }

  onPieceLock(result: LockResult, piece: ActivePiece | null): void {
    this.statsTracker.recordPiecePlaced();
    if (result.linesCleared > 0) {
      this.statsTracker.recordLineClear(result.linesCleared, result.tSpin, result.tSpinMini);
    }
    if (piece) {
      this.statsTracker.recordFinesseErrors(this.finesseTracker.endPiece(piece.x, piece.rotation));
    }
  }

  getStats(): GameStats {
    return this.statsTracker.getStats();
  }

  reset(): void {
    this.statsTracker.reset();
    this.finesseTracker.reset();
  }
}
