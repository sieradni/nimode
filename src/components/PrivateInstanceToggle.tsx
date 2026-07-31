import { useState, useEffect, useCallback } from 'react';
import type { InstanceConfigStore } from '../p2p/InstanceConfigStore';

interface PrivateInstanceToggleProps {
  configStore: InstanceConfigStore;
}

export function PrivateInstanceToggle({ configStore }: PrivateInstanceToggleProps) {
  const [isPrivate, setIsPrivate] = useState(() => configStore.getConfig().isPrivate);

  const handleConfigChange = useCallback(() => {
    setIsPrivate(configStore.getConfig().isPrivate);
  }, [configStore]);

  useEffect(() => {
    configStore.subscribe(handleConfigChange);
    return () => configStore.unsubscribe(handleConfigChange);
  }, [configStore, handleConfigChange]);

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded bg-slate-800 mb-4">
      <div>
        <div className="text-sm text-slate-300">Private Instance</div>
        <div className="text-xs text-slate-500">Hide my game from spectators</div>
      </div>
      <input
        type="checkbox"
        aria-label="Private Instance"
        checked={isPrivate}
        onChange={(e) => configStore.setPrivate(e.target.checked)}
        className="h-4 w-4"
      />
    </div>
  );
}
