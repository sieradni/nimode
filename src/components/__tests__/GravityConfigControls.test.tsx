import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GravityConfigControls } from '../GravityConfigControls';
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

describe('GravityConfigControls', () => {
  let store: GameConfigStore;

  beforeEach(() => {
    vi.stubGlobal('localStorage', createMockStorage());
    store = new GameConfigStore();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should render gravity slider with current value', () => {
    render(<GravityConfigControls store={store} />);
    const slider = screen.getByLabelText('Gravity') as HTMLInputElement;
    expect(slider.value).toBe(String(DEFAULT_CONFIG.gravity));
  });

  it('should render subzero checkbox reflecting current state', () => {
    render(<GravityConfigControls store={store} />);
    const checkbox = screen.getByLabelText('Subzero') as HTMLInputElement;
    expect(checkbox.checked).toBe(DEFAULT_CONFIG.subzero);
  });

  it('should call store.setGravity when slider changes', () => {
    const spy = vi.spyOn(store, 'setGravity');
    render(<GravityConfigControls store={store} />);
    const slider = screen.getByLabelText('Gravity') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '15' } });
    expect(spy).toHaveBeenCalledWith(15);
  });

  it('should call store.setSubzero when checkbox is toggled', () => {
    const spy = vi.spyOn(store, 'setSubzero');
    render(<GravityConfigControls store={store} />);
    const checkbox = screen.getByLabelText('Subzero') as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(spy).toHaveBeenCalledWith(true);
  });

  it('should update display when store changes externally', () => {
    render(<GravityConfigControls store={store} />);
    const slider = screen.getByLabelText('Gravity') as HTMLInputElement;
    expect(slider.value).toBe(String(DEFAULT_CONFIG.gravity));

    act(() => store.setGravity(10));
    expect(slider.value).toBe('10');
  });

  it('should render number input that reflects gravity value', () => {
    render(<GravityConfigControls store={store} />);
    const numberInput = screen.getByLabelText('Gravity value') as HTMLInputElement;
    expect(numberInput.value).toBe(String(DEFAULT_CONFIG.gravity));
  });

  it('should ignore invalid gravity values from number input', () => {
    const spy = vi.spyOn(store, 'setGravity');
    render(<GravityConfigControls store={store} />);
    const numberInput = screen.getByLabelText('Gravity value') as HTMLInputElement;
    fireEvent.change(numberInput, { target: { value: 'abc' } });
    expect(spy).not.toHaveBeenCalled();
  });
});
