import { describe, it, expect } from 'vitest';
import { cleanDisplayName, mapPeers } from '../relayMapping';
import type { RelayRow } from '../relayMapping';

const TS = () => new Date().toISOString();

function row(overrides: Partial<RelayRow> = {}): RelayRow {
  return {
    user_id: '123456789012345678',
    display_name: 'Alice',
    is_private: false,
    payload: { matrix: [] },
    updated_at: TS(),
    ...overrides,
  };
}

describe('cleanDisplayName', () => {
  it('returns the name when it is a real, usable value', () => {
    expect(cleanDisplayName('Alice', '123')).toBe('Alice');
  });

  it('collapses null/undefined/empty to "" (never the user id)', () => {
    expect(cleanDisplayName(null, '123')).toBe('');
    expect(cleanDisplayName(undefined, '123')).toBe('');
    expect(cleanDisplayName('', '123')).toBe('');
  });

  it('collapses the raw user id (snowflake) to ""', () => {
    // The relay occasionally echoes the userId as display_name; that must not
    // be treated as a real name.
    expect(cleanDisplayName('123456789012345678', '123456789012345678')).toBe('');
  });
});

describe('mapPeers', () => {
  it('shapes rows and never emits the user id as a display name', () => {
    const rows: RelayRow[] = [
      row({ display_name: 'Alice', is_private: null }),
      row({ user_id: '999', display_name: null }), // missing name
      row({ user_id: '888', display_name: '888' }), // name === id
    ];

    const peers = mapPeers(rows);

    expect(peers).toHaveLength(3);
    expect(peers[0]).toMatchObject({ userId: '123456789012345678', displayName: 'Alice', isPrivate: false });
    // Was: displayName: '999' (the snowflake). Now: neutral '' for the client label.
    expect(peers[1]).toMatchObject({ userId: '999', displayName: '', isPrivate: false });
    expect(peers[2]).toMatchObject({ userId: '888', displayName: '', isPrivate: false });
    // timestamp is a real epoch ms
    expect(typeof peers[0].timestamp).toBe('number');
    expect(peers[0].timestamp).toBeGreaterThan(0);
  });

  it('defaults is_private to false on NULL', () => {
    const peers = mapPeers([row({ is_private: null })]);
    expect(peers[0].isPrivate).toBe(false);
  });

  it('propagates is_private=true', () => {
    const peers = mapPeers([row({ is_private: true })]);
    expect(peers[0].isPrivate).toBe(true);
  });
});
