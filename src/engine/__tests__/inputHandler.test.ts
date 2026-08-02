import { describe, it, expect, vi } from 'vitest';
import { InputHandler } from '../inputHandler';
import { DEFAULT_CONFIG, GameConfig, MAX_SOFT_DROP_FACTOR } from '../types';

const CONFIG: GameConfig = { ...DEFAULT_CONFIG, das: 133, arr: 33, sdf: 50 };

describe('InputHandler movement (DAS/ARR/SDF)', () => {
  it('moves one cell immediately on left key press', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.updateMovement(CONFIG, 1, onMove);

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(-1, 0);
  });

  it('moves one cell immediately on right key press', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_RIGHT', pressed: true });
    handler.updateMovement(CONFIG, 1, onMove);

    expect(onMove).toHaveBeenCalledWith(1, 0);
  });

  it('soft drop moves one cell immediately on press', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'SOFT_DROP', pressed: true });
    handler.updateMovement(CONFIG, 1, onMove);

    expect(onMove).toHaveBeenCalledWith(0, 1);
  });

  it('does not repeat the immediate move before DAS elapses', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.updateMovement(CONFIG, 1, onMove);
    handler.updateMovement(CONFIG, 100, onMove);

    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('does not re-trigger the immediate move on repeated keydown', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.updateMovement(CONFIG, 1, onMove);

    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('fires the immediate move once per press transition', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.handleInput({ type: 'MOVE_LEFT', pressed: false });
    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.updateMovement(CONFIG, 1, onMove);

    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('keeps auto-repeating via DAS/ARR while the key is held', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.updateMovement(CONFIG, 200, onMove);

    const leftMoves = onMove.mock.calls.filter(([dx]) => dx === -1);
    expect(leftMoves.length).toBeGreaterThan(1);
  });

  it('with ARR=0, after DAS the piece repeats to the wall until blocked', () => {
    const handler = new InputHandler();
    const onMove = vi
      .fn()
      .mockReturnValueOnce(true) // initial move (return ignored)
      .mockReturnValueOnce(true) // repeat toward wall
      .mockReturnValueOnce(false); // blocked -> stop

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.updateMovement({ ...CONFIG, das: 50, arr: 0 }, 1, onMove);
    handler.updateMovement({ ...CONFIG, das: 50, arr: 0 }, 50, onMove);

    expect(onMove).toHaveBeenCalledTimes(3);
    const leftMoves = onMove.mock.calls.filter(([dx]) => dx === -1);
    expect(leftMoves).toHaveLength(3);
  });

  it('with ARR=0 and wall-blocked, movement does not repeat past the wall', () => {
    const handler = new InputHandler();
    const onMove = vi.fn().mockReturnValue(false);

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.updateMovement({ ...CONFIG, das: 50, arr: 0 }, 1, onMove);
    handler.updateMovement({ ...CONFIG, das: 50, arr: 0 }, 50, onMove);
    handler.updateMovement({ ...CONFIG, das: 50, arr: 0 }, 16.67, onMove);

    expect(onMove).toHaveBeenCalledTimes(3);
  });

  it('soft drop repeats at the sdf rate scaled by sdfFactor', () => {
    const handler = new InputHandler();
    const onMove = vi.fn().mockReturnValue(true);

    handler.handleInput({ type: 'SOFT_DROP', pressed: true });
    // sdf=100, factor=10 → one cell per 10ms
    const cfg = { ...CONFIG, sdf: 100, sdfFactor: 10 };
    handler.updateMovement(cfg, 1, onMove);
    expect(onMove).toHaveBeenCalledTimes(1); // immediate first cell

    handler.updateMovement(cfg, 10, onMove);
    expect(onMove).toHaveBeenCalledTimes(2);

    handler.updateMovement(cfg, 40, onMove);
    expect(onMove).toHaveBeenCalledTimes(6); // 4 more cells in 40ms

    const downMoves = onMove.mock.calls.filter(([, dy]) => dy === 1);
    expect(downMoves).toHaveLength(6);
  });

  it('soft drop speed is consistent regardless of hold duration (no acceleration)', () => {
    const handler = new InputHandler();
    const onMove = vi.fn().mockReturnValue(true);

    handler.handleInput({ type: 'SOFT_DROP', pressed: true });
    // 10ms per cell; every 20ms tick must produce exactly 2 cells, every time.
    const cfg = { ...CONFIG, sdf: 100, sdfFactor: 10 };
    handler.updateMovement(cfg, 1, onMove);
    expect(onMove).toHaveBeenCalledTimes(1);

    const cellsPer20msTick = (): number => {
      const before = onMove.mock.calls.length;
      handler.updateMovement(cfg, 20, onMove);
      return onMove.mock.calls.length - before;
    };
    expect(cellsPer20msTick()).toBe(2);
    expect(cellsPer20msTick()).toBe(2);
    expect(cellsPer20msTick()).toBe(2);
  });

  it('soft drop repeats multiple cells per tick for high factors (not tick-rate limited)', () => {
    const handler = new InputHandler();
    const onMove = vi.fn().mockReturnValue(true);

    handler.handleInput({ type: 'SOFT_DROP', pressed: true });
    // sdf=50, factor=20 → 2.5ms/cell: a single 50ms tick drops 20 cells.
    handler.updateMovement({ ...CONFIG, sdf: 50, sdfFactor: 20 }, 50, onMove);

    const downMoves = onMove.mock.calls.filter(([, dy]) => dy === 1);
    expect(downMoves.length).toBeGreaterThan(10);
  });

  it('max sdfFactor drops the piece to its landing position in one step (infinite soft drop)', () => {
    const handler = new InputHandler();
    const onMove = vi
      .fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false); // blocked after 5 rows

    handler.handleInput({ type: 'SOFT_DROP', pressed: true });
    handler.updateMovement({ ...CONFIG, sdf: 50, sdfFactor: MAX_SOFT_DROP_FACTOR }, 16.67, onMove);

    expect(onMove).toHaveBeenCalledTimes(6);
    const downMoves = onMove.mock.calls.filter(([, dy]) => dy === 1);
    expect(downMoves).toHaveLength(6);
  });

  it('resets the immediate move on release', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.updateMovement(CONFIG, 1, onMove);
    handler.handleInput({ type: 'MOVE_LEFT', pressed: false });
    handler.updateMovement(CONFIG, 1, onMove);

    expect(onMove).toHaveBeenCalledTimes(1);
  });

  it('reset() clears pending immediate moves', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.reset();
    handler.updateMovement(CONFIG, 1, onMove);

    expect(onMove).not.toHaveBeenCalled();
  });
});

