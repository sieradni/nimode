import { describe, it, expect } from 'vitest';
import { StatsTracker } from '../statsTracker';

describe('StatsTracker', () => {
  it('should initialize all stats to zero', () => {
    const tracker = new StatsTracker();
    const stats = tracker.getStats();
    expect(stats.piecesPlaced).toBe(0);
    expect(stats.linesCleared).toBe(0);
    expect(stats.singles).toBe(0);
    expect(stats.doubles).toBe(0);
    expect(stats.triples).toBe(0);
    expect(stats.quads).toBe(0);
    expect(stats.tSpins).toBe(0);
    expect(stats.tSpinMinis).toBe(0);
    expect(stats.pps).toBe(0);
    expect(stats.apm).toBe(0);
    expect(stats.kpp).toBe(0);
    expect(stats.finesse).toBe(0);
    expect(stats.efficiency).toBe(0);
    expect(stats.attack).toBe(0);
  });

  it('should increment piecesPlaced on recordPiecePlaced', () => {
    const tracker = new StatsTracker();
    tracker.recordPiecePlaced();
    expect(tracker.getStats().piecesPlaced).toBe(1);
    tracker.recordPiecePlaced();
    expect(tracker.getStats().piecesPlaced).toBe(2);
  });

  it('should track singles/doubles/triples/quads on recordLineClear', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(1, false, false);
    expect(tracker.getStats().singles).toBe(1);
    expect(tracker.getStats().linesCleared).toBe(1);
    tracker.recordLineClear(2, false, false);
    expect(tracker.getStats().doubles).toBe(1);
    expect(tracker.getStats().linesCleared).toBe(3);
    tracker.recordLineClear(3, false, false);
    expect(tracker.getStats().triples).toBe(1);
    expect(tracker.getStats().linesCleared).toBe(6);
    tracker.recordLineClear(4, false, false);
    expect(tracker.getStats().quads).toBe(1);
    expect(tracker.getStats().linesCleared).toBe(10);
  });

  it('should increment tSpins on recordLineClear with tSpin=true', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(1, true, false);
    expect(tracker.getStats().tSpins).toBe(1);
  });

  it('should increment tSpinMinis on recordLineClear with tSpinMini=true', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(1, false, true);
    expect(tracker.getStats().tSpinMinis).toBe(1);
  });

  it('should increment keyPresses on recordKeyPress', () => {
    const tracker = new StatsTracker();
    tracker.recordKeyPress();
    expect(tracker.getStats().kpp).toBe(0); // no pieces placed yet
  });

  it('should increment finesse on recordFinesse', () => {
    const tracker = new StatsTracker();
    tracker.recordFinesse();
    expect(tracker.getStats().finesse).toBe(1);
  });

  it('should calculate PPS correctly', () => {
    const tracker = new StatsTracker();
    tracker.tick(10000);
    for (let i = 0; i < 20; i++) {
      tracker.recordPiecePlaced();
    }
    expect(tracker.getStats().pps).toBe(2);
  });

  it('should calculate APM correctly', () => {
    const tracker = new StatsTracker();
    tracker.tick(120000);
    tracker.recordLineClear(4, false, false);
    tracker.recordLineClear(2, false, false);
    expect(tracker.getStats().attack).toBe(5);
    expect(tracker.getStats().apm).toBe(2.5);
  });

  it('should calculate KPP correctly', () => {
    const tracker = new StatsTracker();
    tracker.recordKeyPress();
    tracker.recordKeyPress();
    tracker.recordKeyPress();
    tracker.recordPiecePlaced();
    expect(tracker.getStats().kpp).toBe(3);
  });

  it('should calculate efficiency correctly', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(4, false, false);
    tracker.recordPiecePlaced();
    expect(tracker.getStats().efficiency).toBe(4);
  });

  it('should calculate attack correctly', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(1, false, false);
    expect(tracker.getStats().attack).toBe(0);
    tracker.recordLineClear(2, false, false);
    expect(tracker.getStats().attack).toBe(1);
    tracker.recordLineClear(3, false, false);
    expect(tracker.getStats().attack).toBe(3);
    tracker.recordLineClear(4, false, false);
    expect(tracker.getStats().attack).toBe(7);
    tracker.recordLineClear(1, true, false);
    expect(tracker.getStats().attack).toBe(8);
    tracker.recordLineClear(1, false, true);
    expect(tracker.getStats().attack).toBe(8);
  });

  it('should reset all stats to initial values', () => {
    const tracker = new StatsTracker();
    tracker.recordPiecePlaced();
    tracker.recordKeyPress();
    tracker.recordLineClear(4, false, false);
    tracker.recordFinesse();
    tracker.tick(5000);
    tracker.reset();
    const stats = tracker.getStats();
    expect(stats.piecesPlaced).toBe(0);
    expect(stats.linesCleared).toBe(0);
    expect(stats.singles).toBe(0);
    expect(stats.doubles).toBe(0);
    expect(stats.triples).toBe(0);
    expect(stats.quads).toBe(0);
    expect(stats.tSpins).toBe(0);
    expect(stats.tSpinMinis).toBe(0);
    expect(stats.attack).toBe(0);
    expect(stats.finesse).toBe(0);
    expect(stats.pps).toBe(0);
    expect(stats.apm).toBe(0);
    expect(stats.kpp).toBe(0);
    expect(stats.efficiency).toBe(0);
  });
});
