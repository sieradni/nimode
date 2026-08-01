import { RotationState } from './types';

export type FinesseInputKind = 'move' | 'rotate';

export class FinesseTracker {
  private spawnX = 0;
  private spawnRotation: RotationState = 0;
  private movesMade = 0;
  private rotationsMade = 0;
  private active = false;

  beginPiece(spawnX: number, spawnRotation: RotationState): void {
    this.spawnX = spawnX;
    this.spawnRotation = spawnRotation;
    this.movesMade = 0;
    this.rotationsMade = 0;
    this.active = true;
  }

  recordInput(kind: FinesseInputKind): void {
    if (!this.active) return;
    if (kind === 'move') this.movesMade++;
    else this.rotationsMade++;
  }

  endPiece(finalX: number, finalRotation: RotationState): number {
    if (!this.active) return 0;
    const excessMoves = Math.max(0, this.movesMade - Math.abs(finalX - this.spawnX));
    const minRotations = this.spawnRotation === finalRotation ? 0 : 1;
    const excessRotations = Math.max(0, this.rotationsMade - minRotations);
    this.active = false;
    return excessMoves + excessRotations;
  }

  reset(): void {
    this.spawnX = 0;
    this.spawnRotation = 0;
    this.movesMade = 0;
    this.rotationsMade = 0;
    this.active = false;
  }
}
