import { useState, useEffect, useCallback } from 'react';
import { GameConfigStore } from '../engine/configStore';

interface GravityConfigControlsProps {
  store: GameConfigStore;
}

export function GravityConfigControls({ store }: GravityConfigControlsProps) {
  const [config, setConfig] = useState(() => store.getConfig());

  const refresh = useCallback(() => {
    setConfig(store.getConfig());
  }, [store]);

  useEffect(() => {
    store.subscribe(refresh);
    return () => store.unsubscribe(refresh);
  }, [store, refresh]);

  const handleGravityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!Number.isNaN(value) && value >= 0 && value <= 20) {
      store.setGravity(value);
    }
  };

  const handleSubzeroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    store.setSubzero(e.target.checked);
  };

  return (
    <div className="mb-4 space-y-3">
      <div>
        <label className="block text-sm text-slate-300 mb-1">
          Gravity: {config.gravity}G
        </label>
        <input
          type="range"
          min={0}
          max={20}
          value={config.gravity}
          onChange={handleGravityChange}
          className="w-full"
          aria-label="Gravity"
        />
        <input
          type="number"
          min={0}
          max={20}
          value={config.gravity}
          onChange={handleGravityChange}
          className="w-16 mt-1 px-1 py-0.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200"
          aria-label="Gravity value"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="subzero"
          checked={config.subzero}
          onChange={handleSubzeroChange}
          className="form-checkbox"
          aria-label="Subzero"
        />
        <label htmlFor="subzero" className="text-sm text-slate-300">
          Subzero (no lock-on-contact, lock on hard drop only)
        </label>
      </div>
    </div>
  );
}
