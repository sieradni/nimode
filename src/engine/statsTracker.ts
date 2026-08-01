import { GameStats } from './types';

export class StatsTracker {
  private piecesPlaced = 0;
  private linesCleared = 0;
  private singles = 0;
  private doubles = 0;
  private triples = 0;
  private quads = 0;
  private tSpins = 0;
  private tSpinMinis = 0;
  private keyPresses = 0;
  private finesse = 0;
  private attack = 0;
  private elapsedMs = 0;

  recordPiecePlaced(): void {
    this.piecesPlaced++;
  }

  recordLineClear(linesCleared: number, tSpin: boolean, tSpinMini: boolean): void {
    this.linesCleared += linesCleared;
    switch (linesCleared) {
      case 1: this.singles++; break;
      case 2: this.doubles++; break;
      case 3: this.triples++; break;
      case 4: this.quads++; break;
    }
    if (tSpin) this.tSpins++;
    if (tSpinMini) this.tSpinMinis++;
    let lineAttack = 0;
    switch (linesCleared) {
      case 1: lineAttack = 0; break;
      case 2: lineAttack = 1; break;
      case 3: lineAttack = 2; break;
      case 4: lineAttack = 4; break;
    }
    if (tSpin) lineAttack += 1;
    this.attack += lineAttack;
  }

  recordKeyPress(): void {
    this.keyPresses++;
  }

  recordFinesse(): void {
    this.finesse++;
  }

  recordFinesseErrors(count: number): void {
    this.finesse += count;
  }

  tick(dt: number): void {
    this.elapsedMs += dt;
  }

  getStats(): GameStats {
    const elapsedSec = this.elapsedMs / 1000;
    const elapsedMin = this.elapsedMs / 60000;
    const pps = elapsedSec > 0 ? this.piecesPlaced / elapsedSec : 0;
    const apm = elapsedMin > 0 ? this.attack / elapsedMin : 0;
    const kpp = this.piecesPlaced > 0 ? this.keyPresses / this.piecesPlaced : 0;
    const efficiency = this.piecesPlaced > 0 ? this.attack / this.piecesPlaced : 0;
    return {
      piecesPlaced: this.piecesPlaced,
      linesCleared: this.linesCleared,
      singles: this.singles,
      doubles: this.doubles,
      triples: this.triples,
      quads: this.quads,
      tSpins: this.tSpins,
      tSpinMinis: this.tSpinMinis,
      pps,
      apm,
      kpp,
      finesse: this.finesse,
      efficiency,
      attack: this.attack,
    };
  }

  reset(): void {
    this.piecesPlaced = 0;
    this.linesCleared = 0;
    this.singles = 0;
    this.doubles = 0;
    this.triples = 0;
    this.quads = 0;
    this.tSpins = 0;
    this.tSpinMinis = 0;
    this.keyPresses = 0;
    this.finesse = 0;
    this.attack = 0;
    this.elapsedMs = 0;
  }
}
