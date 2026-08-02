import { describe, it, expect } from 'vitest';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { createEmptyBoard } from '../boardUtils';
import { ActivePiece, PieceType, BoardMatrix, DEFAULT_CONFIG } from '../types';

function setCell(board: BoardMatrix, y: number, x: number, value: number): void {
  const row = board[y];
  if (row) {
    row[x] = value;
  }
}

describe('SrsPlusRotationSystem', () => {
  const rotationSystem = new SrsPlusRotationSystem();
  const testConfig = { ...DEFAULT_CONFIG };

  it('should return initial spawn position for pieces', () => {
    const spawnI = rotationSystem.getInitialState(1, testConfig);
    expect(spawnI).toEqual({ x: 3, y: 20, rotation: 0 });

    const spawnO = rotationSystem.getInitialState(4, testConfig);
    expect(spawnO).toEqual({ x: 4, y: 20, rotation: 0 });
  });

  it('should rotate piece clockwise in open space without kick', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 6, x: 3, y: 19, rotation: 0 };

    const result = rotationSystem.rotate(board, piece, 1);
    expect(result).not.toBeNull();
    expect(result?.piece.rotation).toBe(1);
    expect(result?.kicked).toBe(false);
    expect(result?.kickIndex).toBe(0);
  });

  it('should perform 180 degree rotation', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 6, x: 3, y: 19, rotation: 0 };

    const result = rotationSystem.rotate(board, piece, 2);
    expect(result).not.toBeNull();
    expect(result?.piece.rotation).toBe(2);
  });

  it('should not kick when rotating O piece', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 4, x: 4, y: 19, rotation: 0 };

    const result = rotationSystem.rotate(board, piece, 1);
    expect(result).not.toBeNull();
    expect(result?.kicked).toBe(false);
    expect(result?.kickIndex).toBe(0);
  });

  it('should perform 180-degree rotation for all non-O piece types', () => {
    const board = createEmptyBoard();
    const pieceTypes: PieceType[] = [1, 2, 3, 5, 6, 7];

    for (const type of pieceTypes) {
      const spawn = rotationSystem.getInitialState(type, testConfig);
      const piece: ActivePiece = { type, x: spawn.x, y: spawn.y, rotation: 0 };

      const result = rotationSystem.rotate(board, piece, 2);
      expect(result).not.toBeNull();
      expect(result?.piece.rotation).toBe(2);
      expect(result?.kicked).toBe(false);
      expect(result?.kickIndex).toBe(0);
    }
  });

  it('should perform clockwise rotation for all non-O piece types', () => {
    const board = createEmptyBoard();
    const pieceTypes: PieceType[] = [1, 2, 3, 5, 6, 7];

    for (const type of pieceTypes) {
      const spawn = rotationSystem.getInitialState(type, testConfig);
      const piece: ActivePiece = { type, x: spawn.x, y: spawn.y, rotation: 0 };

      const result = rotationSystem.rotate(board, piece, 1);
      expect(result).not.toBeNull();
      expect(result?.piece.rotation).toBe(1);
    }
  });

  it('should perform counter-clockwise rotation for all non-O piece types', () => {
    const board = createEmptyBoard();
    const pieceTypes: PieceType[] = [1, 2, 3, 5, 6, 7];

    for (const type of pieceTypes) {
      const spawn = rotationSystem.getInitialState(type, testConfig);
      const piece: ActivePiece = { type, x: spawn.x, y: spawn.y, rotation: 0 };

      const result = rotationSystem.rotate(board, piece, -1);
      expect(result).not.toBeNull();
      expect(result?.piece.rotation).toBe(3);
    }
  });

  it('should return null when rotation is fully blocked', () => {
    const board = createEmptyBoard();
    for (let y = 0; y < 40; y++) {
      for (let x = 0; x < 10; x++) {
        setCell(board, y, x, 1);
      }
    }

    const piece: ActivePiece = { type: 6, x: 3, y: 19, rotation: 0 };
    const result = rotationSystem.rotate(board, piece, 1);
    expect(result).toBeNull();
  });

  it('should wall-kick a T piece clockwise off a blocking cell', () => {
    const board = createEmptyBoard();
    setCell(board, 16, 9, 1);

    const piece: ActivePiece = { type: 6, x: 7, y: 15, rotation: 0 };
    const result = rotationSystem.rotate(board, piece, 1);

    expect(result).not.toBeNull();
    expect(result?.piece.rotation).toBe(1);
    expect(result?.kicked).toBe(true);
    expect(result?.kickIndex).toBe(1);
    expect(result?.piece.x).toBe(6);
    expect(result?.piece.y).toBe(15);
  });

  it('should wall-kick a T piece 180 degrees off a blocking cell', () => {
    const board = createEmptyBoard();
    setCell(board, 16, 9, 1);

    const piece: ActivePiece = { type: 6, x: 7, y: 15, rotation: 0 };
    const result = rotationSystem.rotate(board, piece, 2);

    expect(result).not.toBeNull();
    expect(result?.piece.rotation).toBe(2);
    expect(result?.kicked).toBe(true);
    expect(result?.kickIndex).toBe(1);
    expect(result?.piece.x).toBe(7);
    expect(result?.piece.y).toBe(16);
  });

  it('should preserve piece type across rotation', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 6, x: 3, y: 19, rotation: 0 };

    const result = rotationSystem.rotate(board, piece, 1);
    expect(result?.piece.type).toBe(6);
  });

  it('should rotate back to original state via 180 twice', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 6, x: 3, y: 19, rotation: 0 };

    const first = rotationSystem.rotate(board, piece, 2);
    expect(first).not.toBeNull();
    expect(first?.piece.rotation).toBe(2);

    const second = rotationSystem.rotate(board, first!.piece, 2);
    expect(second).not.toBeNull();
    expect(second?.piece.rotation).toBe(0);
  });
});
