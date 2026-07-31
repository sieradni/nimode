import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SettingsModal } from './SettingsModal';
import { InstanceConfigStore } from '../p2p/InstanceConfigStore';
import { keybindingsStore } from '../engine/keybindingsStore';
import { DEFAULT_KEYBINDINGS } from '../engine/types';
import { ACTION_LABELS } from '../engine/settingsConstants';

function createMockStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k of Object.keys(store)) delete store[k]; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

describe('SettingsModal', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMockStorage());
    const store = keybindingsStore as unknown as { bindings: Record<string, string> };
    store.bindings = { ...DEFAULT_KEYBINDINGS };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render nothing when isOpen is false', () => {
    const { container } = render(<SettingsModal isOpen={false} onClose={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('should render keybinding rows when open', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    for (const label of Object.values(ACTION_LABELS)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('should show current key values for each action', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const keys = Object.values(DEFAULT_KEYBINDINGS);
    for (const key of keys) {
      const matches = screen.getAllByText(key);
      expect(matches.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('should show close button', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<SettingsModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should show reset all button', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /reset all/i })).toBeInTheDocument();
  });

  it('should show export button', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
  });

  it('should show import button', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByRole('button', { name: /import/i })).toBeInTheDocument();
  });

  it('should enter listening mode when a keybinding row is clicked', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const moveLeftText = screen.getByText(ACTION_LABELS.MOVE_LEFT);
    fireEvent.click(moveLeftText);
    expect(screen.getByText(/press a key/i)).toBeInTheDocument();
  });

  it('should update keybinding after listening mode keypress', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    const moveLeftText = screen.getByText(ACTION_LABELS.MOVE_LEFT);
    fireEvent.click(moveLeftText);
    fireEvent.keyDown(window, { code: 'KeyA' });
    expect(screen.getByText('KeyA')).toBeInTheDocument();
    expect(keybindingsStore.getBinding('MOVE_LEFT')).toBe('KeyA');
  });

  it('should show error when duplicate key is assigned', () => {
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByText(ACTION_LABELS.MOVE_LEFT));
    fireEvent.keyDown(window, { code: 'KeyC' });
    expect(screen.getByText(/already bound/i)).toBeInTheDocument();
  });

  it('should reset all bindings when reset all is clicked', () => {
    keybindingsStore.setBinding('MOVE_LEFT', 'KeyA');
    render(<SettingsModal isOpen={true} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /reset all/i }));
    expect(keybindingsStore.getBinding('MOVE_LEFT')).toBe(DEFAULT_KEYBINDINGS.MOVE_LEFT);
  });

  it('should render a private instance toggle when open', () => {
    const store = new InstanceConfigStore();
    render(<SettingsModal isOpen={true} onClose={() => {}} instanceConfigStore={store} />);
    expect(screen.getByRole('checkbox', { name: /private/i })).toBeInTheDocument();
  });

  it('should render private toggle unchecked when config is public', () => {
    const store = new InstanceConfigStore();
    render(<SettingsModal isOpen={true} onClose={() => {}} instanceConfigStore={store} />);
    expect(screen.getByRole('checkbox', { name: /private/i })).not.toBeChecked();
  });

  it('should persist private toggle to localStorage when clicked', () => {
    const store = new InstanceConfigStore();
    render(<SettingsModal isOpen={true} onClose={() => {}} instanceConfigStore={store} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /private/i }));

    expect(store.getConfig().isPrivate).toBe(true);
    expect(localStorage.getItem('nimode_instance_config')).toContain('"isPrivate":true');
  });

  it('should reflect a pre-privatized store', () => {
    const store = new InstanceConfigStore();
    store.setPrivate(true);
    render(<SettingsModal isOpen={true} onClose={() => {}} instanceConfigStore={store} />);
    expect(screen.getByRole('checkbox', { name: /private/i })).toBeChecked();
  });

  it('should update checkbox when store privacy changes externally after mount', () => {
    const store = new InstanceConfigStore();
    render(<SettingsModal isOpen={true} onClose={() => {}} instanceConfigStore={store} />);
    const checkbox = screen.getByRole('checkbox', { name: /private/i });
    expect(checkbox).not.toBeChecked();

    act(() => store.setPrivate(true));
    expect(checkbox).toBeChecked();

    act(() => store.setPrivate(false));
    expect(checkbox).not.toBeChecked();
  });
});
