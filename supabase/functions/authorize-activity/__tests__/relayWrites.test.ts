import { describe, it, expect } from 'vitest';
import {
  buildPresenceWriteValues,
  buildStateWriteValues,
} from '../relayWrites';
import type { RelayWriteInput, ExistingRelayRow } from '../relayWrites';

const NOW = '2026-01-01T00:00:00.000Z';

function msg(overrides: Partial<RelayWriteInput> = {}): RelayWriteInput {
  return {
    instanceId: 'i1',
    userId: 'user-1',
    displayName: 'Alice',
    payload: { matrix: [] },
    ...overrides,
  };
}

describe('buildPresenceWriteValues', () => {
  it('never includes a payload key (presence must not clobber streaming state)', () => {
    const values = buildPresenceWriteValues(msg({ payload: { matrix: [99] } }), NOW);
    expect(values).not.toHaveProperty('payload');
  });

  it('derives display_name/is_private from metadata when present', () => {
    const values = buildPresenceWriteValues(
      msg({ metadata: { userId: 'user-1', displayName: 'Bob', isPrivate: true } }),
      NOW,
    );
    expect(values.display_name).toBe('Bob');
    expect(values.is_private).toBe(true);
  });

  it('falls back to message displayName and is_private=false when metadata is absent', () => {
    const values = buildPresenceWriteValues(msg(), NOW);
    // msg has no metadata (not passed), so defaults are used.
    expect(values.display_name).toBe('Alice');
    expect(values.is_private).toBe(false);
    expect(values.instance_id).toBe('i1');
    expect(values.user_id).toBe('user-1');
    expect(values.updated_at).toBe(NOW);
  });
});

describe('buildStateWriteValues', () => {
  it('keeps the real payload and preserves display_name/is_private from an existing row', () => {
    const existing: ExistingRelayRow = { display_name: 'Bob', is_private: true };
    const values = buildStateWriteValues(msg(), existing, NOW);
    expect(values.payload).toEqual({ matrix: [] });
    expect(values.display_name).toBe('Bob');
    expect(values.is_private).toBe(true);
  });

  it('falls back to message displayName/is_private=false when no existing row', () => {
    const values = buildStateWriteValues(msg(), null, NOW);
    expect(values.display_name).toBe('Alice');
    expect(values.is_private).toBe(false);
    expect(values.payload).toEqual({ matrix: [] });
  });

  it('defaults payload to {} when the state message has no payload', () => {
    const values = buildStateWriteValues(msg({ payload: undefined }), null, NOW);
    expect(values.payload).toEqual({});
  });
});