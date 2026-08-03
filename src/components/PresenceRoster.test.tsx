import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { InstanceConfigStore } from '../p2p/InstanceConfigStore';
import type { PresenceRoster as PresenceRosterManager } from '../p2p/PresenceRoster';
import { PresenceRoster } from './PresenceRoster';

interface MockPresenceRoster {
  onUpdate: ReturnType<typeof vi.fn>;
  offUpdate: ReturnType<typeof vi.fn>;
  getEntries: ReturnType<typeof vi.fn>;
  reconcile: ReturnType<typeof vi.fn>;
  seedEntry: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}

function createMockRoster(): MockPresenceRoster {
  return {
    onUpdate: vi.fn(),
    offUpdate: vi.fn(),
    getEntries: vi.fn().mockReturnValue([]),
    reconcile: vi.fn(),
    seedEntry: vi.fn(),
    stop: vi.fn(),
  };
}

function createMockConfigStore(isPrivate = false) {
  return {
    getConfig: vi.fn(() => ({ isPrivate })),
    setPrivate: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  } as unknown as InstanceConfigStore;
}

describe('PresenceRoster component', () => {
  let mockRoster: MockPresenceRoster;
  let mockConfigStore: ReturnType<typeof createMockConfigStore>;
  let onSelect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRoster = createMockRoster();
    mockConfigStore = createMockConfigStore();
    onSelect = vi.fn();
  });

  it('renders local user entry with displayName and PPS', () => {
    render(
      <PresenceRoster
        roster={mockRoster as unknown as PresenceRosterManager}
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

  it('renders remote peer entries from roster updates', () => {
    mockRoster.getEntries.mockReturnValue([
      { userId: 'remote-1', displayName: 'Alice', isPrivate: false, pps: 1.5, isConnected: true, isLocal: false },
    ]);

    render(
      <PresenceRoster
        roster={mockRoster as unknown as PresenceRosterManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });

  it('shows Private badge for private local instance', () => {
    mockConfigStore.getConfig = vi.fn(() => ({ isPrivate: true }));

    render(
      <PresenceRoster
        roster={mockRoster as unknown as PresenceRosterManager}
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
        roster={mockRoster as unknown as PresenceRosterManager}
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
    mockRoster.getEntries.mockReturnValue([
      { userId: 'remote-1', displayName: 'Alice', isPrivate: false, pps: 1.5, isConnected: true, isLocal: false },
    ]);

    render(
      <PresenceRoster
        roster={mockRoster as unknown as PresenceRosterManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /spectate/i }));
    expect(onSelect).toHaveBeenCalledWith('remote-1');
  });

  it('clicking private participant does NOT call onSelectParticipant', () => {
    mockRoster.getEntries.mockReturnValue([
      { userId: 'remote-1', displayName: 'Alice', isPrivate: true, pps: 1.5, isConnected: true, isLocal: false },
    ]);

    render(
      <PresenceRoster
        roster={mockRoster as unknown as PresenceRosterManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    expect(screen.queryByRole('button', { name: /spectate/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Alice'));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('clicking local user does NOT call onSelectParticipant', () => {
    render(
      <PresenceRoster
        roster={mockRoster as unknown as PresenceRosterManager}
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
    mockRoster.getEntries.mockReturnValue([
      { userId: 'remote-1', displayName: 'PrivatePeer', isPrivate: true, pps: 1.5, isConnected: true, isLocal: false },
    ]);

    render(
      <PresenceRoster
        roster={mockRoster as unknown as PresenceRosterManager}
        instanceConfigStore={mockConfigStore}
        localUserId="local-1"
        localDisplayName="Me"
        localPps={0}
        onSelectParticipant={onSelect}
      />,
    );

    expect(screen.queryByRole('button', { name: /spectate/i })).not.toBeInTheDocument();
  });
});