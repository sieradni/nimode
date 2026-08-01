import { describe, it, expect, vi } from 'vitest';
import { InputHandler } from '../inputHandler';
import { DEFAULT_CONFIG, GameConfig } from '../types';

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

  it('soft drop repeats at the sdf rate and accelerates by sdfFactor', () => {
    const handler = new InputHandler();
    const onMove = vi.fn();

    handler.handleInput({ type: 'SOFT_DROP', pressed: true });
    handler.updateMovement({ ...CONFIG, sdf: 50, sdfFactor: 20 }, 1, onMove);
    expect(onMove).toHaveBeenCalledTimes(1);

    handler.updateMovement({ ...CONFIG, sdf: 50, sdfFactor: 20 }, 50, onMove);
    expect(onMove).toHaveBeenCalledTimes(2);

    handler.updateMovement({ ...CONFIG, sdf: 50, sdfFactor: 20 }, 20, onMove);
    expect(onMove).toHaveBeenCalledTimes(2);

    handler.updateMovement({ ...CONFIG, sdf: 50, sdfFactor: 20 }, 10, onMove);
    expect(onMove).toHaveBeenCalledTimes(3);

    const downMoves = onMove.mock.calls.filter(([, dy]) => dy === 1);
    expect(downMoves).toHaveLength(3);
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
