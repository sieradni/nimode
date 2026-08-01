import { InputState, GameConfig, EMPTY_INPUT_STATE } from './types';
import { InputEvent } from './interfaces/IEngineCore';

export interface DASArrTimers {
  dasLeft: number;
  dasRight: number;
  dasDown: number;
  arrLeft: number;
  arrRight: number;
}

export function createInitialTimers(): DASArrTimers {
  return { dasLeft: 0, dasRight: 0, dasDown: 0, arrLeft: 0, arrRight: 0 };
}

export class InputHandler {
  private inputState: InputState = { ...EMPTY_INPUT_STATE };
  private timers: DASArrTimers = createInitialTimers();

  handleInput(input: InputEvent): void {
    switch (input.type) {
      case 'MOVE_LEFT':
        this.inputState.left = input.pressed;
        if (!input.pressed) {
          this.timers.dasLeft = 0;
          this.timers.arrLeft = 0;
        }
        break;
      case 'MOVE_RIGHT':
        this.inputState.right = input.pressed;
        if (!input.pressed) {
          this.timers.dasRight = 0;
          this.timers.arrRight = 0;
        }
        break;
      case 'SOFT_DROP':
        this.inputState.down = input.pressed;
        if (!input.pressed) {
          this.timers.dasDown = 0;
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
      case 'CLEAR_HOLD':
        this.inputState.clearHold = true;
        break;
      case 'RESET':
        this.inputState.reset = true;
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
    clearHold: boolean;
    reset: boolean;
  } {
    const actions = {
      hardDrop: this.inputState.hardDrop,
      cw: this.inputState.cw,
      ccw: this.inputState.ccw,
      rotate180: this.inputState.rotate180,
      hold: this.inputState.hold,
      clearHold: this.inputState.clearHold,
      reset: this.inputState.reset,
    };

    this.inputState.hardDrop = false;
    this.inputState.cw = false;
    this.inputState.ccw = false;
    this.inputState.rotate180 = false;
    this.inputState.hold = false;
    this.inputState.clearHold = false;
    this.inputState.reset = false;

    return actions;
  }

  updateMovement(
    config: GameConfig,
    dt: number,
    onMove: (dx: number, dy: number) => void
  ): void {
    if (this.inputState.left) {
      this.timers.dasLeft += dt;
      if (this.timers.dasLeft >= config.das) {
        this.timers.arrLeft += dt;
        if (config.arr === 0) {
          onMove(-10, 0); // Instant ARR to left wall
        } else if (this.timers.arrLeft >= config.arr) {
          onMove(-1, 0);
          this.timers.arrLeft = 0;
        }
      }
    }

    if (this.inputState.right) {
      this.timers.dasRight += dt;
      if (this.timers.dasRight >= config.das) {
        this.timers.arrRight += dt;
        if (config.arr === 0) {
          onMove(10, 0); // Instant ARR to right wall
        } else if (this.timers.arrRight >= config.arr) {
          onMove(1, 0);
          this.timers.arrRight = 0;
        }
      }
    }

    if (this.inputState.down) {
      this.timers.dasDown += dt;
      if (this.timers.dasDown >= config.sdf) {
        onMove(0, 1);
      }
    }
  }

  reset(): void {
    this.inputState = { ...EMPTY_INPUT_STATE };
    this.timers = createInitialTimers();
  }
}
