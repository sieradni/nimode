import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { PeerJSManager } from '../p2p/PeerJSManager';
import type { InstanceConfigStore } from '../p2p/InstanceConfigStore';
import type { PeerMetadata } from '../p2p/types';
import { PresenceRoster } from './PresenceRoster';

function createMockPeerManager() {
  return {
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as PeerJSManager;
}

function createMockConfigStore(isPrivate = false) {
  return {
    getConfig: vi.fn(() => ({ isPrivate })),
    setPrivate: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  } as unknown as InstanceConfigStore;
}

function getHandler(
  peerManager: PeerJSManager,
  event: string,
): (...args: unknown[]) => void {
  const on = peerManager.on as unknown as {
    mock: { calls: unknown[][] };
  };
  const call = on.mock.calls.find((c) => c[0] === event);
  if (!call) throw new Error(`Handler for "${event}" not found`);
  return call[1] as (...args: unknown[]) => void;
}

function makeMetadata(
  overrides: Partial<PeerMetadata> = {},
): PeerMetadata {
  return {
    userId: 'user-1',
    displayName: 'Alice',
    isPrivate: false,
    ...overrides,
  };
}

describe('PresenceRoster component', () => {
  let mockPeerManager: ReturnType<typeof createMockPeerManager>;
  let mockConfigStore: ReturnType<typeof createMockConfigStore>;
  let onSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockPeerManager = createMockPeerManager();
    mockConfigStore = createMockConfigStore();
    onSelect = vi.fn();
  });

  it('renders local user entry with displayName and PPS', () => {
    render(
      <PresenceRoster
        peerManager={mockPeerManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={2.5}
        onSelectParticipant={onSelect}
      />,
    );

    expect(screen.getByText('Me')).toBeInTheDocument();
    expect(screen.getByText('2.50')).toBeInTheDocument();
  });

  it('renders remote peer entries from PeerJSManager events', () => {
    render(
      <PresenceRoster
        peerManager={mockPeerManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    const joined = getHandler(mockPeerManager, 'peerJoined');
    act(() => {
      joined(makeMetadata({ userId: 'remote-1', displayName: 'Alice' }));
    });

    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows Private badge for private instances', () => {
    mockConfigStore.getConfig = vi.fn(() => ({ isPrivate: true }));

    render(
      <PresenceRoster
        peerManager={mockPeerManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    expect(screen.getByText('Private')).toBeInTheDocument();
  });

  it('shows (You) indicator for local user', () => {
    render(
      <PresenceRoster
        peerManager={mockPeerManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    expect(screen.getByText('(You)')).toBeInTheDocument();
  });

  it('clicking non-private remote participant calls onSelectParticipant', () => {
    render(
      <PresenceRoster
        peerManager={mockPeerManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    const joined = getHandler(mockPeerManager, 'peerJoined');
    act(() => {
      joined(makeMetadata({ userId: 'remote-1', displayName: 'Alice', isPrivate: false }));
    });

    fireEvent.click(screen.getByRole('button', { name: /spectate/i }));
    expect(onSelect).toHaveBeenCalledWith('remote-1');
  });

  it('clicking private participant does NOT call onSelectParticipant', () => {
    render(
      <PresenceRoster
        peerManager={mockPeerManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    const joined = getHandler(mockPeerManager, 'peerJoined');
    act(() => {
      joined(makeMetadata({ userId: 'remote-1', displayName: 'Alice', isPrivate: true }));
    });

    expect(screen.queryByRole('button', { name: /spectate/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Alice'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clicking local user does NOT call onSelectParticipant', () => {
    render(
      <PresenceRoster
        peerManager={mockPeerManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    expect(screen.queryByRole('button', { name: /spectate/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Me'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not show Spectate button for private or local entries', () => {
    render(
      <PresenceRoster
        peerManager={mockPeerManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    const joined = getHandler(mockPeerManager, 'peerJoined');
    act(() => {
      joined(makeMetadata({ userId: 'remote-1', displayName: 'PrivatePeer', isPrivate: true }));
    });

    expect(screen.queryByRole('button', { name: /spectate/i })).not.toBeInTheDocument();
  });
});
