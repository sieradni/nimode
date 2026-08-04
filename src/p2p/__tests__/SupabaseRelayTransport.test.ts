import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  SupabaseRelayTransport,
  POLL_INTERVAL_MS,
  PEER_MISS_THRESHOLD,
} from '../SupabaseRelayTransport';
import type { PeerMetadata } from '../types';

vi.mock('../supabaseEnv', () => ({
  getRelayFunctionUrl: () => 'https://relay.test',
}));

function jsonResponse(peers: Array<Record<string, unknown>> = []) {
  return { ok: true, json: async () => ({ peers }) };
}

const METADATA: PeerMetadata = { userId: 'remote-1', displayName: 'Alice', isPrivate: false };

/**
 * Advances the poll interval by one tick and drains the async poll() microtask
 * chain so assertions are deterministic under fake timers.
 */
async function tickPoll(): Promise<void> {
  vi.advanceTimersByTime(POLL_INTERVAL_MS);
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
  }
}

describe('SupabaseRelayTransport', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  async function open(transport: SupabaseRelayTransport): Promise<void> {
    fetchMock.mockImplementation(async () => jsonResponse([]));
    await transport.openTransport({
      instanceId: 'i1',
      userId: 'me',
      displayName: 'Me',
      isPrivate: false,
    });
  }

  it('discovers a peer on the first poll and emits peerJoined', async () => {
    const transport = new SupabaseRelayTransport({ getJwt: async () => 'jwt' });
    const peerJoined = vi.fn();
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    transport.on('peerJoined', peerJoined);

    await open(transport);

    fetchMock.mockImplementation(async () =>
      jsonResponse([{ ...METADATA, payload: null, timestamp: Date.now() }]),
    );
    await tickPoll();

    expect(fetchMock).toHaveBeenCalled();
    expect(peerJoined).toHaveBeenCalledTimes(1);
    expect(peerJoined).toHaveBeenCalledWith(METADATA);
    errSpy.mockRestore();
  });

  it('does not emit peerLeft on a single empty poll (debounce)', async () => {
    const transport = new SupabaseRelayTransport({ getJwt: async () => 'jwt' });
    const peerLeft = vi.fn();
    const peerJoined = vi.fn();
    transport.on('peerLeft', peerLeft);
    transport.on('peerJoined', peerJoined);

    await open(transport);

    // Discover the peer.
    const now = Date.now();
    fetchMock.mockImplementation(async () =>
      jsonResponse([
        {
          ...METADATA,
          payload: {
            userId: 'remote-1',
            matrix: [],
            activePiece: null,
            queue: [],
            hold: null,
            annotations: [],
            userPalette: [],
            stats: {},
          },
          timestamp: now,
        },
      ]),
    );
    await tickPoll();
    expect(peerJoined).toHaveBeenCalledTimes(1);

    // Peer disappears from the relay. It must be missing for several
    // consecutive polls before peerLeft is emitted (debounce), so a single
    // dropped poll never flickers the participant out of the roster.
    fetchMock.mockImplementation(async () => jsonResponse([]));
    for (let miss = 1; miss <= PEER_MISS_THRESHOLD; miss++) {
      await tickPoll();
      if (miss < PEER_MISS_THRESHOLD) {
        expect(peerLeft).not.toHaveBeenCalled();
      } else {
        expect(peerLeft).toHaveBeenCalledTimes(1);
      }
    }
    expect(peerLeft).toHaveBeenCalledWith('remote-1');
  });

  it('cancels a pending removal when the peer reappears before the threshold', async () => {
    const transport = new SupabaseRelayTransport({ getJwt: async () => 'jwt' });
    const peerLeft = vi.fn();
    const peerJoined = vi.fn();
    transport.on('peerLeft', peerLeft);
    transport.on('peerJoined', peerJoined);

    await open(transport);

    fetchMock.mockImplementation(async () =>
      jsonResponse([{ ...METADATA, payload: null, timestamp: Date.now() }]),
    );
    await tickPoll();
    expect(peerJoined).toHaveBeenCalledTimes(1);

    // One empty poll, then the peer comes back with unchanged metadata.
    fetchMock.mockImplementation(async () => jsonResponse([]));
    await tickPoll();
    fetchMock.mockImplementation(async () =>
      jsonResponse([{ ...METADATA, payload: null, timestamp: Date.now() }]),
    );
    await tickPoll();

    expect(peerLeft).not.toHaveBeenCalled();
  });
});
