import { GameConfig, GameState, DEFAULT_CONFIG, PieceType, ActivePiece } from './types';
import { IEngineCore, EngineState, EngineDependencies, InputEvent } from './interfaces/IEngineCore';
import { IRotationSystem } from './interfaces/IRotationSystem';
import { IBagRandomizer } from './interfaces/IBagRandomizer';
import { InputHandler } from './inputHandler';
import { createInitialGameState } from './engineState';
import { spawnNextPiece } from './engineActions';
import { LockDelayState, createLockDelayState } from './lockDelayEngine';
import { PlayerStats } from './playerStats';
import { LockResult } from './tSpinDetector';
import { isEditInput, handleEditInput } from './editInputHandler';
import { EditSession } from './editSession';
import { runFixedTick } from './stepEngine';
import { UndoRedoEngine, IUndoRedoEngine } from './undoRedoEngine';
import { restoreSnapshot } from './engineUndoRedo';
export class EngineCore implements IEngineCore {
  private config: GameConfig = DEFAULT_CONFIG;
  private rotationSystem: IRotationSystem;
  private bagRandomizer: IBagRandomizer;
  private state: GameState;
  private inputHandler = new InputHandler();
  private gravityTimer = 0;
  private accumulator = 0;
  private lockDelayState: LockDelayState = createLockDelayState();
  private playerStats = new PlayerStats();
  private rotationOccurred = false;
  private undoRedoEngine: IUndoRedoEngine = new UndoRedoEngine();
  private editSession = new EditSession();
  constructor(deps: EngineDependencies) {
    this.rotationSystem = deps.rotationSystem;
    this.bagRandomizer = deps.bagRandomizer;
    this.state = createInitialGameState(this.bagRandomizer, this.config);
    spawnNextPiece(this.state, this.bagRandomizer, this.rotationSystem, this.config);
    this.playerStats.onPieceSpawn(this.state.activePiece);
    this.saveSnapshot();
  }
  private saveSnapshot(): void {
    const stats = this.playerStats.getStatsSnapshot();
    this.undoRedoEngine.saveSnapshot(this.state, stats, this.gravityTimer, {
      timer: this.lockDelayState.timer,
      resets: this.lockDelayState.resets,
    });
  }
  initialize(config: GameConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.reset();
  }
  updateConfig(config: GameConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  isAutoColorEnabled(): boolean {
    return this.config.autoColor;
  }
  handleInput(input: InputEvent): void {
    if (isEditInput(input)) {
      handleEditInput(this.state, this.editSession, {
        isAutoColorEnabled: () => this.config.autoColor,
        saveSnapshot: () => this.saveSnapshot(),
      }, input);
      return;
    }
    this.inputHandler.handleInput(input);
    if (!this.state.activePiece) return;
    const isRotation =
      input.type === 'ROTATE_CW' || input.type === 'ROTATE_CCW' || input.type === 'ROTATE_180';
    if ((input.type === 'MOVE_LEFT' || input.type === 'MOVE_RIGHT') && input.pressed) {
      this.playerStats.recordInput('move');
    } else if (isRotation) {
      this.playerStats.recordInput('rotate');
    }
  }
  tick(deltaTime: number): void {
    if (this.state.paused) return;
    this.accumulator += deltaTime;
    const tickRate = 1000 / 60;
    while (this.accumulator >= tickRate) {
      this.fixedTick(tickRate);
      this.accumulator -= tickRate;
    }
  }
  private fixedTick(dt: number): void {
    this.playerStats.tick(dt);
    const result = runFixedTick(
      this.state,
      this.config,
      this.inputHandler,
      this.bagRandomizer,
      this.rotationSystem,
      this.lockDelayState,
      this.gravityTimer,
      dt,
      {
        rotate: (direction) => this.rotatePiece(direction),
        onReset: () => this.reset(),
        onLock: (lockResult, piece) => this.recordLockStats(lockResult, piece),
        onKeyPress: () => this.playerStats.recordKeyPress(),
        onHold: () => {
          this.playerStats.onPieceSpawn(this.state.activePiece);
          this.saveSnapshot();
        },
        onClearHold: () => {
          this.saveSnapshot();
        },
        onUndo: () => this.undo(),
        onRedo: () => this.redo(),
        rotationOccurred: () => this.rotationOccurred,
      },
    );
    this.lockDelayState = result.lockDelayState;
    this.gravityTimer = result.gravityTimer;
  }
  private rotatePiece(direction: 1 | -1 | 2): boolean {
    if (!this.state.activePiece) return false;
    const result = this.rotationSystem.rotate(this.state.board, this.state.activePiece, direction);
    if (result) {
      this.state.activePiece = result.piece;
      this.rotationOccurred = true;
      return true;
    }
    return false;
  }
  private recordLockStats(result: LockResult, piece: ActivePiece | null): void {
    this.rotationOccurred = false;
    this.playerStats.onPieceLock(result, piece);
    this.playerStats.onPieceSpawn(this.state.activePiece);
    this.saveSnapshot();
  }
  getState(): EngineState {
    return { board: this.state.board.map(r => [...r]), activePiece: this.state.activePiece ? {...this.state.activePiece} : null, queue: [...this.state.queue.queue], hold: this.state.queue.hold, canHold: this.state.queue.canHold, stats: this.playerStats.getStats(), gameOver: this.state.gameOver, paused: this.state.paused, annotations: this.state.annotations.map(r => [...r]), userPalette: [...this.state.userPalette] };
  }
  undo(): boolean {
    const snapshot = this.undoRedoEngine.undo();
    if (!snapshot) return false;
    restoreSnapshot(this.state, snapshot, this.playerStats);
    return true;
  }
  redo(): boolean {
    const snapshot = this.undoRedoEngine.redo();
    if (!snapshot) return false;
    restoreSnapshot(this.state, snapshot, this.playerStats);
    return true;
  }
  canUndo(): boolean { return this.undoRedoEngine.canUndo(); }
  canRedo(): boolean { return this.undoRedoEngine.canRedo(); }
  reset(): void { this.bagRandomizer.reset(); this.state = createInitialGameState(this.bagRandomizer, this.config); this.inputHandler.reset(); this.gravityTimer = this.accumulator = 0; this.lockDelayState = createLockDelayState(); this.playerStats.reset(); this.rotationOccurred = false; this.undoRedoEngine.clear(); this.editSession = new EditSession(); spawnNextPiece(this.state, this.bagRandomizer, this.rotationSystem, this.config); this.playerStats.onPieceSpawn(this.state.activePiece); this.saveSnapshot(); }

  setQueue(pieces: PieceType[]): void { this.state.queue.queue = [...pieces]; }
}
