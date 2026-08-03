create table if not exists relay_states (
  instance_id text not null,
  user_id text not null,
  display_name text not null default '',
  is_private boolean not null default false,
  payload jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (instance_id, user_id)
);

create index if not exists idx_relay_states_instance_id on relay_states (instance_id);
create index if not exists idx_relay_states_updated_at on relay_states (updated_at);