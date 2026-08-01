import { useState, useEffect, useCallback, useRef } from 'react';
import { keybindingsStore } from '../engine/keybindingsStore';
import { InputAction } from '../engine/types';
import { exportSettingsAsJson, downloadSettingsBlob, importSettingsFromJson } from '../engine/settingsIO';
import { ACTION_LABELS, ALL_ACTIONS } from '../engine/settingsConstants';
import { InstanceConfigStore, instanceConfigStore } from '../p2p/InstanceConfigStore';
import { PrivateInstanceToggle } from './PrivateInstanceToggle';
import { GravityConfigControls } from './GravityConfigControls';
import { GameConfigStore, configStore } from '../engine/configStore';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceConfigStore?: InstanceConfigStore;
  configStore?: GameConfigStore;
}

export function SettingsModal({ isOpen, onClose, instanceConfigStore: instanceConfigStoreProp, configStore: configStoreProp }: SettingsModalProps) {
  const instanceStore = instanceConfigStoreProp ?? instanceConfigStore;
  const gameConfigStore = configStoreProp ?? configStore;
  const [listeningAction, setListeningAction] = useState<InputAction | null>(null);
  const [bindings, setBindings] = useState(keybindingsStore.getBindings());
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshBindings = useCallback(() => {
    setBindings(keybindingsStore.getBindings());
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!listeningAction) return;
    e.preventDefault();
    try {
      keybindingsStore.setBinding(listeningAction, e.code);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
    setListeningAction(null);
    refreshBindings();
  }, [listeningAction, refreshBindings]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleResetAll = () => {
    keybindingsStore.resetAllBindings();
    refreshBindings();
    setError(null);
  };

  const handleExport = () => {
    const json = exportSettingsAsJson(bindings);
    const { url, filename } = downloadSettingsBlob(json);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = importSettingsFromJson(reader.result as string);
      if (result) {
        refreshBindings();
        setError(null);
      } else {
        setError('Invalid settings file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-sky-400">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200" aria-label="Close">✕</button>
        </div>
        <PrivateInstanceToggle configStore={instanceStore} />
        <GravityConfigControls store={gameConfigStore} />
        <div className="space-y-1 mb-4">
          {ALL_ACTIONS.map((action) => {
            const isListening = listeningAction === action;
            const key = bindings[action];
            return (
              <div
                key={action}
                className="flex items-center justify-between px-3 py-2 rounded bg-slate-800 cursor-pointer hover:bg-slate-700"
                onClick={() => { setListeningAction(action); setError(null); }}
              >
                <span className="text-sm text-slate-300">{ACTION_LABELS[action]}</span>
                <span className={`text-sm font-mono ${isListening ? 'text-yellow-400 animate-pulse' : 'text-sky-300'}`}>
                  {isListening ? 'Press a key...' : key}
                </span>
              </div>
            );
          })}
        </div>
        {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
        <div className="flex flex-wrap gap-2">
          <button onClick={handleResetAll} className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200">Reset All</button>
          <button onClick={handleExport} className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200">Export</button>
          <button onClick={handleImport} className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200">Import</button>
        </div>
        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  );
}
