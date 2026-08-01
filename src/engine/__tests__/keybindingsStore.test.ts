import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KeybindingsStore } from '../keybindingsStore';
import { DEFAULT_KEYBINDINGS, type KeyBindings } from '../types';

const STORAGE_KEY = 'nimode_keybindings';

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

describe('KeybindingsStore', () => {
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockLocalStorage = createMockStorage();
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  it('should load defaults when no saved data exists', () => {
    const store = new KeybindingsStore();
    expect(store.getBindings()).toEqual(DEFAULT_KEYBINDINGS);
  });

  it('should get a specific binding', () => {
    const store = new KeybindingsStore();
    expect(store.getBinding('HARD_DROP')).toBe('ArrowUp');
  });

  it('should set a binding and persist it to localStorage', () => {
    const store = new KeybindingsStore();
    store.setBinding('MOVE_LEFT', 'KeyA');

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.MOVE_LEFT).toBe('KeyA');

    const store2 = new KeybindingsStore();
    expect(store2.getBinding('MOVE_LEFT')).toBe('KeyA');
  });

  it('should throw when setting a binding with a duplicate key', () => {
    const store = new KeybindingsStore();
    store.setBinding('MOVE_RIGHT', 'KeyB');

    expect(() => store.setBinding('MOVE_LEFT', 'KeyB')).toThrow();
  });

  it('should reset a single binding to default', () => {
    const store = new KeybindingsStore();
    store.setBinding('SOFT_DROP', 'KeyS');
    expect(store.getBinding('SOFT_DROP')).toBe('KeyS');

    store.resetBinding('SOFT_DROP');
    expect(store.getBinding('SOFT_DROP')).toBe(DEFAULT_KEYBINDINGS.SOFT_DROP);
  });

  it('should reset all bindings to defaults', () => {
    const store = new KeybindingsStore();
    store.setBinding('MOVE_LEFT', 'KeyA');
    store.setBinding('MOVE_RIGHT', 'KeyD');
    store.setBinding('SOFT_DROP', 'KeyS');

    store.resetAllBindings();
    expect(store.getBindings()).toEqual(DEFAULT_KEYBINDINGS);
  });

  it('should map a KeyboardEvent to the correct InputAction', () => {
    const store = new KeybindingsStore();

    const event = { code: 'ArrowLeft' };
    expect(store.resolveAction(event as KeyboardEvent)).toBe('MOVE_LEFT');

    const unknownEvent = { code: 'KeyQ' };
    expect(store.resolveAction(unknownEvent as KeyboardEvent)).toBeNull();
  });

  it('should save to localStorage on setBinding and resetBinding and resetAllBindings', () => {
    const store = new KeybindingsStore();
    const spy = vi.spyOn(mockLocalStorage, 'setItem');

    store.setBinding('ROTATE_CW', 'KeyA');
    expect(spy).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));

    store.resetBinding('ROTATE_CW');
    expect(spy).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));

    store.resetAllBindings();
    expect(spy).toHaveBeenCalledWith(STORAGE_KEY, expect.any(String));
  });

  it('setAllBindings replaces all bindings in memory and persists them', () => {
    const store = new KeybindingsStore();
    store.setBinding('MOVE_LEFT', 'KeyA');

    const imported: KeyBindings = { ...DEFAULT_KEYBINDINGS, MOVE_LEFT: 'KeyQ', HARD_DROP: 'Space' };
    store.setAllBindings(imported);

    expect(store.getBindings()).toEqual(imported);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.MOVE_LEFT).toBe('KeyQ');

    const store2 = new KeybindingsStore();
    expect(store2.getBinding('MOVE_LEFT')).toBe('KeyQ');
  });
});
