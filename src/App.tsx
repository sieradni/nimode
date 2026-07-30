import { useEffect, useState } from 'react';
import { EngineCore } from './engine/EngineCore';
import { sevenBagRandomizer } from './engine/systems/SevenBagRandomizer';
import { srsPlusRotationSystem } from './engine/systems/SrsPlusRotationSystem';
import { EngineState } from './engine/interfaces/IEngineCore';
import { SettingsModal } from './components/SettingsModal';

function App() {
  const [engine] = useState(
    () =>
      new EngineCore({
        rotationSystem: srsPlusRotationSystem,
        bagRandomizer: sevenBagRandomizer,
      })
  );

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
        <div className="flex gap-8 items-start">
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <h2 className="text-sm font-semibold mb-2 text-slate-400">HOLD</h2>
            <div className="text-lg font-bold text-sky-400">{gameState.hold ?? 'NONE'}</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex flex-col items-center">
            <h2 className="text-sm font-semibold mb-2 text-slate-400">BOARD</h2>
            <div className="text-xs text-slate-300">
              Active Piece: {gameState.activePiece?.type ?? 'None'} (x: {gameState.activePiece?.x}, y: {gameState.activePiece?.y})
            </div>
            <div className="text-xs text-slate-400 mt-2">
              Status: {gameState.gameOver ? 'GAME OVER' : gameState.paused ? 'PAUSED' : 'PLAYING'}
            </div>
          </div>
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-800">
            <h2 className="text-sm font-semibold mb-2 text-slate-400">NEXT</h2>
            <div className="text-sm space-y-1">
              {gameState.queue.slice(0, 5).map((piece, i) => (
                <div key={i} className="text-sky-300">Piece {piece}</div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
