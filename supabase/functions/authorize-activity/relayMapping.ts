/**
 * Pure, side-effect-free shaping of `relay_states` rows for the GET endpoint.
 * Kept dependency-free so it can be unit-tested with vitest and reused by the
 * Deno Edge Function (Deno supports relative `./relayMapping.ts` imports).
 *
 * Invariants (tested in __tests__/relayMapping.test.ts):
 *  - A peer's `displayName` is NEVER the raw `user_id`; missing/empty names
 *    collapse to `''` (the client renders a neutral "Player <id>" label for
 *    that), instead of leaking the Discord snowflake as a "display name".
 *  - `is_private` defaults to `false` when NULL.
 *  - `timestamp` is derived from the row's `updated_at`.
 */

export interface RelayRow {
  user_id: string;
  display_name: string | null;
  is_private: boolean | null;
  payload: unknown;
  updated_at: string;
}

export interface MappedPeer {
  userId: string;
  displayName: string;
  isPrivate: boolean;
  payload: unknown;
  timestamp: number;
}

/**
 * Returns a usable display name, or `''` when the stored value is missing,
 * empty, or merely the user's own id (the snowflake the relay sometimes falls
 * back to). Never returns the `userId` itself.
 */
export function cleanDisplayName(name: string | null | undefined, userId: string): string {
  if (name === null || name === undefined || name === '' || name === userId) {
    return '';
  }
  return name;
}

export function mapPeers(rows: RelayRow[]): MappedPeer[] {
  return rows.map((row) => ({
    userId: row.user_id,
    displayName: cleanDisplayName(row.display_name, row.user_id),
    isPrivate: row.is_private === true,
    payload: row.payload,
    timestamp: new Date(row.updated_at).getTime(),
  }));
}
