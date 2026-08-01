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
