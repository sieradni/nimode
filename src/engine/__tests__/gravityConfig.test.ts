import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, DEFAULT_KEYBINDINGS, GameConfig } from '../types';
import { validateSettingsJson, importSettingsFromJson, loadConfigFromStorage } from '../settingsIO';

describe('GameConfig gravity & subzero fields', () => {
  it('DEFAULT_CONFIG should include gravity defaulting to 1', () => {
    expect(DEFAULT_CONFIG.gravity).toBe(1);
  });

  it('DEFAULT_CONFIG should include subzero defaulting to false', () => {
    expect(DEFAULT_CONFIG.subzero).toBe(false);
  });

  it('GameConfig type should accept gravity in range 0-20', () => {
    const config: GameConfig = { ...DEFAULT_CONFIG, gravity: 0 };
    expect(config.gravity).toBe(0);

    const config20: GameConfig = { ...DEFAULT_CONFIG, gravity: 20 };
    expect(config20.gravity).toBe(20);
  });

  it('GameConfig type should accept subzero as boolean', () => {
    const config: GameConfig = { ...DEFAULT_CONFIG, subzero: true };
    expect(config.subzero).toBe(true);
  });

  it('isValidGameConfig should reject non-number gravity', () => {
    const badConfig = { ...DEFAULT_CONFIG, gravity: 'fast' };
    expect(validateSettingsJson({
      version: 1, keybindings: DEFAULT_KEYBINDINGS, config: badConfig,
    })).toBe(false);
  });

  it('isValidGameConfig should reject non-boolean subzero', () => {
    const badConfig = { ...DEFAULT_CONFIG, subzero: 'yes' };
    expect(validateSettingsJson({
      version: 1, keybindings: DEFAULT_KEYBINDINGS, config: badConfig,
    })).toBe(false);
  });

  it('isValidGameConfig should accept valid gravity and subzero', () => {
    const goodConfig: GameConfig = { ...DEFAULT_CONFIG, gravity: 15, subzero: true };
    expect(validateSettingsJson({
      version: 1, keybindings: DEFAULT_KEYBINDINGS, config: goodConfig,
    })).toBe(true);
  });

  it('loadConfigFromStorage should return DEFAULT_CONFIG when no stored config', () => {
    localStorage.clear();
    const loaded = loadConfigFromStorage();
    expect(loaded.gravity).toBe(DEFAULT_CONFIG.gravity);
    expect(loaded.subzero).toBe(DEFAULT_CONFIG.subzero);
  });

  it('importSettingsFromJson should persist gravity and subzero', () => {
    localStorage.clear();
    const json = JSON.stringify({
      version: 1,
      keybindings: DEFAULT_KEYBINDINGS,
      config: { ...DEFAULT_CONFIG, gravity: 15, subzero: true },
    });
    const result = importSettingsFromJson(json);
    expect(result).not.toBeNull();
    expect(result?.config?.gravity).toBe(15);
    expect(result?.config?.subzero).toBe(true);

    const loaded = loadConfigFromStorage();
    expect(loaded.gravity).toBe(15);
    expect(loaded.subzero).toBe(true);
  });
});