describe('InputHandler DAS cancel', () => {
  const DAS_CANCEL_CONFIG: GameConfig = { ...CONFIG, das: 100, arr: 0 };

  it('pressing the opposite direction cancels the held direction DAS charge', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_RIGHT', pressed: true });
    handler.updateMovement(DAS_CANCEL_CONFIG, 1, onMove); // immediate right move
    handler.updateMovement(DAS_CANCEL_CONFIG, 50, onMove); // right DAS half charged
    handler.handleInput({ type: 'MOVE_LEFT', pressed: true }); // cancel right DAS
    handler.updateMovement(DAS_CANCEL_CONFIG, 1, onMove); // immediate left move
    handler.updateMovement(DAS_CANCEL_CONFIG, 49, onMove); // 50ms elapsed, right re-charging

    // Without cancel, the charged right DAS (51+50ms) would fire ARR and
    // move right again; with cancel it must not.
    expect(onMove).toHaveBeenCalledTimes(2);
    expect(onMove.mock.calls[0]).toEqual([1, 0]);
    expect(onMove.mock.calls[1]).toEqual([-1, 0]);
  });

  it('cancels an already-firing ARR repeat, not only the charge phase', () => {
    const handler = new InputHandler();
    const onMove = vi.fn((_dx: number, _dy: number) => true);

    handler.handleInput({ type: 'MOVE_RIGHT', pressed: true });
    handler.updateMovement(DAS_CANCEL_CONFIG, 150, onMove); // DAS charged, ARR=0 repeats
    const rightMoves = onMove.mock.calls.length;
    expect(rightMoves).toBeGreaterThan(1);

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true }); // cancel firing ARR
    handler.updateMovement(DAS_CANCEL_CONFIG, 1, onMove); // immediate left move only
    handler.updateMovement(DAS_CANCEL_CONFIG, 49, onMove); // right must stay canceled

    const leftMoves = onMove.mock.calls.filter(([dx]) => dx === -1);
    expect(leftMoves).toHaveLength(1);
    const rightMovesAfter = onMove.mock.calls.filter(([dx]) => dx === 1);
    expect(rightMovesAfter).toHaveLength(rightMoves);
  });

  it('the tapped direction moves immediately while the held direction is down', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_RIGHT', pressed: true });
    handler.updateMovement(DAS_CANCEL_CONFIG, 1, onMove);
    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.updateMovement(DAS_CANCEL_CONFIG, 1, onMove);

    expect(onMove.mock.calls[1]).toEqual([-1, 0]);
  });

  it('after cancel, releasing the tapped key lets the held direction re-charge', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'MOVE_RIGHT', pressed: true });
    handler.updateMovement(DAS_CANCEL_CONFIG, 1, onMove); // dasRight=1
    handler.updateMovement(DAS_CANCEL_CONFIG, 50, onMove); // dasRight=51
    handler.handleInput({ type: 'MOVE_LEFT', pressed: true }); // cancel -> dasRight=0
    handler.updateMovement(DAS_CANCEL_CONFIG, 1, onMove); // left move, dasRight=1
    handler.handleInput({ type: 'MOVE_LEFT', pressed: false });

    expect(onMove).toHaveBeenCalledTimes(2);
    handler.updateMovement(DAS_CANCEL_CONFIG, 100, onMove); // full DAS re-charge
    expect(onMove.mock.calls[2]).toEqual([1, 0]);
  });
});

