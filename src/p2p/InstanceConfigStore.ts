import { InstanceConfig, DEFAULT_INSTANCE_CONFIG } from '../engine/types/instance';

const STORAGE_KEY = 'nimode_instance_config';

function loadFromStorage(): InstanceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return { ...DEFAULT_INSTANCE_CONFIG };
    }
    const parsed: Record<string, unknown> = JSON.parse(raw);
    if (typeof parsed.isPrivate !== 'boolean') {
      return { ...DEFAULT_INSTANCE_CONFIG };
    }
    return { isPrivate: parsed.isPrivate };
  } catch (_err: unknown) {
    return { ...DEFAULT_INSTANCE_CONFIG };
  }
}

function saveToStorage(config: InstanceConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export class InstanceConfigStore {
  private config: InstanceConfig;
  private readonly listeners = new Set<() => void>();

  constructor() {
    this.config = loadFromStorage();
  }

  getConfig(): InstanceConfig {
    return { ...this.config };
  }

  setPrivate(isPrivate: boolean): void {
    this.config = { isPrivate };
    saveToStorage(this.config);
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

export const instanceConfigStore = new InstanceConfigStore();
