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
    expect(stats.time).toBe(0);
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

  it('should increment only tSpins (not tSpinMinis) on regular T-Spin', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(1, true, false);
    expect(tracker.getStats().tSpins).toBe(1);
    expect(tracker.getStats().tSpinMinis).toBe(0);
  });

  it('should increment only tSpinMinis (not tSpins) on T-Spin Mini', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(1, true, true);
    expect(tracker.getStats().tSpinMinis).toBe(1);
    expect(tracker.getStats().tSpins).toBe(0);
  });

  it('should increment keyPresses on recordKeyPress', () => {
    const tracker = new StatsTracker();
    tracker.recordKeyPress();
    expect(tracker.getStats().kpp).toBe(0);
  });

  it('should track finesse errors on recordFinesseErrors', () => {
    const tracker = new StatsTracker();
    tracker.recordFinesseErrors(3);
    expect(tracker.getStats().finesse).toBe(3);
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

  it('should calculate efficiency (APP = attack / pieces) correctly', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(4, false, false);
    tracker.recordPiecePlaced();
    expect(tracker.getStats().efficiency).toBe(4);
  });

  it('should calculate attack correctly for regular clears', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(1, false, false); // Single = 0
    expect(tracker.getStats().attack).toBe(0);
    tracker.recordLineClear(2, false, false); // Double = 1
    expect(tracker.getStats().attack).toBe(1);
    tracker.recordLineClear(3, false, false); // Triple = 2
    expect(tracker.getStats().attack).toBe(3);
    tracker.recordLineClear(4, false, false); // Quad = 4
    expect(tracker.getStats().attack).toBe(7);
  });

  it('should calculate attack correctly for T-Spins', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(0, true, false); // T-Spin 0 lines = 4
    expect(tracker.getStats().attack).toBe(4);
    tracker.recordLineClear(1, true, false); // T-Spin Single = 5
    expect(tracker.getStats().attack).toBe(9);
    tracker.recordLineClear(2, true, false); // T-Spin Double = 6
    expect(tracker.getStats().attack).toBe(15);
    tracker.recordLineClear(3, true, false); // T-Spin Triple = 7
    expect(tracker.getStats().attack).toBe(22);
  });

  it('should calculate attack correctly for T-Spin Minis', () => {
    const tracker = new StatsTracker();
    tracker.recordLineClear(0, true, true); // T-Spin Mini 0 = 0
    expect(tracker.getStats().attack).toBe(0);
    tracker.recordLineClear(1, true, true); // T-Spin Mini Single = 2
    expect(tracker.getStats().attack).toBe(2);
    tracker.recordLineClear(2, true, true); // T-Spin Mini Double = 3
    expect(tracker.getStats().attack).toBe(5);
  });

  it('should count time correctly', () => {
    const tracker = new StatsTracker();
    tracker.tick(1500);
    expect(tracker.getStats().time).toBe(1);
    tracker.tick(4500);
    expect(tracker.getStats().time).toBe(6);
  });

  it('should include raw keyPresses and elapsedMs in snapshot for lossless undo', () => {
    const tracker = new StatsTracker();
    tracker.tick(3000);
    tracker.recordKeyPress();
    tracker.recordKeyPress();
    tracker.recordPiecePlaced();
    const snapshot = tracker.getStatsSnapshot();
    expect(snapshot.keyPresses).toBe(2);
    expect(snapshot.elapsedMs).toBe(3000);
    expect(snapshot.time).toBe(3);
  });

  it('should restore raw keyPresses and elapsedMs from snapshot', () => {
    const tracker = new StatsTracker();
    tracker.undoRestore({
      piecesPlaced: 10,
      linesCleared: 5,
      singles: 0, doubles: 0, triples: 0, quads: 0,
      tSpins: 0, tSpinMinis: 0,
      keyPresses: 25,
      elapsedMs: 5000,
      finesse: 2,
      attack: 10,
      time: 5,
      pps: 2.0, apm: 120, kpp: 2.5, efficiency: 1.0,
    });
    const stats = tracker.getStats();
    expect(stats.kpp).toBe(2.5);
    expect(stats.pps).toBe(2);
    expect(stats.time).toBe(5);
  });

  it('should reset all stats to initial values', () => {
    const tracker = new StatsTracker();
    tracker.recordPiecePlaced();
    tracker.recordKeyPress();
    tracker.recordLineClear(4, false, false);
    tracker.recordFinesseErrors(1);
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
    expect(stats.time).toBe(0);
  });
});
