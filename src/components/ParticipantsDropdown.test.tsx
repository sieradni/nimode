import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PresenceEntry } from '../p2p/PresenceRoster';
import { ParticipantsDropdown } from './ParticipantsDropdown';

const LOCAL: PresenceEntry = {
  userId: 'local-1',
  displayName: 'Me',
  isPrivate: false,
  pps: 2.5,
  isConnected: true,
  isLocal: true,
};

function remoteEntry(overrides: Partial<PresenceEntry>): PresenceEntry {
  return {
    userId: 'remote-1',
    displayName: 'Alice',
    isPrivate: false,
    pps: 1.5,
    isConnected: true,
    isLocal: false,
    ...overrides,
  };
}

function renderDropdown(overrides: {
  entries?: PresenceEntry[];
  targetId?: string | null;
  onSelectParticipant?: ReturnType<typeof vi.fn>;
  onReturnToLocal?: ReturnType<typeof vi.fn>;
} = {}) {
  const props = {
    entries: overrides.entries ?? [LOCAL],
    targetId: overrides.targetId ?? null,
    localUserId: LOCAL.userId,
    onSelectParticipant: overrides.onSelectParticipant ?? vi.fn(),
    onReturnToLocal: overrides.onReturnToLocal ?? vi.fn(),
  };
  render(<ParticipantsDropdown {...props} />);
  return props;
}

async function openDropdown(): Promise<void> {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /(participants|spectating)/i }));
}

describe('ParticipantsDropdown', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a Participants trigger with a remote count badge', () => {
    renderDropdown({ entries: [LOCAL, remoteEntry({})] });

    const trigger = screen.getByRole('button', { name: /participants/i });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('reflects the currently spectated participant on the trigger', () => {
    renderDropdown({ entries: [LOCAL, remoteEntry({})], targetId: 'remote-1' });

    expect(screen.getByRole('button', { name: /spectating alice/i })).toBeInTheDocument();
  });

  it('shows the local entry and remote entries once opened', async () => {
    renderDropdown({ entries: [LOCAL, remoteEntry({})] });
    await openDropdown();

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/Me/)).toBeInTheDocument();
    expect(screen.getByText('(You)')).toBeInTheDocument();
    expect(screen.getByText('2.50')).toBeInTheDocument();
    expect(screen.getByText('1.50')).toBeInTheDocument();
  });

  it('calls onSelectParticipant when clicking a public remote participant', async () => {
    const onSelectParticipant = vi.fn();
    renderDropdown({ entries: [LOCAL, remoteEntry({})], onSelectParticipant });
    await openDropdown();

    await userEvent.click(screen.getByRole('button', { name: /spectate/i }));
    expect(onSelectParticipant).toHaveBeenCalledWith('remote-1');
  });

  it('does not offer a Spectate action for private remote participants', async () => {
    const onSelectParticipant = vi.fn();
    renderDropdown({
      entries: [LOCAL, remoteEntry({ isPrivate: true })],
      onSelectParticipant,
    });
    await openDropdown();

    expect(screen.queryByRole('button', { name: /spectate/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Alice'));
    expect(onSelectParticipant).not.toHaveBeenCalled();
  });

  it('does not offer a Spectate action for the local entry', async () => {
    const onSelectParticipant = vi.fn();
    renderDropdown({ entries: [LOCAL], onSelectParticipant });
    await openDropdown();

    expect(screen.queryByRole('button', { name: /spectate/i })).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('Me'));
    expect(onSelectParticipant).not.toHaveBeenCalled();
  });

  it('shows Connecting… for unconnected remote participants and no Spectate action', async () => {
    renderDropdown({ entries: [LOCAL, remoteEntry({ isConnected: false })] });
    await openDropdown();

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Connecting…')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /spectate/i })).not.toBeInTheDocument();
  });

  it('marks the active spectate target as Watching', async () => {
    renderDropdown({
      entries: [LOCAL, remoteEntry({})],
      targetId: 'remote-1',
    });
    await openDropdown();

    expect(screen.getByText('Watching')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /spectate/i })).not.toBeInTheDocument();
  });

  it('calls onReturnToLocal when clicking the You row while spectating', async () => {
    const onReturnToLocal = vi.fn();
    renderDropdown({
      entries: [LOCAL, remoteEntry({})],
      targetId: 'remote-1',
      onReturnToLocal,
    });
    await openDropdown();

    await userEvent.click(screen.getByRole('button', { name: /return to your board/i }));
    expect(onReturnToLocal).toHaveBeenCalled();
  });

  it('closes the dropdown after selecting a participant', async () => {
    const onSelectParticipant = vi.fn();
    renderDropdown({ entries: [LOCAL, remoteEntry({})], onSelectParticipant });
    await openDropdown();

    await userEvent.click(screen.getByRole('button', { name: /spectate/i }));
    expect(onSelectParticipant).toHaveBeenCalledWith('remote-1');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the dropdown on outside click', async () => {
    renderDropdown({ entries: [LOCAL, remoteEntry({})] });
    await openDropdown();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await userEvent.click(document.body);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the dropdown on Escape', async () => {
    renderDropdown({ entries: [LOCAL, remoteEntry({})] });
    await openDropdown();
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders a neutral label instead of a raw user-id fallback for remote peers', async () => {
    renderDropdown({
      entries: [LOCAL, remoteEntry({ userId: 'remote-number-id', displayName: 'remote-number-id' })],
    });
    await openDropdown();

    expect(screen.queryByText('remote-number-id')).not.toBeInTheDocument();
    expect(screen.getByText(/Player/)).toBeInTheDocument();
  });
});
