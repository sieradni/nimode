import { InputState, GameConfig, EMPTY_INPUT_STATE } from './types';
import { InputEvent } from './interfaces/IEngineCore';
import { DASMovementState, createInitialMovementState, updateDASMovement, cancelOppositeDirection } from './dasMovement';

export class InputHandler {
  private inputState: InputState = { ...EMPTY_INPUT_STATE };
  private movement: DASMovementState = createInitialMovementState();
  private pendingKeyPresses = 0;

  handleInput(input: InputEvent): void {
    switch (input.type) {
      case 'MOVE_LEFT':
        if (input.pressed && !this.inputState.left) {
          this.movement.initialLeft = true;
          this.pendingKeyPresses++;
          if (this.inputState.right) {
            cancelOppositeDirection(this.movement, 'left');
          }
        }
        this.inputState.left = input.pressed;
        if (!input.pressed) {
          this.movement.timers.dasLeft = 0;
          this.movement.timers.arrLeft = 0;
          this.movement.initialLeft = false;
        }
        break;
      case 'MOVE_RIGHT':
        if (input.pressed && !this.inputState.right) {
          this.movement.initialRight = true;
          this.pendingKeyPresses++;
          if (this.inputState.left) {
            cancelOppositeDirection(this.movement, 'right');
          }
        }
        this.inputState.right = input.pressed;
        if (!input.pressed) {
          this.movement.timers.dasRight = 0;
          this.movement.timers.arrRight = 0;
          this.movement.initialRight = false;
        }
        break;
      case 'SOFT_DROP':
        if (input.pressed && !this.inputState.down) {
          this.movement.initialDown = true;
          this.pendingKeyPresses++;
        }
        this.inputState.down = input.pressed;
        if (!input.pressed) {
          this.movement.timers.dasDown = 0;
          this.movement.initialDown = false;
        }
        break;
      case 'HARD_DROP':
        this.inputState.hardDrop = true; this.pendingKeyPresses++;
        break;
      case 'ROTATE_CW':
        this.inputState.cw = true; this.pendingKeyPresses++;
        break;
      case 'ROTATE_CCW':
        this.inputState.ccw = true; this.pendingKeyPresses++;
        break;
      case 'ROTATE_180':
        this.inputState.rotate180 = true; this.pendingKeyPresses++;
        break;
      case 'HOLD':
        this.inputState.hold = true; this.pendingKeyPresses++;
        break;
      case 'CLEAR_HOLD':
        this.inputState.clearHold = true; this.pendingKeyPresses++;
        break;
      case 'RESET':
        this.inputState.reset = true; this.pendingKeyPresses++;
        break;
      case 'UNDO':
        this.inputState.undo = true; this.pendingKeyPresses++;
        break;
      case 'REDO':
        this.inputState.redo = true; this.pendingKeyPresses++;
        break;
    }
  }

  /**
   * Returns how many distinct physical inputs were received since the last
   * call. OS key-repeat, held-key auto-repeat (DAS/ARR) and key releases do
   * not count; each press transition and one-time action counts exactly once,
   * regardless of how many cells that input moves the piece.
   */
  consumeKeyPressCount(): number {
    const count = this.pendingKeyPresses;
    this.pendingKeyPresses = 0;
    return count;
  }

  getInputState(): InputState {
    return { ...this.inputState };
  }

  consumeOneTimeInputs(): {
    hardDrop: boolean;
    cw: boolean;
    ccw: boolean;
    rotate180: boolean;
    hold: boolean;
    clearHold: boolean;
    reset: boolean;
    undo: boolean;
    redo: boolean;
  } {
    const actions = {
      hardDrop: this.inputState.hardDrop,
      cw: this.inputState.cw,
      ccw: this.inputState.ccw,
      rotate180: this.inputState.rotate180,
      hold: this.inputState.hold,
      clearHold: this.inputState.clearHold,
      reset: this.inputState.reset,
      undo: this.inputState.undo,
      redo: this.inputState.redo,
    };

    this.inputState.hardDrop = false;
    this.inputState.cw = false;
    this.inputState.ccw = false;
    this.inputState.rotate180 = false;
    this.inputState.hold = false;
    this.inputState.clearHold = false;
    this.inputState.reset = false;
    this.inputState.undo = false;
    this.inputState.redo = false;

    return actions;
  }

  updateMovement(
    config: GameConfig,
    dt: number,
    onMove: (dx: number, dy: number) => boolean
  ): void {
    updateDASMovement(this.movement, this.inputState, config, dt, onMove);
  }

  reset(): void {
    this.inputState = { ...EMPTY_INPUT_STATE };
    this.movement = createInitialMovementState();
    this.pendingKeyPresses = 0;
  }
}
