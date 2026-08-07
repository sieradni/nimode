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
import { ParticipantsDropdown } from './components/ParticipantsDropdown';
import { usePresenceRoster } from './components/usePresenceRoster';
import { FloatingControls } from './components/FloatingControls';
import { ActiveView } from './components/ActiveView';
import { AnnotationToolbar, AnnotationTool } from './components/AnnotationToolbar';
import { DEFAULT_ANNOTATION_COLOR } from './render/annotationColors';
import { EditMode } from './engine/types';
import { useTopChromeInset } from './components/useTopChromeInset';

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
  const displayName =
    discordAuth.status === 'authenticated'
      ? discordAuth.auth.globalName ?? discordAuth.auth.username
      : 'local-player';
  const guildId = discordAuth.status === 'authenticated' ? discordAuth.auth.guildId : null;
  const channelId = discordAuth.status === 'authenticated' ? discordAuth.auth.channelId : null;
  const discordAccessToken =
    discordAuth.status === 'authenticated' ? discordAuth.auth.accessToken : null;
  const peerSession = usePeerSession({
    instanceId,
    userId,
    displayName,
    guildId,
    channelId,
    engine,
    configStore: instanceConfigStore,
    discordAccessToken,
    discordSdk: discordAuth.status === 'authenticated' ? sdk : null,
  });

  const [gameState, setGameState] = useState<EngineState>(() => engine.getState());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [annotationTool, setAnnotationTool] = useState<AnnotationTool>('pen');
  const [annotationColor, setAnnotationColor] = useState<string>(DEFAULT_ANNOTATION_COLOR);
  const [editMode, setEditMode] = useState<EditMode>('annotations');
  const [autoColor, setAutoColor] = useState(() => configStore.getConfig().autoColor);
  const topChromeInset = useTopChromeInset();

  const rosterEntries = usePresenceRoster({
    roster: peerSession.roster,
    instanceConfigStore,
    localUserId: userId,
    localDisplayName: displayName,
    localPps: gameState.stats.pps,
  });

  useEffect(() => {
    const syncConfig = () => {
      engine.updateConfig(configStore.getConfig());
      setAutoColor(configStore.getConfig().autoColor);
    };
    syncConfig();
    configStore.subscribe(syncConfig);
    return () => configStore.unsubscribe(syncConfig);
  }, [engine]);
  const [annotationToolbarOpen, setAnnotationToolbarOpen] = useState(false);
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
      >
        {peerSession.peerManager && (
          <ParticipantsDropdown
            entries={rosterEntries}
            targetId={peerSession.targetId}
            localUserId={userId}
            onSelectParticipant={peerSession.selectTarget}
            onReturnToLocal={peerSession.returnToLocal}
          />
        )}
      </FloatingControls>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AnnotationToolbar
        isOpen={annotationToolbarOpen}
        onClose={() => setAnnotationToolbarOpen(false)}
        tool={annotationTool}
        onToolChange={setAnnotationTool}
        onClearAll={() => engine.handleInput({ type: 'ANNOTATE_CLEAR_ALL' })}
        onClearBoard={() => { engine.clearBoard(); setGameState(engine.getState()); }}
        autoColor={autoColor}
        onAutoColorToggle={configStore.setAutoColor}
        color={annotationColor}
        onColorChange={setAnnotationColor}
        mode={editMode}
        onModeChange={setEditMode}
      />

      {peerSession.connectionError && (
        <div className="pointer-events-none fixed bottom-4 left-1/2 z-30 -translate-x-1/2 text-xs text-slate-400">
          Multiplayer: {peerSession.connectionError}
        </div>
      )}

      <main
        className="flex h-full w-full items-center justify-center p-4"
        style={{ paddingTop: topChromeInset + 16 }}
      >
        <ActiveView
          isLocal={peerSession.view === 'LOCAL_ACTIVE'}
          state={gameState}
          engine={engine}
          annotationTool={annotationTool}
          annotationColor={annotationColor}
          editMode={editMode}
          onReset={() => { engine.reset(); setGameState(engine.getState()); }}
          spectatorBuffer={peerSession.spectatorBuffer}
         />
      </main>
    </div>
  );
}

export default App;
