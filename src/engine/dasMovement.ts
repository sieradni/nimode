import { GameConfig, InputState } from './types';

export interface DASArrTimers {
  dasLeft: number;
  dasRight: number;
  dasDown: number;
  arrLeft: number;
  arrRight: number;
}

export interface DASMovementState {
  timers: DASArrTimers;
  initialLeft: boolean;
  initialRight: boolean;
  initialDown: boolean;
}

export function createInitialMovementState(): DASMovementState {
  return {
    timers: { dasLeft: 0, dasRight: 0, dasDown: 0, arrLeft: 0, arrRight: 0 },
    initialLeft: false,
    initialRight: false,
    initialDown: false,
  };
}

export function updateDASMovement(
  state: DASMovementState,
  inputState: InputState,
  config: GameConfig,
  dt: number,
  onMove: (dx: number, dy: number) => void,
): void {
  if (inputState.left) {
    if (state.initialLeft) {
      onMove(-1, 0);
      state.initialLeft = false;
    }
    state.timers.dasLeft += dt;
    if (state.timers.dasLeft >= config.das) {
      state.timers.arrLeft += dt;
      if (config.arr === 0) {
        onMove(-10, 0);
      } else if (state.timers.arrLeft >= config.arr) {
        onMove(-1, 0);
        state.timers.arrLeft = 0;
      }
    }
  }

  if (inputState.right) {
    if (state.initialRight) {
      onMove(1, 0);
      state.initialRight = false;
    }
    state.timers.dasRight += dt;
    if (state.timers.dasRight >= config.das) {
      state.timers.arrRight += dt;
      if (config.arr === 0) {
        onMove(10, 0);
      } else if (state.timers.arrRight >= config.arr) {
        onMove(1, 0);
        state.timers.arrRight = 0;
      }
    }
  }

  if (inputState.down) {
    if (state.initialDown) {
      onMove(0, 1);
      state.initialDown = false;
    }
    state.timers.dasDown += dt;
    if (state.timers.dasDown >= config.sdf) {
      onMove(0, 1);
    }
  }
}
