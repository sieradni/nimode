import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { InstanceConfigStore } from '../InstanceConfigStore';
import { DEFAULT_INSTANCE_CONFIG } from '../../engine/types/instance';

const STORAGE_KEY = 'nimode_instance_config';

function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      for (const k of Object.keys(store)) {
        delete store[k];
      }
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

describe('InstanceConfigStore', () => {
  let mockLocalStorage: Storage;

  beforeEach(() => {
    mockLocalStorage = createMockStorage();
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('getConfig() returns default when localStorage is empty', () => {
    const store = new InstanceConfigStore();
    expect(store.getConfig()).toEqual(DEFAULT_INSTANCE_CONFIG);
  });

  it('setPrivate(true) persists to localStorage', () => {
    const store = new InstanceConfigStore();
    store.setPrivate(true);

    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    expect(saved.isPrivate).toBe(true);
  });

  it('getConfig() returns saved config after reload', () => {
    const store1 = new InstanceConfigStore();
    store1.setPrivate(true);

    const store2 = new InstanceConfigStore();
    expect(store2.getConfig().isPrivate).toBe(true);
  });

  it('setPrivate(false) updates config', () => {
    const store = new InstanceConfigStore();
    store.setPrivate(true);
    store.setPrivate(false);

    expect(store.getConfig().isPrivate).toBe(false);
  });

  it('subscribe/unsubscribe calls listener on change', () => {
    const store = new InstanceConfigStore();
    const listener = vi.fn();

    store.subscribe(listener);
    store.setPrivate(true);
    expect(listener).toHaveBeenCalledTimes(1);

    store.unsubscribe(listener);
    store.setPrivate(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('invalid localStorage data falls back to default', () => {
    localStorage.setItem(STORAGE_KEY, 'not valid json');
    const store = new InstanceConfigStore();
    expect(store.getConfig()).toEqual(DEFAULT_INSTANCE_CONFIG);
  });
});
