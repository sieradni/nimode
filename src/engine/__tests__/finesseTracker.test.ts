import { describe, it, expect } from 'vitest';
import { FinesseTracker } from '../finesseTracker';

describe('FinesseTracker', () => {
  it('reports zero errors for a direct hard drop from spawn', () => {
    const tracker = new FinesseTracker();
    tracker.beginPiece(3, 0);
    const errors = tracker.endPiece(3, 0);
    expect(errors).toBe(0);
  });

  it('reports zero errors when moves match the final distance', () => {
    const tracker = new FinesseTracker();
    tracker.beginPiece(3, 0);
    tracker.recordInput('move');
    tracker.recordInput('move');
    const errors = tracker.endPiece(5, 0);
    expect(errors).toBe(0);
  });

  it('counts a wasted horizontal press as one error', () => {
    const tracker = new FinesseTracker();
    tracker.beginPiece(3, 0);
    tracker.recordInput('move');
    tracker.recordInput('move');
    tracker.recordInput('move');
    const errors = tracker.endPiece(5, 0);
    expect(errors).toBe(1);
  });

  it('counts excess rotations when a 180 press would suffice', () => {
    const tracker = new FinesseTracker();
    tracker.beginPiece(3, 0);
    tracker.recordInput('rotate');
    tracker.recordInput('rotate');
    const errors = tracker.endPiece(3, 2);
    expect(errors).toBe(1);
  });

  it('allows a single rotation press for any target rotation', () => {
    const tracker = new FinesseTracker();
    tracker.beginPiece(3, 0);
    tracker.recordInput('rotate');
    const errors = tracker.endPiece(3, 2);
    expect(errors).toBe(0);
  });

  it('ignores inputs recorded before a piece begins', () => {
    const tracker = new FinesseTracker();
    tracker.recordInput('move');
    const errors = tracker.endPiece(3, 0);
    expect(errors).toBe(0);
  });

  it('returns zero for endPiece without an active piece', () => {
    const tracker = new FinesseTracker();
    expect(tracker.endPiece(3, 0)).toBe(0);
  });

  it('reset clears the current piece context', () => {
    const tracker = new FinesseTracker();
    tracker.beginPiece(3, 0);
    tracker.recordInput('move');
    tracker.reset();
    expect(tracker.endPiece(3, 0)).toBe(0);
  });
});
