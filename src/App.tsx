import { useEffect, useRef, useState } from 'react';
import { EngineCore } from './engine/EngineCore';
import { sevenBagRandomizer } from './engine/systems/SevenBagRandomizer';
import { srsPlusRotationSystem } from './engine/systems/SrsPlusRotationSystem';
import { EngineState } from './engine/interfaces/IEngineCore';
import { SettingsModal } from './components/SettingsModal';
import { KeyboardInputAdapter } from './engine/keyboardInput';
import { createDiscordSdk } from './discord/sdk';
import { getDiscordClientId } from './discord/config';
import { useDiscordAuth } from './discord/useDiscordAuth';
import { usePeerSession } from './p2p/usePeerSession';
import { instanceConfigStore } from './p2p/InstanceConfigStore';
import { configStore } from './engine/configStore';
import { PresenceRoster } from './components/PresenceRoster';
import { FloatingControls } from './components/FloatingControls';
import { ActiveView } from './components/ActiveView';
import { AnnotationToolbar, AnnotationTool } from './components/AnnotationToolbar';
import { DEFAULT_ANNOTATION_COLOR } from './render/annotationColors';

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
  const [annotationColor, setAnnotationColor] = useState<string>(DEFAULT_ANNOTATION_COLOR);
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
    const adapter = new KeyboardInputAdapter({
      onInput: (event) => engine.handleInput(event),
      isEnabled: () => !settingsOpenRef.current && peerSession.view === 'LOCAL_ACTIVE',
    });
    adapter.attach();
    return () => adapter.detach();
  }, [engine, peerSession.view, settingsOpen]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 font-mono text-slate-100">
      <FloatingControls
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
        color={annotationColor}
        onColorChange={setAnnotationColor}
      />

      {peerSession.connectionError && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2 text-xs text-slate-500">
          P2P error: {peerSession.connectionError}
        </div>
      )}

      <main className="h-full w-full p-4">
        <ActiveView
          isLocal={peerSession.view === 'LOCAL_ACTIVE'}
          state={gameState}
          engine={engine}
          annotationTool={annotationTool}
          annotationColor={annotationColor}
          autoColor={autoColor}
          onReset={() => { engine.reset(); setGameState(engine.getState()); }}
          spectatorBuffer={peerSession.spectatorBuffer}
          onReturnToLocal={peerSession.returnToLocal}
        />
      </main>

      {peerSession.peerManager && (
        <div className="fixed bottom-4 right-4 z-30">
          <PresenceRoster
            peerManager={peerSession.peerManager}
            instanceConfigStore={instanceConfigStore}
            localUserId={userId}
            localDisplayName={userId}
            localPps={gameState.stats.pps}
            discoveredParticipants={peerSession.participants}
            onSelectParticipant={peerSession.selectTarget}
          />
        </div>
      )}
    </div>
  );
}

export default App;
