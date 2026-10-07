create schema if not exists private;

create table if not exists private.bootstrap_authorizations (
  user_id uuid primary key references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now(),
  created_by text not null default 'admin'
);

revoke all on schema private from public, anon, authenticated;
revoke all on table private.bootstrap_authorizations from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete on private.bootstrap_authorizations to service_role;
