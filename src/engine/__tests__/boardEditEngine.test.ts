import { describe, it, expect } from 'vitest';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../types/board';
import { applyBoardPen, applyBoardErase, applyBoardRectFill, applyBoardFloodErase } from '../boardEditEngine';

function createBoard(): number[][] {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(0));
}

const BLOCK = 8;

describe('applyBoardPen', () => {
  it('writes the value into an empty cell', () => {
    const board = createBoard();
    const result = applyBoardPen(board, 3, 4, BLOCK);
    expect(result[4]?.[3]).toBe(BLOCK);
  });

  it('overwrites a locked tetromino cell', () => {
    const board = createBoard();
    const row10 = board[10]; if (row10) row10[5] = 6;
    const result = applyBoardPen(board, 5, 10, BLOCK);
    expect(result[10]?.[5]).toBe(BLOCK);
  });

  it('erases any cell value when value is 0', () => {
    const board = createBoard();
    const row2 = board[2]; if (row2) row2[2] = 8;
    const result = applyBoardPen(board, 2, 2, 0);
    expect(result[2]?.[2]).toBe(0);
  });

  it('does not mutate the input board and ignores out-of-bounds cells', () => {
    const board = createBoard();
    const result = applyBoardPen(board, -1, 0, BLOCK);
    expect(result).toEqual(board);
    expect(board[0]?.[0]).toBe(0);
  });
});

describe('applyBoardErase', () => {
  it('clears any cell regardless of its value', () => {
    const board = createBoard();
    const row6 = board[6]; if (row6) row6[6] = 3;
    const result = applyBoardErase(board, 6, 6);
    expect(result[6]?.[6]).toBe(0);
  });
});

describe('applyBoardRectFill', () => {
  it('fills the whole rectangle with the value', () => {
    const board = createBoard();
    const result = applyBoardRectFill(board, 1, 1, 3, 3, BLOCK);
    for (let y = 1; y <= 3; y++) {
      for (let x = 1; x <= 3; x++) {
        expect(result[y]?.[x]).toBe(BLOCK);
      }
    }
    expect(result[0]?.[0]).toBe(0);
  });

  it('normalises reversed corners', () => {
    const board = createBoard();
    const result = applyBoardRectFill(board, 3, 3, 1, 1, BLOCK);
    expect(result[1]?.[1]).toBe(BLOCK);
    expect(result[3]?.[3]).toBe(BLOCK);
  });

  it('clamps corners outside the board', () => {
    const board = createBoard();
    const result = applyBoardRectFill(board, -5, -5, 2, 2, BLOCK);
    expect(result[0]?.[0]).toBe(BLOCK);
    expect(result[2]?.[2]).toBe(BLOCK);
  });
});

describe('applyBoardFloodErase', () => {
  it('clears a connected region regardless of cell values', () => {
    const board = createBoard();
    const r5 = board[5]; if (r5) r5[5] = 8;
    const r56 = board[5]; if (r56) r56[6] = 3;
    const r65 = board[6]; if (r65) r65[5] = 8;
    const r66 = board[6]; if (r66) r66[6] = 8;
    const r77 = board[7]; if (r77) r77[7] = 8;
    const result = applyBoardFloodErase(board, 5, 5);
    expect(result[5]?.[5]).toBe(0);
    expect(result[5]?.[6]).toBe(0);
    expect(result[6]?.[5]).toBe(0);
    expect(result[6]?.[6]).toBe(0);
    expect(result[7]?.[7]).toBe(8);
  });

  it('is a no-op on an empty cell', () => {
    const board = createBoard();
    const result = applyBoardFloodErase(board, 3, 3);
    expect(result).toEqual(board);
  });
});
