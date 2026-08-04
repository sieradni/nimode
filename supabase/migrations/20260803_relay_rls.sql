-- Hardening: deny direct (anon / authenticated) access to relay_states.
--
-- All legitimate reads/writes go through the authorize-activity Edge Function,
-- which always uses the SERVICE_ROLE_KEY (Postgres bypasses RLS for it).
-- Enabling RLS with no policies therefore locks the table down from the
-- publishable/anon key and the authenticated user key, without breaking the
-- relay in any way.
--
-- is_private semantics (review): the column is informational/illustrative for
-- clients (the PresenceRoster uses it to decide label/aggregation display,
-- e.g. whether a peer is shown in the aggregate). It does NOT gate row reads.
-- That is intentional: preserving the original model where every player keeps
-- their own instance and may spectate any remote board. If true per-peer
-- privacy is ever required ("my board is invisible to others"), it must be
-- enforced in the Edge Function GET handler (skip is_private peers for
-- non-authors), NOT here — the function runs as service_role, which bypasses
-- RLS, so RLS policies could never implement that per-row rule anyway.

alter table relay_states enable row level security;