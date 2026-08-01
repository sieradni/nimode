import { describe, it, expect } from 'vitest';
import { createEmptyBoard } from '../boardUtils';
import { detectTSpin } from '../tSpinDetector';
import { ActivePiece } from '../types';

describe('detectTSpin', () => {
  it('returns false for non-T pieces', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 1, x: 3, y: 30, rotation: 0 };
    expect(detectTSpin(board, piece)).toBe(false);
  });

  it('returns false when fewer than 3 corners are occupied', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 6, x: 3, y: 30, rotation: 0 };
    expect(detectTSpin(board, piece)).toBe(false);
  });

  it('returns true when 3 of 4 corners are occupied', () => {
    const board = createEmptyBoard();
    board[30]![3] = 1;
    board[30]![5] = 1;
    board[32]![5] = 1;
    const piece: ActivePiece = { type: 6, x: 3, y: 30, rotation: 0 };
    expect(detectTSpin(board, piece)).toBe(true);
  });

  it('returns true when all 4 corners are occupied', () => {
    const board = createEmptyBoard();
    board[30]![3] = 1;
    board[30]![5] = 1;
    board[32]![3] = 1;
    board[32]![5] = 1;
    const piece: ActivePiece = { type: 6, x: 3, y: 30, rotation: 0 };
    expect(detectTSpin(board, piece)).toBe(true);
  });
});
