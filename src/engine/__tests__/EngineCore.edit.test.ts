import { describe, it, expect } from 'vitest';
import { EngineCore } from '../EngineCore';
import { SevenBagRandomizer } from '../systems/SevenBagRandomizer';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { DEFAULT_ANNOTATION_COLOR, PALETTE_CELL_OFFSET } from '../annotationPalette';

function createEngine(config = {}) {
  const engine = new EngineCore({
    bagRandomizer: new SevenBagRandomizer(100),
    rotationSystem: new SrsPlusRotationSystem(),
  });
  engine.initialize({ das: 133, arr: 33, sdf: 50, sdfFactor: 20, lockDelay: 500, maxLockResets: 15, gravity: 1, subzero: false, autoColor: false, spawnOffset: 1, ...config });
  return engine;
}

function penStroke(engine: EngineCore, cells: Array<{ x: number; y: number }>, color = DEFAULT_ANNOTATION_COLOR): void {
  engine.handleInput({ type: 'EDIT_BEGIN', mode: 'annotations' });
  for (const c of cells) {
    engine.handleInput({ type: 'ANNOTATE_PEN', x: c.x, y: c.y, color });
  }
  engine.handleInput({ type: 'EDIT_COMMIT', cells });
}

describe('EngineCore edit transactions', () => {
  it('undoes a whole pen stroke as one step', () => {
    const engine = createEngine();
    penStroke(engine, [{ x: 4, y: 20 }, { x: 5, y: 20 }, { x: 6, y: 20 }]);
    const after = engine.getState();
    expect(after.annotations[20]?.[4]).toBe(PALETTE_CELL_OFFSET);
    expect(after.annotations[20]?.[5]).toBe(PALETTE_CELL_OFFSET);

    expect(engine.undo()).toBe(true);
    const undone = engine.getState();
    expect(undone.annotations[20]?.[4]).toBe(0);
    expect(undone.annotations[20]?.[5]).toBe(0);

    expect(engine.redo()).toBe(true);
    const redone = engine.getState();
    expect(redone.annotations[20]?.[4]).toBe(PALETTE_CELL_OFFSET);
  });

  it('undoing a stroke restores the palette', () => {
    const engine = createEngine();
    penStroke(engine, [{ x: 4, y: 20 }], '#ff0000');
    expect(engine.getState().userPalette).toEqual([DEFAULT_ANNOTATION_COLOR, '#ff0000']);

    engine.undo();
    expect(engine.getState().userPalette).toEqual([DEFAULT_ANNOTATION_COLOR]);

    engine.redo();
    expect(engine.getState().userPalette).toEqual([DEFAULT_ANNOTATION_COLOR, '#ff0000']);
  });

  it('undoes a block-mode edit', () => {
    const engine = createEngine();
    engine.handleInput({ type: 'EDIT_BEGIN', mode: 'blocks' });
    engine.handleInput({ type: 'BOARD_PEN', x: 5, y: 20, color: '#00ff00' });
    engine.handleInput({ type: 'EDIT_COMMIT', cells: [{ x: 5, y: 20 }] });
    expect(engine.getState().board[20]?.[5]).toBe(PALETTE_CELL_OFFSET + 1);

    engine.undo();
    expect(engine.getState().board[20]?.[5]).toBe(0);
  });

  it('undoes a block rect fill', () => {
    const engine = createEngine();
    engine.handleInput({ type: 'EDIT_BEGIN', mode: 'blocks' });
    engine.handleInput({ type: 'BOARD_RECT_FILL', x1: 1, y1: 10, x2: 3, y2: 12, color: DEFAULT_ANNOTATION_COLOR });
    engine.handleInput({ type: 'EDIT_COMMIT', cells: [{ x: 1, y: 10 }, { x: 3, y: 12 }] });
    expect(engine.getState().board[12]?.[3]).toBe(PALETTE_CELL_OFFSET);

    engine.undo();
    expect(engine.getState().board[12]?.[3]).toBe(0);
  });

  it('undoes a block flood erase', () => {
    const engine = createEngine();
    engine.handleInput({ type: 'EDIT_BEGIN', mode: 'blocks' });
    engine.handleInput({ type: 'BOARD_PEN', x: 2, y: 2, color: '#ffffff' });
    engine.handleInput({ type: 'EDIT_COMMIT', cells: [{ x: 2, y: 2 }] });
    engine.handleInput({ type: 'EDIT_BEGIN', mode: 'blocks' });
    engine.handleInput({ type: 'BOARD_FLOOD_ERASE', x: 2, y: 2 });
    engine.handleInput({ type: 'EDIT_COMMIT', cells: [{ x: 2, y: 2 }] });
    expect(engine.getState().board[2]?.[2]).toBe(0);

    engine.undo();
    expect(engine.getState().board[2]?.[2]).toBe(PALETTE_CELL_OFFSET);
  });

  it('undoes ANNOTATE_CLEAR_ALL outside a gesture', () => {
    const engine = createEngine();
    penStroke(engine, [{ x: 4, y: 20 }]);
    engine.handleInput({ type: 'ANNOTATE_CLEAR_ALL' });
    expect(engine.getState().annotations[20]?.[4]).toBe(0);

    engine.undo();
    expect(engine.getState().annotations[20]?.[4]).toBe(PALETTE_CELL_OFFSET);
  });

  it('applies stroke auto-color at commit when enabled', () => {
    const engine = createEngine({ autoColor: true });
    const cells = [{ x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }, { x: 6, y: 21 }];
    penStroke(engine, cells);
    const state = engine.getState();
    for (const c of cells) {
      expect(state.annotations[c.y]?.[c.x]).toBe(6);
    }
  });

  it('keeps the picked colour when auto-color is disabled', () => {
    const engine = createEngine({ autoColor: false });
    const cells = [{ x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }, { x: 6, y: 21 }];
    penStroke(engine, cells);
    const state = engine.getState();
    for (const c of cells) {
      expect(state.annotations[c.y]?.[c.x]).toBe(PALETTE_CELL_OFFSET);
    }
  });

  it('does not promote block-mode strokes with auto-color enabled', () => {
    const engine = createEngine({ autoColor: true });
    engine.handleInput({ type: 'EDIT_BEGIN', mode: 'blocks' });
    engine.handleInput({ type: 'BOARD_PEN', x: 5, y: 20, color: DEFAULT_ANNOTATION_COLOR });
    engine.handleInput({ type: 'BOARD_PEN', x: 4, y: 21, color: DEFAULT_ANNOTATION_COLOR });
    engine.handleInput({ type: 'BOARD_PEN', x: 5, y: 21, color: DEFAULT_ANNOTATION_COLOR });
    engine.handleInput({ type: 'BOARD_PEN', x: 6, y: 21, color: DEFAULT_ANNOTATION_COLOR });
    engine.handleInput({ type: 'EDIT_COMMIT', cells: [{ x: 5, y: 20 }, { x: 4, y: 21 }, { x: 5, y: 21 }, { x: 6, y: 21 }] });
    const state = engine.getState();
    expect(state.board[21]?.[5]).toBe(PALETTE_CELL_OFFSET);
  });
});
