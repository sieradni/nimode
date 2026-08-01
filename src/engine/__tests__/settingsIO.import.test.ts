import { describe, it, expect, vi, beforeEach } from 'vitest';
import { importSettingsFromJson } from '../settingsIO';
import { DEFAULT_KEYBINDINGS, DEFAULT_CONFIG, KeyBindings, GameConfig } from '../types';

const STORAGE_KEY_BINDINGS = 'nimode_keybindings';
const STORAGE_KEY_CONFIG = 'nimode_config';

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

describe('importSettingsFromJson', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMockStorage());
  });

  it('should import valid JSON string', () => {
    const json = JSON.stringify({
      version: 1,
      keybindings: { ...DEFAULT_KEYBINDINGS, MOVE_LEFT: 'KeyA' },
      config: { ...DEFAULT_CONFIG, das: 200 },
    });
    const result = importSettingsFromJson(json);
    expect(result).not.toBeNull();
    expect(result!.keybindings.MOVE_LEFT).toBe('KeyA');
    expect(result!.config).toBeDefined();
    expect(result!.config!.das).toBe(200);
  });

  it('should write keybindings to localStorage', () => {
    const json = JSON.stringify({
      version: 1,
      keybindings: { ...DEFAULT_KEYBINDINGS, HARD_DROP: 'Space' },
    });
    importSettingsFromJson(json);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_BINDINGS) ?? '{}');
    expect(saved.HARD_DROP).toBe('Space');
  });

  it('should write config to localStorage', () => {
    const json = JSON.stringify({
      version: 1,
      keybindings: DEFAULT_KEYBINDINGS,
      config: { ...DEFAULT_CONFIG, arr: 0, gravity: 15, subzero: true, autoColor: true },
    });
    importSettingsFromJson(json);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) ?? '{}');
    expect(saved.arr).toBe(0);
  });

  it('should return null for invalid JSON string', () => {
    expect(importSettingsFromJson('not valid json')).toBeNull();
  });

  it('should return null for valid JSON with invalid schema', () => {
    expect(importSettingsFromJson(JSON.stringify({ version: 999 }))).toBeNull();
  });

  it('should persist keybindings and config to localStorage', () => {
    const customBindings: KeyBindings = {
      MOVE_LEFT: 'KeyA',
      MOVE_RIGHT: 'KeyD',
      SOFT_DROP: 'KeyS',
      HARD_DROP: 'KeyW',
      ROTATE_CW: 'KeyX',
      ROTATE_CCW: 'KeyZ',
      ROTATE_180: 'KeyC',
      HOLD: 'ShiftLeft',
      RESET: 'KeyR',
      UNDO: 'KeyU',
      REDO: 'KeyY',
    };
    const customConfig: GameConfig = {
      das: 150, arr: 25, sdf: 60, sdfFactor: 15, lockDelay: 400, maxLockResets: 10,
      gravity: 15, subzero: true, autoColor: true,
    };
    const json = JSON.stringify({
      version: 1, keybindings: customBindings, config: customConfig,
    });
    importSettingsFromJson(json);

    const savedKeybindings = JSON.parse(localStorage.getItem(STORAGE_KEY_BINDINGS) ?? '{}');
    expect(savedKeybindings).toEqual(customBindings);

    const savedConfig = JSON.parse(localStorage.getItem(STORAGE_KEY_CONFIG) ?? '{}');
    expect(savedConfig).toEqual(customConfig);
  });
});
