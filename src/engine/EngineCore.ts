import { GameConfig, GameState, DEFAULT_CONFIG, PieceType } from './types';
import { IEngineCore, EngineState, EngineDependencies, InputEvent } from './interfaces/IEngineCore';
import { IRotationSystem } from './interfaces/IRotationSystem';
import { IBagRandomizer } from './interfaces/IBagRandomizer';
import { InputHandler } from './inputHandler';
import { createInitialGameState } from './engineState';
import { movePiece, spawnNextPiece, holdPiece, hardDrop } from './engineActions';
import { applyGravityToState } from './gravityEngine';
import { StatsTracker } from './statsTracker';
import { applyAnnotationPen, applyAnnotationErase, clearAllAnnotations, applyAnnotationRectFill } from './annotationEngine';
import { autoColorAnnotations } from './autoColorEngine';

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
    if (input.type === 'ANNOTATE_PEN') {
      this.applyAnnotationPen(input.x, input.y, input.pieceType);
      return;
    }
    if (input.type === 'ANNOTATE_ERASE') {
      this.applyAnnotationErase(input.x, input.y);
      return;
    }
    if (input.type === 'ANNOTATE_RECT_FILL') {
      this.applyAnnotationRectFill(input.x1, input.y1, input.x2, input.y2, input.pieceType);
      return;
    }
    if (input.type === 'ANNOTATE_CLEAR_ALL') {
      this.clearAllAnnotations();
      return;
    }
    if (input.type === 'ANNOTATE_AUTO_COLOR') {
      this.autoColorAnnotations();
      return;
    }
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
    this.gravityTimer = applyGravityToState(
      this.state,
      this.config,
      this.gravityTimer,
      dt,
      this.bagRandomizer,
      this.rotationSystem,
      (lines) => this.recordLockStats(lines),
    );
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
      annotations: this.state.annotations.map(row => [...row]),
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

  applyAnnotationPen(x: number, y: number, pieceType: number): void {
    this.state.annotations = applyAnnotationPen(this.state.annotations, x, y, pieceType);
  }

  applyAnnotationErase(x: number, y: number): void {
    this.state.annotations = applyAnnotationErase(this.state.annotations, x, y);
  }

  applyAnnotationRectFill(x1: number, y1: number, x2: number, y2: number, pieceType: number): void {
    this.state.annotations = applyAnnotationRectFill(this.state.annotations, x1, y1, x2, y2, pieceType);
  }

  clearAllAnnotations(): void {
    this.state.annotations = clearAllAnnotations(this.state.annotations);
  }

  autoColorAnnotations(): void {
    this.state.annotations = autoColorAnnotations(this.state.annotations);
  }
}
