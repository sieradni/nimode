import { GameConfig, DEFAULT_CONFIG } from './types';
import { loadConfigFromStorage, saveConfigToStorage } from './settingsIO';

export class GameConfigStore {
  private config: GameConfig;
  private readonly listeners = new Set<() => void>();

  constructor() {
    this.config = loadConfigFromStorage();
  }

  getConfig(): GameConfig {
    return { ...this.config };
  }

  setGravity(gravity: number): void {
    this.config = { ...this.config, gravity };
    saveConfigToStorage(this.config);
    this.notify();
  }

  setSubzero(subzero: boolean): void {
    this.config = { ...this.config, subzero };
    saveConfigToStorage(this.config);
    this.notify();
  }

  setConfig(config: GameConfig): void {
    this.config = { ...config };
    saveConfigToStorage(this.config);
    this.notify();
  }

  resetToDefault(): void {
    this.config = { ...DEFAULT_CONFIG };
    saveConfigToStorage(this.config);
    this.notify();
  }

  subscribe(fn: () => void): void {
    this.listeners.add(fn);
  }

  unsubscribe(fn: () => void): void {
    this.listeners.delete(fn);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}

export const configStore = new GameConfigStore();
