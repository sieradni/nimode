import { KeyBindings, GameConfig, DEFAULT_CONFIG, PieceType } from './types';
import { validateSettingsJson, isValidGameConfig, mergeBindings, mergeConfig } from './settingsValidation';

export { validateSettingsJson } from './settingsValidation';

export interface SettingsExport {
  version: number;
  keybindings: KeyBindings;
  config?: GameConfig;
}

const STORAGE_KEY_BINDINGS = 'nimode_keybindings';
const STORAGE_KEY_CONFIG = 'nimode_config';

export function exportSettingsAsJson(
  keybindings: KeyBindings,
  config?: GameConfig,
): string {
  const payload: SettingsExport = { version: 1, keybindings: { ...keybindings } };
  if (config) {
    payload.config = { ...config };
  }
  return JSON.stringify(payload, null, 2);
}

export function importSettingsFromJson(json: string): SettingsExport | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }

  if (!validateSettingsJson(parsed)) return null;

  const mergedBindings = mergeBindings(parsed.keybindings);
  localStorage.setItem(STORAGE_KEY_BINDINGS, JSON.stringify(mergedBindings));

  if (parsed.config) {
    const mergedCfg = mergeConfig(parsed.config);
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(mergedCfg));
  }

  return { version: parsed.version, keybindings: mergedBindings, config: parsed.config };
}

export interface DownloadResult {
  url: string;
  filename: string;
}

export function downloadSettingsBlob(json: string): DownloadResult {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const timestamp = Date.now();
  const filename = `nimode-settings-${timestamp}.json`;
  return { url, filename };
}

export function loadConfigFromStorage(): GameConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (null === raw) return { ...DEFAULT_CONFIG };
    const parsed: unknown = JSON.parse(raw);
    if (isValidGameConfig(parsed)) {
      const merged = { ...DEFAULT_CONFIG, ...parsed };
      if (Array.isArray(merged.queue)) {
        merged.queue = merged.queue.filter(
          (q: unknown) => typeof q === 'number' && q >= 0 && q <= 7,
        ) as PieceType[];
      } else {
        merged.queue = DEFAULT_CONFIG.queue;
      }
      return merged;
    }
    return { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfigToStorage(config: GameConfig): void {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
}