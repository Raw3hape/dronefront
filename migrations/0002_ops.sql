create table if not exists ops_runs (
  id serial primary key,
  user_id text not null,
  theater_id text not null,
  difficulty_id text not null,
  side text not null,
  won boolean not null,
  duration_s integer not null,
  damage integer not null,
  created_at timestamptz not null default now()
);
create index if not exists ops_runs_user_id_idx on ops_runs (user_id);
