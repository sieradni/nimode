import { describe, it, expect } from 'vitest';
import { SrsPlusRotationSystem } from '../systems/SrsPlusRotationSystem';
import { createEmptyBoard } from '../boardUtils';
import { ActivePiece, BoardMatrix, PieceType } from '../types';

/**
 * Comprehensive SRS+ spin tests.
 *
 * Board coordinates:
 *   x: 0 (left) → 9 (right)
 *   y: 0 (top / ceiling) → 39 (bottom / floor)
 *
 * Piece shapes at rotation 0 (spawn):
 *   S (5): [ .SS ]   Z (7): [ ZZ. ]   T (6): [ .T. ]
 *          [ SS. ]          [ .ZZ ]          [ TTT ]
 *          [ ... ]          [ ... ]          [ ... ]
 */

const rs = new SrsPlusRotationSystem();

function setCell(board: BoardMatrix, y: number, x: number, v = 1): void {
    const row = board[y];
    if (row) row[x] = v;
}

/** Fill an entire row except for the given columns */
function fillRowExcept(board: BoardMatrix, y: number, except: number[]): void {
    for (let x = 0; x < 10; x++) {
        if (!except.includes(x)) setCell(board, y, x);
    }
}

describe('SRS+ spin scenarios', () => {
    // ─── S-piece spins ─────────────────────────────────────────────────
    describe('S-piece (5)', () => {
        it('S-spin CW: tucks under an overhang via kick', () => {
            // Classic S-spin: S piece in rotation 0, rotate CW to fit under ledge
            const board = createEmptyBoard();
            //   0 1 2 3 4 5 6 7 8 9
            // 37:  . . X X X X X X X X
            // 38:  . . . X X X X X X X
            // 39:  X . . X X X X X X X
            fillRowExcept(board, 37, [0, 1]);
            fillRowExcept(board, 38, [0, 1, 2]);
            fillRowExcept(board, 39, [1, 2]);

            // S-piece in rotation 1 (CW from spawn): vertical S
            // rot1:  [ S. ]
            //        [ SS ]
            //        [ .S ]
            const piece: ActivePiece = { type: 5, x: 0, y: 36, rotation: 1 };
            // Rotate CW (1→2): should kick to fill the gap
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(2);
        });

        it('S-spin CCW: tucks under an overhang', () => {
            const board = createEmptyBoard();
            // Mirror setup for CCW rotation
            fillRowExcept(board, 37, [8, 9]);
            fillRowExcept(board, 38, [7, 8, 9]);
            fillRowExcept(board, 39, [7, 8]);

            // S-piece in rotation 3
            const piece: ActivePiece = { type: 5, x: 7, y: 36, rotation: 3 };
            const result = rs.rotate(board, piece, -1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(2);
        });

        it('S-piece basic CW rotation in open space', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 5, x: 4, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(1);
            expect(result!.kicked).toBe(false);
        });

        it('S-piece wall-kick left wall CW', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 5, x: 0, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, -1);
            expect(result).not.toBeNull();
            // The piece should kick to a valid position
        });

        it('S-piece completes full 4-rotation cycle', () => {
            const board = createEmptyBoard();
            let piece: ActivePiece = { type: 5, x: 4, y: 20, rotation: 0 };
            for (let i = 0; i < 4; i++) {
                const result = rs.rotate(board, piece, 1);
                expect(result).not.toBeNull();
                piece = result!.piece;
            }
            expect(piece.rotation).toBe(0);
        });
    });

    // ─── Z-piece spins ─────────────────────────────────────────────────
    describe('Z-piece (7)', () => {
        it('Z-spin CW: tucks under an overhang via kick', () => {
            const board = createEmptyBoard();
            // Mirror of S-spin setup
            fillRowExcept(board, 37, [8, 9]);
            fillRowExcept(board, 38, [7, 8, 9]);
            fillRowExcept(board, 39, [7, 8]);

            // Z-piece in rotation 3 (CCW from spawn)
            const piece: ActivePiece = { type: 7, x: 7, y: 36, rotation: 3 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(0);
        });

        it('Z-spin CCW: tucks under an overhang', () => {
            const board = createEmptyBoard();
            fillRowExcept(board, 37, [0, 1]);
            fillRowExcept(board, 38, [0, 1, 2]);
            fillRowExcept(board, 39, [1, 2]);

            const piece: ActivePiece = { type: 7, x: 0, y: 36, rotation: 1 };
            const result = rs.rotate(board, piece, -1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(0);
        });

        it('Z-piece basic CW rotation in open space', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 7, x: 4, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(1);
            expect(result!.kicked).toBe(false);
        });

        it('Z-piece wall-kick right wall CW', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 7, x: 8, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
        });

        it('Z-piece completes full 4-rotation cycle', () => {
            const board = createEmptyBoard();
            let piece: ActivePiece = { type: 7, x: 4, y: 20, rotation: 0 };
            for (let i = 0; i < 4; i++) {
                const result = rs.rotate(board, piece, 1);
                expect(result).not.toBeNull();
                piece = result!.piece;
            }
            expect(piece.rotation).toBe(0);
        });
    });

    // ─── J-piece spins ─────────────────────────────────────────────────
    describe('J-piece (2)', () => {
        it('J-spin into a gap using wall kick', () => {
            const board = createEmptyBoard();
            // Create a 3-wide opening at the left
            fillRowExcept(board, 38, [0, 1, 2]);
            fillRowExcept(board, 39, [0]);

            const piece: ActivePiece = { type: 2, x: 0, y: 37, rotation: 0 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(1);
        });

        it('J-piece basic CW rotation in open space', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 2, x: 4, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(1);
            expect(result!.kicked).toBe(false);
        });

        it('J-piece completes full 4-rotation cycle', () => {
            const board = createEmptyBoard();
            let piece: ActivePiece = { type: 2, x: 4, y: 20, rotation: 0 };
            for (let i = 0; i < 4; i++) {
                const result = rs.rotate(board, piece, 1);
                expect(result).not.toBeNull();
                piece = result!.piece;
            }
            expect(piece.rotation).toBe(0);
        });
    });

    // ─── L-piece spins ─────────────────────────────────────────────────
    describe('L-piece (3)', () => {
        it('L-spin into a gap using wall kick', () => {
            const board = createEmptyBoard();
            fillRowExcept(board, 38, [7, 8, 9]);
            fillRowExcept(board, 39, [9]);

            const piece: ActivePiece = { type: 3, x: 7, y: 37, rotation: 0 };
            const result = rs.rotate(board, piece, -1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(3);
        });

        it('L-piece basic CCW rotation in open space', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 3, x: 4, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, -1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(3);
            expect(result!.kicked).toBe(false);
        });

        it('L-piece completes full 4-rotation cycle', () => {
            const board = createEmptyBoard();
            let piece: ActivePiece = { type: 3, x: 4, y: 20, rotation: 0 };
            for (let i = 0; i < 4; i++) {
                const result = rs.rotate(board, piece, 1);
                expect(result).not.toBeNull();
                piece = result!.piece;
            }
            expect(piece.rotation).toBe(0);
        });
    });

    // ─── T-piece spins ─────────────────────────────────────────────────
    describe('T-piece (6) - T-spin scenarios', () => {
        it('T-spin triple: classic TST slot', () => {
            const board = createEmptyBoard();
            // Build a T-spin triple setup:
            //   0 1 2 3 4 5 6 7 8 9
            // 36: X X X X X . X X X X
            // 37: X X X X X . . X X X
            // 38: X X X X X . X X X X
            // 39: X X X X . . X X X X
            fillRowExcept(board, 36, [5]);
            fillRowExcept(board, 37, [5, 6]);
            fillRowExcept(board, 38, [5]);
            fillRowExcept(board, 39, [4, 5]);

            // T-piece pointing down (rot=2), hovering above the slot
            const piece: ActivePiece = { type: 6, x: 4, y: 36, rotation: 0 };
            // Rotate CW — should kick into the T-slot
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(1);
        });

        it('T-spin double: T-piece kicks down into pocket', () => {
            const board = createEmptyBoard();
            // Build a pocket where the T needs to kick into:
            //   0 1 2 3 4 5 6 7 8 9
            // 37: X X X X X X . X X X  ← overhang at col 6
            // 38: X X X X X . . X X X  ← open at 5,6
            // 39: X X X X X . . X X X  ← open at 5,6
            fillRowExcept(board, 37, [6]);
            fillRowExcept(board, 38, [5, 6]);
            fillRowExcept(board, 39, [5, 6]);

            // T-piece in rotation 1 (CW state), sitting just above the pocket
            // rot1 at (5,36):
            //   (5,36)  (5,37)  (5,38)  = column of T
            //           (6,37)          = bump to right
            const piece: ActivePiece = { type: 6, x: 5, y: 36, rotation: 1 };
            // CW again → rot 2 (pointing up). Kick should tuck it down.
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(2);
        });

        it('T-piece wall kick off right wall CW', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 6, x: 8, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
        });

        it('T-piece wall kick off left wall CCW', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 6, x: 0, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, -1);
            expect(result).not.toBeNull();
        });

        it('T-piece 180 rotation in open space', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 6, x: 4, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, 2);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(2);
        });
    });

    // ─── I-piece spins ─────────────────────────────────────────────────
    describe('I-piece (1) - SRS+ specific kicks', () => {
        it('I-piece wall-kick off left wall CW', () => {
            const board = createEmptyBoard();
            // I in spawn at left wall
            const piece: ActivePiece = { type: 1, x: 0, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(1);
        });

        it('I-piece wall-kick off right wall CW', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 1, x: 7, y: 30, rotation: 1 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(2);
        });

        it('I-piece fits into a 4-wide gap CW', () => {
            const board = createEmptyBoard();
            fillRowExcept(board, 39, [3, 4, 5, 6]);
            const piece: ActivePiece = { type: 1, x: 3, y: 36, rotation: 0 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(1);
        });

        it('I-piece 180 rotation', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 1, x: 3, y: 30, rotation: 0 };
            const result = rs.rotate(board, piece, 2);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(2);
        });
    });

    // ─── Cross-piece kick symmetry ─────────────────────────────────────
    describe('kick symmetry', () => {
        const NON_O_PIECES: PieceType[] = [1, 2, 3, 5, 6, 7];

        it('CW then CCW returns to original state in open space', () => {
            const board = createEmptyBoard();
            for (const type of NON_O_PIECES) {
                const spawn = rs.getInitialState(type);
                const piece: ActivePiece = { type, x: spawn.x, y: spawn.y, rotation: spawn.rotation };
                const cw = rs.rotate(board, piece, 1);
                expect(cw).not.toBeNull();
                const ccw = rs.rotate(board, cw!.piece, -1);
                expect(ccw).not.toBeNull();
                expect(ccw!.piece.rotation).toBe(piece.rotation);
                expect(ccw!.piece.x).toBe(piece.x);
                expect(ccw!.piece.y).toBe(piece.y);
            }
        });

        it('180 twice returns to original state', () => {
            const board = createEmptyBoard();
            for (const type of NON_O_PIECES) {
                const spawn = rs.getInitialState(type);
                const piece: ActivePiece = { type, x: spawn.x, y: spawn.y, rotation: spawn.rotation };
                const first = rs.rotate(board, piece, 2);
                expect(first).not.toBeNull();
                const second = rs.rotate(board, first!.piece, 2);
                expect(second).not.toBeNull();
                expect(second!.piece.rotation).toBe(piece.rotation);
            }
        });
    });

    // ─── Floor kicks ───────────────────────────────────────────────────
    describe('floor kicks', () => {
        it('T-piece at floor kicks up when rotating CW', () => {
            const board = createEmptyBoard();
            // T in rotation 2 (pointing up) at the very bottom
            const piece: ActivePiece = { type: 6, x: 4, y: 38, rotation: 2 };
            // CCW: 2→1
            const result = rs.rotate(board, piece, -1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(1);
        });

        it('S-piece at floor kicks up when rotating CW', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 5, x: 4, y: 38, rotation: 0 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(1);
        });

        it('Z-piece at floor kicks up when rotating CW', () => {
            const board = createEmptyBoard();
            const piece: ActivePiece = { type: 7, x: 4, y: 38, rotation: 0 };
            const result = rs.rotate(board, piece, 1);
            expect(result).not.toBeNull();
            expect(result!.piece.rotation).toBe(1);
        });
    });
});
