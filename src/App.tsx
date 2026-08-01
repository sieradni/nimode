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
import { configStore } from './engine/configStore';
import { PresenceRoster } from './components/PresenceRoster';
import { SpectatorBoardCanvas } from './components/canvas/SpectatorBoardCanvas';
import { AppHeader } from './components/AppHeader';
import { AnnotationToolbar, AnnotationTool } from './components/AnnotationToolbar';
import { PieceType } from './engine/types/piece';

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
    fetchParticipants: discordAuth.status === 'authenticated' ? sdk.getInstanceConnectedParticipants : undefined,
  });

  const [gameState, setGameState] = useState<EngineState>(() => engine.getState());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [annotationTool, setAnnotationTool] = useState<AnnotationTool>('pen');
  const [annotationPieceType, setAnnotationPieceType] = useState<PieceType>(1);
  const [autoColor, setAutoColor] = useState(false);
  const [annotationToolbarOpen, setAnnotationToolbarOpen] = useState(false);
  const settingsOpenRef = useRef(false);

  useEffect(() => {
    engine.updateConfig(configStore.getConfig());
    const handleConfigChange = () => engine.updateConfig(configStore.getConfig());
    configStore.subscribe(handleConfigChange);
    return () => configStore.unsubscribe(handleConfigChange);
  }, [engine]);

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
      isEnabled: () => !settingsOpenRef.current && peerSession.view === 'LOCAL_ACTIVE',
    });
    adapter.attach();
    return () => adapter.detach();
  }, [engine, peerSession.view]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-mono">
      <AppHeader
        discordAuth={discordAuth}
        onOpenAnnotationToolbar={() => setAnnotationToolbarOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
       <AnnotationToolbar
         isOpen={annotationToolbarOpen}
         onClose={() => setAnnotationToolbarOpen(false)}
         tool={annotationTool}
         onToolChange={setAnnotationTool}
         onClearAll={() => engine.handleInput({ type: 'ANNOTATE_CLEAR_ALL' })}
         onResetBoard={() => { engine.reset(); setGameState(engine.getState()); }}
         autoColor={autoColor}
         onAutoColorToggle={setAutoColor}
         pieceType={annotationPieceType}
         onPieceTypeChange={setAnnotationPieceType}
       />
      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        {peerSession.connectionError && (
          <div className="text-xs text-slate-400">P2P error: {peerSession.connectionError}</div>
        )}
        <div className="flex gap-8 items-start">
          {peerSession.view === 'LOCAL_ACTIVE' ? (
            <GameCanvas
              state={gameState}
              engine={engine}
              annotationTool={annotationTool}
              annotationPieceType={annotationPieceType}
              autoColor={autoColor}
            />
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
              discoveredParticipants={peerSession.participants}
              onSelectParticipant={peerSession.selectTarget}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
