import { useState, useEffect, useCallback } from 'react';
import { GameConfigStore } from '../engine/configStore';

interface HandlingConfigControlsProps {
    store: GameConfigStore;
}

export function HandlingConfigControls({ store }: HandlingConfigControlsProps) {
    const [config, setConfig] = useState(() => store.getConfig());

    const refresh = useCallback(() => {
        setConfig(store.getConfig());
    }, [store]);

    useEffect(() => {
        store.subscribe(refresh);
        return () => store.unsubscribe(refresh);
    }, [store, refresh]);

    const handleDASChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!Number.isNaN(value) && value >= 0 && value <= 1000) {
            store.setHandling(value, config.arr, config.sdf);
        }
    };

    const handleARRChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!Number.isNaN(value) && value >= 0 && value <= 500) {
            store.setHandling(config.das, value, config.sdf);
        }
    };

    const handleSDFFactorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!Number.isNaN(value) && value >= 0 && value <= 100) {
            store.setSdfFactor(value);
        }
    };

    return (
        <div className="mb-4 space-y-4 border-t border-slate-800 pt-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Handling</h3>

            <div>
                <label className="block text-xs text-slate-300 mb-1">
                    DAS (Delayed Auto Shift): {config.das}ms
                </label>
                <div className="flex gap-4 items-center">
                    <input
                        type="range"
                        min={50}
                        max={300}
                        value={config.das}
                        onChange={handleDASChange}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        aria-label="DAS"
                    />
                    <input
                        type="number"
                        min={50}
                        max={300}
                        value={config.das}
                        onChange={handleDASChange}
                        className="w-20 px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200"
                        aria-label="DAS value"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs text-slate-300 mb-1">
                    ARR (Auto Repeat Rate): {config.arr}ms
                </label>
                <div className="flex gap-4 items-center">
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={config.arr}
                        onChange={handleARRChange}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        aria-label="ARR"
                    />
                    <input
                        type="number"
                        min={0}
                        max={100}
                        value={config.arr}
                        onChange={handleARRChange}
                        className="w-20 px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200"
                        aria-label="ARR value"
                    />
                </div>
            </div>

            <div>
                <label className="block text-xs text-slate-300 mb-1">
                    SDF Factor (Soft Drop Acceleration): {config.sdfFactor}
                </label>
                <div className="flex gap-4 items-center">
                    <input
                        type="range"
                        min={0}
                        max={100}
                        value={config.sdfFactor}
                        onChange={handleSDFFactorChange}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                        aria-label="SDF Factor"
                    />
                    <input
                        type="number"
                        min={0}
                        max={100}
                        value={config.sdfFactor}
                        onChange={handleSDFFactorChange}
                        className="w-20 px-2 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200"
                        aria-label="SDF Factor value"
                    />
                </div>
            </div>
        </div>
    );
}
