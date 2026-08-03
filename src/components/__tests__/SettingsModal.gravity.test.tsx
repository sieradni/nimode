import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SettingsModal } from '../SettingsModal';
import { GameConfigStore } from '../../engine/configStore';
import { DEFAULT_CONFIG } from '../../engine/types';

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

describe('SettingsModal gravity controls', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMockStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render gravity slider when open', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} configStore={new GameConfigStore()} />);
    const slider = screen.getByLabelText('Gravity') as HTMLInputElement;
    expect(slider.value).toBe(String(DEFAULT_CONFIG.gravity));
  });

  it('should render subzero checkbox when open', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} configStore={new GameConfigStore()} />);
    const checkbox = screen.getByLabelText('Subzero') as HTMLInputElement;
    expect(checkbox.checked).toBe(DEFAULT_CONFIG.subzero);
  });

  it('should persist gravity change through configStore', () => {
    const store = new GameConfigStore();
    render(<SettingsModal isOpen={true} onClose={() => {}} configStore={store} />);
    const slider = screen.getByLabelText('Gravity') as HTMLInputElement;

    fireEvent.change(slider, { target: { value: '20' } });
    expect(store.getConfig().gravity).toBe(20);
    expect(localStorage.getItem('nimode_config')).toContain('"gravity":20');
  });

  it('should persist subzero change through configStore', () => {
    const store = new GameConfigStore();
    render(<SettingsModal isOpen={true} onClose={() => {}} configStore={store} />);
    const checkbox = screen.getByLabelText('Subzero') as HTMLInputElement;

    fireEvent.click(checkbox);
    expect(store.getConfig().subzero).toBe(false);
    expect(localStorage.getItem('nimode_config')).toContain('"subzero":false');
  });
});
