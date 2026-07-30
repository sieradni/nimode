import { GameConfig, GameState, DEFAULT_CONFIG, PieceType } from './types';
import { IEngineCore, EngineState, EngineDependencies, InputEvent } from './interfaces/IEngineCore';
import { IRotationSystem } from './interfaces/IRotationSystem';
import { IBagRandomizer } from './interfaces/IBagRandomizer';
import { InputHandler } from './inputHandler';
import { createInitialGameState } from './engineState';
import { movePiece, spawnNextPiece, holdPiece, hardDrop, lockPiece } from './engineActions';
import { StatsTracker } from './statsTracker';

export class EngineCore implements IEngineCore {
  private config: GameConfig = DEFAULT_CONFIG;
  private rotationSystem: IRotationSystem;
  private bagRandomizer: IBagRandomizer;
  private state: GameState;
  private inputHandler: InputHandler = new InputHandler();
  private gravityTimer: number = 0;
  private accumulator: number = 0;
  private statsTracker = new StatsTracker();

  constructor(deps: EngineDependencies) {
    this.rotationSystem = deps.rotationSystem;
    this.bagRandomizer = deps.bagRandomizer;
    this.state = createInitialGameState(this.bagRandomizer, this.config);
    spawnNextPiece(this.state, this.bagRandomizer, this.rotationSystem);
  }

  initialize(config: GameConfig): void {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.reset();
  }

  handleInput(input: InputEvent): void {
    this.inputHandler.handleInput(input);
  }

  tick(deltaTime: number): void {
    if (this.state.paused || this.state.gameOver) return;

    this.accumulator += deltaTime;
    const tickRate = 1000 / 60;

    while (this.accumulator >= tickRate) {
      this.fixedTick(tickRate);
      this.accumulator -= tickRate;
    }
  }

  private fixedTick(dt: number): void {
    this.statsTracker.tick(dt);
    this.inputHandler.updateMovement(this.config, dt, (dx, dy) =>
      movePiece(this.state, dx, dy)
    );
    this.processDiscreteActions();
    this.applyGravity(dt);
  }

  private processDiscreteActions(): void {
    const actions = this.inputHandler.consumeOneTimeInputs();

    if (actions.reset) {
      this.reset();
      return;
    }
    if (actions.cw) { this.rotatePiece(1); this.statsTracker.recordKeyPress(); }
    if (actions.ccw) { this.rotatePiece(-1); this.statsTracker.recordKeyPress(); }
    if (actions.rotate180) { this.rotatePiece(2); this.statsTracker.recordKeyPress(); }
    if (actions.hold) {
      holdPiece(this.state, this.bagRandomizer, this.rotationSystem);
      this.statsTracker.recordKeyPress();
    }
    if (actions.hardDrop) {
      const lines = hardDrop(this.state, this.bagRandomizer, this.rotationSystem);
      this.recordLockStats(lines);
    }
  }

  private rotatePiece(direction: 1 | -1 | 2): void {
    if (!this.state.activePiece) return;

    const result = this.rotationSystem.rotate(
      this.state.board,
      this.state.activePiece,
      direction
    );

    if (result) {
      this.state.activePiece = result.piece;
    }
  }

  private applyGravity(dt: number): void {
    if (!this.state.activePiece) return;

    this.gravityTimer += dt;
    const gravityRate = 1000 / 60;

    if (this.gravityTimer >= gravityRate) {
      if (!movePiece(this.state, 0, -1)) {
        this.recordLockStats(
          lockPiece(this.state, this.bagRandomizer, this.rotationSystem)
        );
      }
      this.gravityTimer = 0;
    }
  }

  private recordLockStats(linesCleared: number): void {
    this.statsTracker.recordPiecePlaced();
    if (linesCleared > 0) this.statsTracker.recordLineClear(linesCleared, false, false);
  }

  getState(): EngineState {
    return {
      board: this.state.board.map(row => [...row]),
      activePiece: this.state.activePiece ? { ...this.state.activePiece } : null,
      queue: [...this.state.queue.queue],
      hold: this.state.queue.hold,
      canHold: this.state.queue.canHold,
      stats: this.statsTracker.getStats(),
      gameOver: this.state.gameOver,
      paused: this.state.paused,
    };
  }

  reset(): void {
    this.bagRandomizer.reset();
    this.state = createInitialGameState(this.bagRandomizer, this.config);
    this.inputHandler.reset();
    this.gravityTimer = 0;
    this.accumulator = 0;
    this.statsTracker.reset();
    spawnNextPiece(this.state, this.bagRandomizer, this.rotationSystem);
  }

  setQueue(pieces: PieceType[]): void {
    this.state.queue.queue = [...pieces];
  }
}
