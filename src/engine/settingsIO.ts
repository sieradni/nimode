import { KeyBindings, GameConfig, DEFAULT_KEYBINDINGS, DEFAULT_CONFIG, PieceType } from './types';

export interface SettingsExport {
  version: number;
  keybindings: KeyBindings;
  config?: GameConfig;
}

const STORAGE_KEY_BINDINGS = 'nimode_keybindings';
const STORAGE_KEY_CONFIG = 'nimode_config';

const REQUIRED_ACTIONS: (keyof KeyBindings)[] = [
  'MOVE_LEFT', 'MOVE_RIGHT', 'SOFT_DROP', 'HARD_DROP',
  'ROTATE_CW', 'ROTATE_CCW', 'ROTATE_180', 'HOLD', 'RESET', 'UNDO', 'REDO',
];

type NumericConfigKey = Exclude<keyof GameConfig, 'subzero' | 'autoColor' | 'queue'>;
const CONFIG_NUMERIC_KEYS: NumericConfigKey[] = [
  'das', 'arr', 'sdf', 'sdfFactor', 'lockDelay', 'maxLockResets', 'gravity', 'spawnOffset',
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidKeyBindings(value: unknown): value is KeyBindings {
  if (!isRecord(value)) return false;
  for (const key of REQUIRED_ACTIONS) {
    if (typeof value[key] !== 'string') return false;
  }
  return true;
}

function isValidQueue(value: unknown): value is PieceType[] {
  if (!Array.isArray(value)) return false;
  for (const item of value) {
    if (typeof item !== 'number' || item < 0 || item > 7) return false;
  }
  return true;
}

/**
 * Validates the shape of a stored/imported config. Keys added after the
 * config was first released are merged from `DEFAULT_CONFIG` (see
 * `loadConfigFromStorage` and `mergeConfig`), so an older config lacking a
 * newer boolean flag still loads — with the flag falling back to its default.
 */
function isValidGameConfig(value: unknown): value is GameConfig {
  if (!isRecord(value)) return false;
  for (const key of CONFIG_NUMERIC_KEYS) {
    if (typeof value[key] !== 'number') return false;
  }
  if (typeof value.subzero !== 'boolean') return false;
  if (value.queue !== undefined && !isValidQueue(value.queue)) return false;
  return true;
}

export function validateSettingsJson(data: unknown): data is SettingsExport {
  if (!isRecord(data)) return false;
  if (typeof data.version !== 'number') return false;
  if (!isValidKeyBindings(data.keybindings)) return false;
  if (data.config !== undefined && !isValidGameConfig(data.config)) return false;
  return true;
}

function mergeBindings(imported: KeyBindings): KeyBindings {
  const result = { ...DEFAULT_KEYBINDINGS };
  for (const key of REQUIRED_ACTIONS) {
    result[key] = imported[key];
  }
  return result;
}

function mergeConfig(imported: GameConfig): GameConfig {
  const result = { ...DEFAULT_CONFIG };
  for (const key of CONFIG_NUMERIC_KEYS) {
    result[key] = imported[key];
  }
  result.subzero = imported.subzero;
  result.autoColor = imported.autoColor ?? DEFAULT_CONFIG.autoColor;
  result.queue = isValidQueue(imported.queue) ? imported.queue : DEFAULT_CONFIG.queue;
  return result;
}

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
