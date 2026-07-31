import { useEffect, useState } from 'react';
import { EngineCore } from './engine/EngineCore';
import { sevenBagRandomizer } from './engine/systems/SevenBagRandomizer';
import { srsPlusRotationSystem } from './engine/systems/SrsPlusRotationSystem';
import { EngineState } from './engine/interfaces/IEngineCore';
import { SettingsModal } from './components/SettingsModal';
import { GameCanvas } from './components/GameCanvas';
import { createDiscordSdk } from './discord/sdk';
import { getDiscordClientId } from './discord/config';
import { useDiscordAuth } from './discord/useDiscordAuth';

function App() {
  const [engine] = useState(
    () =>
      new EngineCore({
        rotationSystem: srsPlusRotationSystem,
        bagRandomizer: sevenBagRandomizer,
      })
  );

  const [sdk] = useState(() => createDiscordSdk(getDiscordClientId()));
  const discordAuth = useDiscordAuth(sdk);

  const [gameState, setGameState] = useState<EngineState>(() => engine.getState());
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      engine.tick(dt);
      setGameState(engine.getState());
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [engine]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono">
      <header className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/80">
        <h1 className="text-xl font-bold text-sky-400">nimode</h1>
        <div className="flex items-center gap-3">
          <div className="text-xs text-slate-400">Modern Tetris Engine Active</div>
          {discordAuth.status === 'connecting' && (
            <div className="text-xs text-slate-400">Connecting to Discord...</div>
          )}
          {discordAuth.status === 'authenticated' && (
            <div className="text-xs text-emerald-400">Connected: {discordAuth.auth.userId}</div>
          )}
          {discordAuth.status === 'unavailable' && (
            <div className="text-xs text-slate-400">Standalone mode</div>
          )}
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-slate-400 hover:text-sky-400 transition-colors"
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </header>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <GameCanvas state={gameState} />
      </main>
    </div>
  );
}

export default App;
