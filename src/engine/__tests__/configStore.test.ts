import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameConfigStore } from '../configStore';
import { DEFAULT_CONFIG, GameConfig } from '../types';

const STORAGE_KEY = 'nimode_config';

function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

describe('GameConfigStore', () => {
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockLocalStorage = createMockStorage();
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should load defaults when no saved data exists', () => {
    const store = new GameConfigStore();
    expect(store.getConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('should set autoColor and persist to localStorage', () => {
    const store = new GameConfigStore();
    store.setAutoColor(true);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.autoColor).toBe(true);
    expect(store.getConfig().autoColor).toBe(true);

    const store2 = new GameConfigStore();
    expect(store2.getConfig().autoColor).toBe(true);
  });

  it('should set gravity and persist to localStorage', () => {
    const store = new GameConfigStore();
    store.setGravity(15);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.gravity).toBe(15);
    expect(store.getConfig().gravity).toBe(15);

    const store2 = new GameConfigStore();
    expect(store2.getConfig().gravity).toBe(15);
  });

  it('should set subzero and persist to localStorage', () => {
    const store = new GameConfigStore();
    store.setSubzero(true);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.subzero).toBe(true);
    expect(store.getConfig().subzero).toBe(true);

    const store2 = new GameConfigStore();
    expect(store2.getConfig().subzero).toBe(true);
  });

  it('should set autoColor and persist to localStorage', () => {
    const store = new GameConfigStore();
    store.setAutoColor(true);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.autoColor).toBe(true);
    expect(store.getConfig().autoColor).toBe(true);

    const store2 = new GameConfigStore();
    expect(store2.getConfig().autoColor).toBe(true);
  });

  it('should notify subscribers when gravity changes', () => {
    const store = new GameConfigStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setGravity(8);
    expect(listener).toHaveBeenCalledTimes(1);

    store.unsubscribe(listener);
    store.setGravity(10);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should notify subscribers when subzero changes', () => {
    const store = new GameConfigStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.setSubzero(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should reset to default config', () => {
    const store = new GameConfigStore();
    store.setGravity(20);
    store.setSubzero(true);

    store.resetToDefault();
    expect(store.getConfig()).toEqual(DEFAULT_CONFIG);

    const store2 = new GameConfigStore();
    expect(store2.getConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('should load all config fields from storage on construction', () => {
    const customConfig: GameConfig = {
      ...DEFAULT_CONFIG,
      gravity: 12,
      subzero: true,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customConfig));

    const store = new GameConfigStore();
    expect(store.getConfig()).toEqual(customConfig);
  });

  it('setConfig replaces the config, persists it, and notifies subscribers', () => {
    const store = new GameConfigStore();
    const listener = vi.fn();
    store.subscribe(listener);

    const imported: GameConfig = { ...DEFAULT_CONFIG, gravity: 18, subzero: true, das: 200 };
    store.setConfig(imported);

    expect(store.getConfig()).toEqual(imported);
    expect(listener).toHaveBeenCalledTimes(1);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.gravity).toBe(18);

    const store2 = new GameConfigStore();
    expect(store2.getConfig()).toEqual(imported);
  });
});
