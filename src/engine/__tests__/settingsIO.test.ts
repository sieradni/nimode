import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  exportSettingsAsJson,
  validateSettingsJson,
  downloadSettingsBlob,
} from '../settingsIO';
import { DEFAULT_KEYBINDINGS, DEFAULT_CONFIG, KeyBindings } from '../types';

describe('validateSettingsJson', () => {
  it('should accept valid full settings', () => {
    const data: unknown = {
      version: 1,
      keybindings: DEFAULT_KEYBINDINGS,
      config: DEFAULT_CONFIG,
    };
    expect(validateSettingsJson(data)).toBe(true);
  });

  it('should reject null', () => {
    expect(validateSettingsJson(null)).toBe(false);
  });

  it('should reject non-object', () => {
    expect(validateSettingsJson('string')).toBe(false);
    expect(validateSettingsJson(42)).toBe(false);
    expect(validateSettingsJson([])).toBe(false);
  });

  it('should reject missing version', () => {
    expect(validateSettingsJson({ keybindings: DEFAULT_KEYBINDINGS })).toBe(false);
  });

  it('should reject missing keybindings', () => {
    expect(validateSettingsJson({ version: 1, config: DEFAULT_CONFIG })).toBe(false);
  });

  it('should reject keybindings with missing actions', () => {
    const partial = { ...DEFAULT_KEYBINDINGS };
    delete (partial as Partial<KeyBindings>).MOVE_LEFT;
    expect(validateSettingsJson({
      version: 1, keybindings: partial, config: DEFAULT_CONFIG,
    })).toBe(false);
  });

  it('should reject keybindings with non-string values', () => {
    expect(validateSettingsJson({
      version: 1,
      keybindings: { ...DEFAULT_KEYBINDINGS, MOVE_LEFT: 123 },
      config: DEFAULT_CONFIG,
    })).toBe(false);
  });

  it('should accept settings with only keybindings (no config)', () => {
    expect(validateSettingsJson({ version: 1, keybindings: DEFAULT_KEYBINDINGS })).toBe(true);
  });
});

describe('exportSettingsAsJson', () => {
  it('should produce valid JSON string', () => {
    const json = exportSettingsAsJson(DEFAULT_KEYBINDINGS, DEFAULT_CONFIG);
    const parsed = JSON.parse(json);
    expect(parsed.version).toBe(1);
    expect(parsed.keybindings).toEqual(DEFAULT_KEYBINDINGS);
    expect(parsed.config).toEqual(DEFAULT_CONFIG);
  });

  it('should include config when provided', () => {
    const json = exportSettingsAsJson(DEFAULT_KEYBINDINGS, DEFAULT_CONFIG);
    const parsed = JSON.parse(json);
    expect(parsed.config).toEqual(DEFAULT_CONFIG);
  });

  it('should work with custom keybindings', () => {
    const custom: KeyBindings = { ...DEFAULT_KEYBINDINGS, MOVE_LEFT: 'KeyA' };
    const json = exportSettingsAsJson(custom, DEFAULT_CONFIG);
    const parsed = JSON.parse(json);
    expect(parsed.keybindings.MOVE_LEFT).toBe('KeyA');
  });
});

describe('downloadSettingsBlob', () => {
  beforeEach(() => {
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
    });
  });

  it('should create a Blob and return an object URL', () => {
    const json = '{"test":true}';
    const result = downloadSettingsBlob(json);
    expect(result).toHaveProperty('url');
    expect(result).toHaveProperty('filename');
    expect(result.filename).toMatch(/^nimode-settings-\d+\.json$/);
  });
});
