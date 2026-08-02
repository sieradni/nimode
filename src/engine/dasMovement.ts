import { GameConfig, InputState, MAX_SOFT_DROP_FACTOR } from './types';
import { BOARD_WIDTH } from './types/board';

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

function softDropDelay(sdf: number, sdfFactor: number): number {
  return sdf / Math.max(sdfFactor, 1);
}

/**
 * DAS cancel: pressing the opposite direction while a direction is held
 * resets that side's DAS charge (and any firing ARR), so it must re-charge
 * from zero. The newly pressed direction still performs its immediate move.
 */
export function cancelOppositeDirection(
  state: DASMovementState,
  pressed: 'left' | 'right',
): void {
  if (pressed === 'left') {
    state.timers.dasRight = 0;
    state.timers.arrRight = 0;
    state.initialRight = false;
  } else {
    state.timers.dasLeft = 0;
    state.timers.arrLeft = 0;
    state.initialLeft = false;
  }
}

export function updateDASMovement(
  state: DASMovementState,
  inputState: InputState,
  config: GameConfig,
  dt: number,
  onMove: (dx: number, dy: number) => boolean,
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
        for (let i = 0; i < BOARD_WIDTH; i++) {
          if (!onMove(-1, 0)) break;
        }
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
        for (let i = 0; i < BOARD_WIDTH; i++) {
          if (!onMove(1, 0)) break;
        }
      } else if (state.timers.arrRight >= config.arr) {
        onMove(1, 0);
        state.timers.arrRight = 0;
      }
    }
  }

  if (inputState.down) {
    if (config.sdfFactor >= MAX_SOFT_DROP_FACTOR) {
      // Infinite soft drop (TETR.IO ∞ SDF / "sonic drop"): the piece drops
      // straight to its landing position in one tick, not limited by the
      // tick rate. It then locks through the normal lock delay.
      while (onMove(0, 1)) {
        // falling until the piece lands
      }
      state.timers.dasDown = 0;
      return;
    }
    if (state.initialDown) {
      onMove(0, 1);
      state.initialDown = false;
    }
    state.timers.dasDown += dt;
    const delay = softDropDelay(config.sdf, config.sdfFactor);
    while (state.timers.dasDown >= delay) {
      if (!onMove(0, 1)) break;
      state.timers.dasDown -= delay;
    }
  }
}
