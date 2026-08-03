import { describe, it, expect } from 'vitest';
import { EngineCore } from '../EngineCore';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import type { PieceType } from '../types';
import { DEFAULT_CONFIG } from '../types';

describe('EngineCore', () => {
  function createEngine() {
    const randomizer = new SevenBagRandomizer(100);
    const rotation = new SrsPlusRotationSystem();
    return new EngineCore({
      bagRandomizer: randomizer,
      rotationSystem: rotation,
    });
  }

  it('should initialize with active piece and queue', () => {
    const engine = createEngine();
    const state = engine.getState();

    expect(state.activePiece).not.toBeNull();
    expect(state.queue.length).toBeGreaterThan(0);
    expect(state.gameOver).toBe(false);
  });

  it('should process move left and right inputs', () => {
    const engine = createEngine();
    const initialX = engine.getState().activePiece?.x ?? 0;

    engine.handleInput({ type: 'MOVE_LEFT', pressed: true });
    engine.tick(200); // Trigger DAS
    const movedX = engine.getState().activePiece?.x ?? 0;

    expect(movedX).toBeLessThan(initialX);
  });

  it('should perform hold piece action', () => {
    const engine = createEngine();
    const initialPieceType = engine.getState().activePiece?.type;

    engine.handleInput({ type: 'HOLD' });
    engine.tick(16.67);

    const state = engine.getState();
    expect(state.hold).toBe(initialPieceType);
    expect(state.canHold).toBe(true);
  });

  it('setQueue should replace the upcoming queue', () => {
    const engine = createEngine();
    const customQueue: PieceType[] = [1, 2, 3, 4, 5];

    engine.setQueue(customQueue);
    const state = engine.getState();

    expect(state.queue).toEqual([1, 2, 3, 4, 5]);
  });

  it('should use custom queue for spawning after hard drop', () => {
    const engine = createEngine();
    const customQueue: PieceType[] = [1, 2, 3];

    engine.setQueue(customQueue);

    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(16.67);

    const state = engine.getState();
    expect(state.activePiece?.type).toBe(1);
  });

  it('setQueue([]) refills from the randomizer so the game does not hang', () => {
    const engine = createEngine();
    engine.setQueue([]);

    engine.handleInput({ type: 'HARD_DROP' });
    engine.tick(16.67);

    const state = engine.getState();
    expect(state.activePiece).not.toBeNull();
    expect(state.gameOver).toBe(false);
  });

  it('setQueue is undoable: undo restores the previous queue and redo re-applies the edit', () => {
    const engine = createEngine();
    const previousQueue = engine.getState().queue;
    const customQueue: PieceType[] = [1, 2, 3, 4, 5];

    engine.setQueue(customQueue);
    expect(engine.getState().queue).toEqual([1, 2, 3, 4, 5]);

    engine.undo();
    expect(engine.getState().queue).toEqual(previousQueue);

    engine.redo();
    expect(engine.getState().queue).toEqual([1, 2, 3, 4, 5]);
  });

  describe('setPaused', () => {
    function engineWithGravity(): EngineCore {
      const engine = createEngine();
      engine.updateConfig({ ...DEFAULT_CONFIG, gravity: 1 });
      return engine;
    }

    it('freezes gravity and spawning while paused', () => {
      const engine = engineWithGravity();
      engine.setPaused(true);
      const before = engine.getState().activePiece;

      engine.tick(1000);

      expect(engine.getState().paused).toBe(true);
      expect(engine.getState().activePiece).toEqual(before);
    });

    it('resumes ticking when unpaused', () => {
      const engine = engineWithGravity();
      engine.setPaused(true);
      engine.setPaused(false);
      engine.tick(1000);

      expect(engine.getState().paused).toBe(false);
      expect(engine.getState().activePiece).not.toBeNull();
    });

    it('pausing is not itself an undoable action', () => {
      const engine = createEngine();
      engine.setPaused(true);
      expect(engine.canUndo()).toBe(false);
    });
  });

  describe('CLEAR_HOLD', () => {
    it('empties a held piece', () => {
      const engine = createEngine();
      engine.handleInput({ type: 'HOLD' });
      engine.tick(16.67);
      expect(engine.getState().hold).not.toBeNull();

      engine.handleInput({ type: 'CLEAR_HOLD' });
      engine.tick(16.67);

      expect(engine.getState().hold).toBeNull();
    });

    it('is undoable (restores the held piece)', () => {
      const engine = createEngine();
      engine.handleInput({ type: 'HOLD' });
      engine.tick(16.67);
      const heldBefore = engine.getState().hold;

      engine.handleInput({ type: 'CLEAR_HOLD' });
      engine.tick(16.67);
      expect(engine.getState().hold).toBeNull();

      engine.handleInput({ type: 'UNDO' });
      engine.tick(16.67);

      expect(engine.getState().hold).toBe(heldBefore);
    });

    it('is a no-op (and not undoable) when nothing is held', () => {
      const engine = createEngine();
      expect(engine.getState().hold).toBeNull();

      engine.handleInput({ type: 'CLEAR_HOLD' });
      engine.tick(16.67);

      expect(engine.getState().hold).toBeNull();
      expect(engine.canUndo()).toBe(false);
    });
  });

  describe('undoable reset', () => {
    it('reset is undoable: undo restores the previous session and redo re-applies reset', () => {
      const engine = createEngine();
      engine.handleInput({ type: 'HARD_DROP' });
      engine.tick(16.67);
      const boardBefore = engine.getState().board;
      const piecesBefore = engine.getState().stats.piecesPlaced;
      expect(boardBefore.some(r => r.some(c => c !== 0))).toBe(true);

      engine.handleInput({ type: 'RESET' });
      engine.tick(16.67);
      expect(engine.getState().board.every(r => r.every(c => c === 0))).toBe(true);
      expect(engine.getState().stats.piecesPlaced).toBe(0);

      engine.handleInput({ type: 'UNDO' });
      engine.tick(16.67);
      expect(engine.getState().board).toEqual(boardBefore);
      expect(engine.getState().stats.piecesPlaced).toBe(piecesBefore);

      engine.handleInput({ type: 'REDO' });
      engine.tick(16.67);
      expect(engine.getState().board.every(r => r.every(c => c === 0))).toBe(true);
    });
  });

  describe('clearBoard', () => {
    function engineWithStack() {
      const engine = createEngine();
      engine.handleInput({ type: 'HOLD' });
      engine.tick(16.67);
      engine.handleInput({ type: 'HARD_DROP' });
      engine.tick(16.67);
      return engine;
    }

    it('clears only the board, keeping piece, queue, hold and stats', () => {
      const engine = engineWithStack();
      const state = engine.getState();
      expect(state.board.some(r => r.some(c => c !== 0))).toBe(true);
      const holdBefore = state.hold;
      const queueBefore = state.queue;
      const piecesBefore = state.stats.piecesPlaced;
      const activeBefore = state.activePiece;

      engine.clearBoard();
      const cleared = engine.getState();
      expect(cleared.board.every(r => r.every(c => c === 0))).toBe(true);
      expect(cleared.hold).toBe(holdBefore);
      expect(cleared.queue).toEqual(queueBefore);
      expect(cleared.stats.piecesPlaced).toBe(piecesBefore);
      expect(cleared.activePiece).toEqual(activeBefore);
    });

    it('is undoable', () => {
      const engine = engineWithStack();
      const boardBefore = engine.getState().board;

      engine.clearBoard();
      expect(engine.getState().board.every(r => r.every(c => c === 0))).toBe(true);

      engine.handleInput({ type: 'UNDO' });
      engine.tick(16.67);
      expect(engine.getState().board).toEqual(boardBefore);
    });

    it('is a no-op (and not undoable) when the board is already empty', () => {
      const engine = createEngine();
      engine.clearBoard();
      expect(engine.canUndo()).toBe(false);
    });
  });
});