describe('InputHandler one-time inputs (CLEAR_HOLD)', () => {
  it('queues clearHold on press and consumes it exactly once', () => {
    const handler = new InputHandler();
    handler.handleInput({ type: 'CLEAR_HOLD' });

    const first = handler.consumeOneTimeInputs();
    expect(first.clearHold).toBe(true);

    const second = handler.consumeOneTimeInputs();
    expect(second.clearHold).toBe(false);
  });

  it('reset() clears a pending clearHold', () => {
    const handler = new InputHandler();
    handler.handleInput({ type: 'CLEAR_HOLD' });
    handler.reset();

    expect(handler.consumeOneTimeInputs().clearHold).toBe(false);
  });
});

describe('InputHandler key press counting (KPP)', () => {
  it('counts each press transition and one-time action exactly once', () => {
    const handler = new InputHandler();

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.handleInput({ type: 'MOVE_LEFT', pressed: true }); // OS repeat
    handler.handleInput({ type: 'SOFT_DROP', pressed: true });
    handler.handleInput({ type: 'SOFT_DROP', pressed: false }); // release
    handler.handleInput({ type: 'ROTATE_CW' });
    handler.handleInput({ type: 'HARD_DROP' });

    expect(handler.consumeKeyPressCount()).toBe(4);
    expect(handler.consumeKeyPressCount()).toBe(0);
  });

  it('counts a held DAS key as one press, not one per auto-repeated cell', () => {
    const handler = new InputHandler();
    const onMove = vi.fn().mockReturnValue(true);

    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    for (let i = 0; i < 10; i++) {
      handler.updateMovement({ ...CONFIG, das: 50, arr: 10 }, 50, onMove);
    }
    handler.handleInput({ type: 'MOVE_LEFT', pressed: false });

    expect(onMove.mock.calls.length).toBeGreaterThan(5); // DAS/ARR moved it
    expect(handler.consumeKeyPressCount()).toBe(1);
  });

  it('counts one soft drop press even though it drops many cells', () => {
    const handler = new InputHandler();
    let fell = 0;
    const onMove = vi.fn((_dx: number, dy: number) => {
      if (dy === 1) fell++;
      return fell < 20; // blocked once the piece has fallen 20 rows
    });

    handler.handleInput({ type: 'SOFT_DROP', pressed: true });
    handler.updateMovement({ ...CONFIG, sdf: 50, sdfFactor: MAX_SOFT_DROP_FACTOR }, 16.67, onMove);

    expect(fell).toBe(20); // infinite soft drop fell the whole distance
    expect(handler.consumeKeyPressCount()).toBe(1);
  });

  it('reset() clears pending key presses', () => {
    const handler = new InputHandler();
    handler.handleInput({ type: 'MOVE_LEFT', pressed: true });
    handler.reset();
    expect(handler.consumeKeyPressCount()).toBe(0);
  });
});
