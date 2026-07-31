import { useEffect, useRef, useState } from 'react';
import { EngineCore } from './engine/EngineCore';
import { sevenBagRandomizer } from './engine/systems/SevenBagRandomizer';
import { srsPlusRotationSystem } from './engine/systems/SrsPlusRotationSystem';
import { EngineState } from './engine/interfaces/IEngineCore';
import { SettingsModal } from './components/SettingsModal';
import { GameCanvas } from './components/GameCanvas';
import { KeyboardInputAdapter } from './engine/keyboardInput';
import { createDiscordSdk } from './discord/sdk';
import { getDiscordClientId } from './discord/config';
import { useDiscordAuth } from './discord/useDiscordAuth';
import { usePeerSession } from './p2p/usePeerSession';
import { instanceConfigStore } from './p2p/InstanceConfigStore';
import { PresenceRoster } from './components/PresenceRoster';
import { SpectatorBoardCanvas } from './components/canvas/SpectatorBoardCanvas';

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

  const instanceId = discordAuth.status === 'authenticated' ? discordAuth.auth.instanceId : null;
  const userId = discordAuth.status === 'authenticated' ? discordAuth.auth.userId : 'local-player';
  const peerSession = usePeerSession({
    instanceId,
    userId,
    engine,
    configStore: instanceConfigStore,
  });

  const [gameState, setGameState] = useState<EngineState>(() => engine.getState());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsOpenRef = useRef(false);

  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      if (peerSession.view !== 'LOCAL_ACTIVE') return;
      const dt = time - lastTime;
      lastTime = time;
      engine.tick(dt);
      setGameState(engine.getState());
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [engine, peerSession.view]);

  useEffect(() => {
    settingsOpenRef.current = settingsOpen;
  }, [settingsOpen]);

  useEffect(() => {
    const adapter = new KeyboardInputAdapter({
      onInput: (event) => engine.handleInput(event),
      isEnabled: () => !settingsOpenRef.current,
    });
    adapter.attach();
    return () => adapter.detach();
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
        {peerSession.connectionError && (
          <div className="text-xs text-red-400">P2P error: {peerSession.connectionError}</div>
        )}
        <div className="flex gap-8 items-start">
          {peerSession.view === 'LOCAL_ACTIVE' ? (
            <GameCanvas state={gameState} />
          ) : (
            peerSession.spectatorBuffer && (
              <div className="flex gap-8 items-start">
                <SpectatorBoardCanvas buffer={peerSession.spectatorBuffer} />
                <button
                  onClick={peerSession.returnToLocal}
                  className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 text-slate-200"
                >
                  Return to My Board
                </button>
              </div>
            )
          )}
          {peerSession.peerManager && (
            <PresenceRoster
              peerManager={peerSession.peerManager}
              instanceConfigStore={instanceConfigStore}
              localUserId={userId}
              localDisplayName={userId}
              localPps={gameState.stats.pps}
              onSelectParticipant={peerSession.selectTarget}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
