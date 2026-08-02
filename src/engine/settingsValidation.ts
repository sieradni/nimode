import { KeyBindings, GameConfig, DEFAULT_KEYBINDINGS, DEFAULT_CONFIG, PieceType } from './types';

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

export function isValidGameConfig(value: unknown): value is GameConfig {
  if (!isRecord(value)) return false;
  for (const key of CONFIG_NUMERIC_KEYS) {
    if (typeof value[key] !== 'number') return false;
  }
  if (typeof value.subzero !== 'boolean') return false;
  if (value.queue !== undefined && !isValidQueue(value.queue)) return false;
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

export function validateSettingsJson(data: unknown): data is { version: number; keybindings: KeyBindings; config?: GameConfig } {
  if (!isRecord(data)) return false;
  if (typeof data.version !== 'number') return false;
  if (!isValidKeyBindings(data.keybindings)) return false;
  if (data.config !== undefined && !isValidGameConfig(data.config)) return false;
  return true;
}

export { mergeBindings, mergeConfig };