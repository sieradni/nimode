import { describe, it, expect } from 'vitest';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { createEmptyBoard } from '../boardUtils';
import { ActivePiece } from '../types';

describe('SrsPlusRotationSystem', () => {
  const rotationSystem = new SrsPlusRotationSystem();

  it('should return initial spawn position for pieces', () => {
    const spawnI = rotationSystem.getInitialState(1);
    expect(spawnI).toEqual({ x: 3, y: 19, rotation: 0 });

    const spawnO = rotationSystem.getInitialState(4);
    expect(spawnO).toEqual({ x: 4, y: 19, rotation: 0 });
  });

  it('should rotate piece clockwise in open space without kick', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 6, x: 3, y: 19, rotation: 0 }; // T piece

    const result = rotationSystem.rotate(board, piece, 1);
    expect(result).not.toBeNull();
    expect(result?.piece.rotation).toBe(1);
    expect(result?.kicked).toBe(false);
  });

  it('should perform 180 degree rotation', () => {
    const board = createEmptyBoard();
    const piece: ActivePiece = { type: 6, x: 3, y: 19, rotation: 0 };

    const result = rotationSystem.rotate(board, piece, 2);
    expect(result).not.toBeNull();
    expect(result?.piece.rotation).toBe(2);
  });
});
