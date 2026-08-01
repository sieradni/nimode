import { InputState, GameConfig, EMPTY_INPUT_STATE } from './types';
import { InputEvent } from './interfaces/IEngineCore';
import { DASMovementState, createInitialMovementState, updateDASMovement } from './dasMovement';

export class InputHandler {
  private inputState: InputState = { ...EMPTY_INPUT_STATE };
  private movement: DASMovementState = createInitialMovementState();

  handleInput(input: InputEvent): void {
    switch (input.type) {
      case 'MOVE_LEFT':
        if (input.pressed && !this.inputState.left) this.movement.initialLeft = true;
        this.inputState.left = input.pressed;
        if (!input.pressed) {
          this.movement.timers.dasLeft = 0;
          this.movement.timers.arrLeft = 0;
          this.movement.initialLeft = false;
        }
        break;
      case 'MOVE_RIGHT':
        if (input.pressed && !this.inputState.right) this.movement.initialRight = true;
        this.inputState.right = input.pressed;
        if (!input.pressed) {
          this.movement.timers.dasRight = 0;
          this.movement.timers.arrRight = 0;
          this.movement.initialRight = false;
        }
        break;
      case 'SOFT_DROP':
        if (input.pressed && !this.inputState.down) this.movement.initialDown = true;
        this.inputState.down = input.pressed;
        if (!input.pressed) {
          this.movement.timers.dasDown = 0;
          this.movement.initialDown = false;
          this.movement.softDropSteps = 0;
        }
        break;
      case 'HARD_DROP':
        this.inputState.hardDrop = true;
        break;
      case 'ROTATE_CW':
        this.inputState.cw = true;
        break;
      case 'ROTATE_CCW':
        this.inputState.ccw = true;
        break;
      case 'ROTATE_180':
        this.inputState.rotate180 = true;
        break;
      case 'HOLD':
        this.inputState.hold = true;
        break;
      case 'RESET':
        this.inputState.reset = true;
        break;
      case 'UNDO':
        this.inputState.undo = true;
        break;
      case 'REDO':
        this.inputState.redo = true;
        break;
    }
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
      reset: this.inputState.reset,
      undo: this.inputState.undo,
      redo: this.inputState.redo,
    };

    this.inputState.hardDrop = false;
    this.inputState.cw = false;
    this.inputState.ccw = false;
    this.inputState.rotate180 = false;
    this.inputState.hold = false;
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
  }
}
