import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import type { EngineState, IEngineCore } from '../../engine/interfaces/IEngineCore';
import { DEFAULT_GAME_STATS } from '../../engine/types';
import type { InterpolatedState, SpectatorBuffer } from '../../p2p/SpectatorBuffer';
import { ActiveView } from '../ActiveView';

vi.mock('../GameCanvas', () => ({
  GameCanvas: () => <div data-testid="board-canvas" />,
}));

function makeInterp(overrides: Partial<InterpolatedState> = {}): InterpolatedState {
  return {
    userId: 'remote-1',
    matrix: [],
    activePiece: null,
    queue: [],
    hold: null,
    annotations: [],
    userPalette: [],
    stats: { ...DEFAULT_GAME_STATS },
    hasData: true,
    ...overrides,
  };
}

function createMockBuffer(): { buffer: SpectatorBuffer; setState: (state: InterpolatedState) => void } {
  let current: InterpolatedState = {
    userId: '',
    matrix: [],
    activePiece: null,
    queue: [],
    hold: null,
    annotations: [],
    userPalette: [],
    stats: { ...DEFAULT_GAME_STATS },
    hasData: false,
  };
  return {
    buffer: {
      getInterpolatedState: (_now: number) => current,
    } as unknown as SpectatorBuffer,
    setState: (s) => {
      current = s;
    },
  };
}

describe('ActiveView spectator staleness', () => {
  let rafCallback: FrameRequestCallback | null = null;
  let rafId = 0;

  beforeEach(() => {
    rafId = 0;
    rafCallback = null;
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallback = cb;
      return ++rafId;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const engine = {} as unknown as IEngineCore;

  it('renders nothing while waiting for fresh spectator data', () => {
    const { buffer, setState } = createMockBuffer();
    setState({ ...makeInterp(), hasData: false });

    render(
      <ActiveView
        isLocal={false}
        state={{} as unknown as EngineState}
        engine={engine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
        onReset={() => {}}
        spectatorBuffer={buffer}
      />,
    );

    expect(screen.queryByTestId('board-canvas')).not.toBeInTheDocument();
  });

  it('renders the spectated board only while the buffer reports fresh data', async () => {
    const { buffer, setState } = createMockBuffer();

    // Buffer starts fresh; drive one RAF frame -> board appears.
    setState(makeInterp());
    const { rerender } = render(
      <ActiveView
        isLocal={false}
        state={{} as unknown as EngineState}
        engine={engine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
        onReset={() => {}}
        spectatorBuffer={buffer}
      />,
    );
    await act(async () => {
      rafCallback?.(performance.now());
    });
    rerender(
      <ActiveView
        isLocal={false}
        state={{} as unknown as EngineState}
        engine={engine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
        onReset={() => {}}
        spectatorBuffer={buffer}
      />,
    );
    expect(screen.getByTestId('board-canvas')).toBeInTheDocument();

    // Host goes quiet / stale: buffer now reports no fresh data -> board clears.
    setState({ ...makeInterp(), hasData: false });
    await act(async () => {
      rafCallback?.(performance.now());
    });
    rerender(
      <ActiveView
        isLocal={false}
        state={{} as unknown as EngineState}
        engine={engine}
        annotationTool="pen"
        annotationColor="#ffffff"
        editMode="annotations"
        onReset={() => {}}
        spectatorBuffer={buffer}
      />,
    );
    expect(screen.queryByTestId('board-canvas')).not.toBeInTheDocument();
  });
});
