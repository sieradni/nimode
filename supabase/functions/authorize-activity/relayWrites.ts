/**
 * Pure, side-effect-free builders for the `relay_states` upsert values.
 * Dependency-free so they are unit-testable with vitest and reusable by the
 * Deno Edge Function (which imports relative `./relayWrites.ts`).
 *
 * Key invariant (tested in __tests__/relayWrites.test.ts):
 *  - A `presence` upsert NEVER includes a `payload` key. If it did, PostgREST's
 *    upsert would overwrite the streaming game state with the presence metadata
 *    object ({userId, displayName, isPrivate}) whenever a presence ping comes
 *    after a state write — feeding spectators a non-SpectatorPayload and
 *    causing flicker/garbage. Omitting `payload` leaves any existing state row
 *    untouched on conflict and uses the table default `{}` on a fresh insert.
 */

export interface RelayPresenceMetadata {
  userId: string;
  displayName: string;
  isPrivate: boolean;
}

export interface RelayWriteInput {
  instanceId: string;
  userId: string;
  displayName: string;
  payload?: Record<string, unknown>;
  metadata?: RelayPresenceMetadata;
}

export interface RelayWriteValues {
  instance_id: string;
  user_id: string;
  display_name: string;
  is_private: boolean;
  payload?: Record<string, unknown>;
  updated_at: string;
}

export interface ExistingRelayRow {
  display_name: string | null;
  is_private: boolean | null;
}

export function buildPresenceWriteValues(
  msg: RelayWriteInput,
  now: string,
): RelayWriteValues {
  const m = msg.metadata ?? { userId: msg.userId, displayName: msg.displayName, isPrivate: false };
  const values: RelayWriteValues = {
    instance_id: msg.instanceId,
    user_id: msg.userId,
    display_name: m.displayName ?? msg.displayName,
    is_private: m.isPrivate ?? false,
    updated_at: now,
  };
  // Intentionally: NO payload key.
  return values;
}

export function buildStateWriteValues(
  msg: RelayWriteInput,
  existing: ExistingRelayRow | null,
  now: string,
): RelayWriteValues {
  return {
    instance_id: msg.instanceId,
    user_id: msg.userId,
    display_name: existing?.display_name ?? msg.displayName,
    is_private: existing?.is_private ?? false,
    payload: msg.payload ?? {},
    updated_at: now,
  };
}