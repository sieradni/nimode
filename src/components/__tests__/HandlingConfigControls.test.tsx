import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { HandlingConfigControls } from '../HandlingConfigControls';
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

describe('HandlingConfigControls', () => {
    let store: GameConfigStore;

    beforeEach(() => {
        vi.stubGlobal('localStorage', createMockStorage());
        store = new GameConfigStore();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should render DAS, ARR, and SDF sliders with current values', () => {
        render(<HandlingConfigControls store={store} />);
        const dasSlider = screen.getByLabelText('DAS') as HTMLInputElement;
        const arrSlider = screen.getByLabelText('ARR') as HTMLInputElement;
        const sdfSlider = screen.getByLabelText('SDF') as HTMLInputElement;
        expect(dasSlider.value).toBe(String(DEFAULT_CONFIG.das));
        expect(arrSlider.value).toBe(String(DEFAULT_CONFIG.arr));
        expect(sdfSlider.value).toBe(String(DEFAULT_CONFIG.sdf));
    });

    it('should call store.setHandling when DAS slider changes', () => {
        const spy = vi.spyOn(store, 'setHandling');
        render(<HandlingConfigControls store={store} />);
        const slider = screen.getByLabelText('DAS') as HTMLInputElement;
        fireEvent.change(slider, { target: { value: '180' } });
        expect(spy).toHaveBeenCalledWith(180, DEFAULT_CONFIG.arr, DEFAULT_CONFIG.sdf);
    });

    it('should call store.setHandling when ARR slider changes', () => {
        const spy = vi.spyOn(store, 'setHandling');
        render(<HandlingConfigControls store={store} />);
        const slider = screen.getByLabelText('ARR') as HTMLInputElement;
        fireEvent.change(slider, { target: { value: '25' } });
        expect(spy).toHaveBeenCalledWith(DEFAULT_CONFIG.das, 25, DEFAULT_CONFIG.sdf);
    });

    it('should call store.setHandling when SDF slider changes', () => {
        const spy = vi.spyOn(store, 'setHandling');
        render(<HandlingConfigControls store={store} />);
        const slider = screen.getByLabelText('SDF') as HTMLInputElement;
        fireEvent.change(slider, { target: { value: '90' } });
        expect(spy).toHaveBeenCalledWith(DEFAULT_CONFIG.das, DEFAULT_CONFIG.arr, 90);
    });

    it('should update display when store changes externally', () => {
        render(<HandlingConfigControls store={store} />);
        const dasSlider = screen.getByLabelText('DAS') as HTMLInputElement;
        expect(dasSlider.value).toBe(String(DEFAULT_CONFIG.das));

        act(() => store.setHandling(220, 10, 80));
        expect(dasSlider.value).toBe('220');
    });

    it('should render number inputs that reflect DAS, ARR, and SDF values', () => {
        render(<HandlingConfigControls store={store} />);
        const dasNumber = screen.getByLabelText('DAS value') as HTMLInputElement;
        const arrNumber = screen.getByLabelText('ARR value') as HTMLInputElement;
        const sdfNumber = screen.getByLabelText('SDF value') as HTMLInputElement;
        expect(dasNumber.value).toBe(String(DEFAULT_CONFIG.das));
        expect(arrNumber.value).toBe(String(DEFAULT_CONFIG.arr));
        expect(sdfNumber.value).toBe(String(DEFAULT_CONFIG.sdf));
    });
});
