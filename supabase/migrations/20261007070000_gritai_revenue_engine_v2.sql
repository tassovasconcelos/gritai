-- GRITaÍ Revenue Engine V2
-- Base esperada: prospect_360_0007_review_link_guard
-- Consolidado a partir do schema homologado em grit-prospect-360 em 07/10/2026.

begin;

create or replace function public.is_org_member(p_organization_id uuid, p_roles text[] default null)
returns boolean
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    current_user = 'service_role'
    or exists (
      select 1
      from public.memberships m
      where m.organization_id = p_organization_id
        and m.user_id = (select auth.uid())
        and m.active = true
        and (p_roles is null or m.role = any(p_roles))
    )
$$;

revoke all on function public.is_org_member(uuid, text[]) from public;
grant execute on function public.is_org_member(uuid, text[]) to authenticated, service_role;

alter table public.companies alter column tax_id drop not null;

alter table public.companies drop constraint if exists companies_source_type_check;
alter table public.companies add constraint companies_source_type_check
check (source_type in (
  'csv','api','manual','google','google_maps','website','facebook','instagram','linkedin',
  'enrichment','referral','crm'
));

alter table public.companies
  add column if not exists normalized_name text,
  add column if not exists website_url text,
  add column if not exists website_domain text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists address_line text,
  add column if not exists postal_code text,
  add column if not exists country char(2) not null default 'BR',
  add column if not exists industry text,
  add column if not exists cnae text,
  add column if not exists employee_band text,
  add column if not exists revenue_band text,
  add column if not exists lifecycle_stage text not null default 'discovered',
  add column if not exists data_confidence numeric(5,2) not null default 0,
  add column if not exists source_last_seen_at timestamptz not null default now(),
  add column if not exists last_enriched_at timestamptz,
  add column if not exists last_signal_at timestamptz;

alter table public.companies drop constraint if exists companies_lifecycle_stage_check;
alter table public.companies add constraint companies_lifecycle_stage_check
check (lifecycle_stage in (
  'discovered','enriched','icp_validated','decision_maker_identified','contactable',
  'prospecting','engaged','qualified','meeting','opportunity','proposal','won','lost','nurture'
));

alter table public.companies drop constraint if exists companies_data_confidence_check;
alter table public.companies add constraint companies_data_confidence_check
check (data_confidence between 0 and 100);

create index if not exists companies_org_normalized_name_idx
  on public.companies (organization_id, normalized_name);
create index if not exists companies_org_domain_idx
  on public.companies (organization_id, website_domain);
create index if not exists companies_org_stage_idx
  on public.companies (organization_id, lifecycle_stage);

create or replace function public.prepare_company_master()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.normalized_name := lower(regexp_replace(trim(coalesce(nullif(new.trade_name,''), new.legal_name)), '\s+', ' ', 'g'));

  if new.website_domain is not null and trim(new.website_domain) <> '' then
    new.website_domain := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(trim(new.website_domain), '^https?://', '', 'i'),
          '^www\.', '', 'i'
        ),
        '/.*$', ''
      )
    );
  elsif new.website_url is not null and trim(new.website_url) <> '' then
    new.website_domain := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(trim(new.website_url), '^https?://', '', 'i'),
          '^www\.', '', 'i'
        ),
        '/.*$', ''
      )
    );
  end if;

  new.updated_at := now();
  return new;
end
$$;

drop trigger if exists companies_prepare_master_trg on public.companies;
create trigger companies_prepare_master_trg
before insert or update of legal_name, trade_name, website_url, website_domain
on public.companies
for each row execute function public.prepare_company_master();

create or replace function public.prevent_company_identity_change()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'company_organization_immutable' using errcode = '23514';
  end if;

  if old.tax_id is not null and new.tax_id is distinct from old.tax_id then
    raise exception 'company_tax_id_immutable' using errcode = '23514';
  end if;

  new.updated_at := now();
  return new;
end
$$;

create table if not exists public.business_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null,
  name text not null,
  segment text,
  website text,
  value_proposition text,
  primary_goal text,
  icp_rules jsonb not null default '{}'::jsonb,
  target_personas jsonb not null default '[]'::jsonb,
  offer_catalog jsonb not null default '[]'::jsonb,
  channel_policy jsonb not null default '{}'::jsonb,
  score_weights jsonb not null default '{"icp_fit":30,"intent":25,"contactability":15,"timing":15,"engagement":15}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug),
  unique (organization_id, id),
  check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null,
  full_name text not null,
  job_title text,
  department text,
  persona text,
  seniority text,
  email text,
  phone text,
  whatsapp text,
  linkedin_url text,
  facebook_url text,
  instagram_url text,
  is_decision_maker boolean not null default false,
  source_type text not null default 'manual',
  source_reference text,
  verification_status text not null default 'pending',
  data_confidence numeric(5,2) not null default 0,
  last_verified_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, company_id)
    references public.companies(organization_id, id) on delete cascade,
  check (verification_status in ('pending','verified','rejected')),
  check (data_confidence between 0 and 100)
);

create index if not exists contacts_org_company_idx on public.contacts(organization_id, company_id);
create index if not exists contacts_org_decision_idx on public.contacts(organization_id, is_decision_maker desc, data_confidence desc);
create unique index if not exists contacts_org_email_uq
  on public.contacts(organization_id, lower(email))
  where email is not null and email <> '';

create table if not exists public.enrichment_facts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null,
  contact_id uuid,
  field_name text not null,
  field_value jsonb not null,
  source_provider text not null,
  source_reference text,
  confidence numeric(5,2) not null default 0,
  observed_at timestamptz not null default now(),
  expires_at timestamptz,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  foreign key (organization_id, company_id)
    references public.companies(organization_id, id) on delete cascade,
  foreign key (organization_id, contact_id)
    references public.contacts(organization_id, id) on delete cascade,
  check (confidence between 0 and 100)
);

create index if not exists enrichment_company_field_idx
  on public.enrichment_facts(organization_id, company_id, field_name, is_current, observed_at desc);

create table if not exists public.buying_signals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_profile_id uuid,
  company_id uuid not null,
  contact_id uuid,
  signal_type text not null,
  signal_label text not null,
  signal_strength numeric(5,2) not null default 0,
  confidence numeric(5,2) not null default 0,
  source_provider text not null,
  source_reference text,
  evidence jsonb not null default '{}'::jsonb,
  detected_at timestamptz not null default now(),
  expires_at timestamptz,
  consumed_at timestamptz,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  foreign key (organization_id, business_profile_id)
    references public.business_profiles(organization_id, id) on delete cascade,
  foreign key (organization_id, company_id)
    references public.companies(organization_id, id) on delete cascade,
  foreign key (organization_id, contact_id)
    references public.contacts(organization_id, id) on delete set null,
  check (signal_strength between 0 and 100),
  check (confidence between 0 and 100),
  check (status in ('active','consumed','expired','dismissed'))
);

create index if not exists buying_signals_active_idx
  on public.buying_signals(organization_id, business_profile_id, company_id, detected_at desc)
  where status='active';

create table if not exists public.company_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_profile_id uuid not null,
  company_id uuid not null,
  icp_fit numeric(5,2) not null default 0,
  intent numeric(5,2) not null default 0,
  contactability numeric(5,2) not null default 0,
  timing numeric(5,2) not null default 0,
  engagement numeric(5,2) not null default 0,
  total_score numeric(5,2) not null default 0,
  confidence numeric(5,2) not null default 0,
  reasons jsonb not null default '[]'::jsonb,
  scored_at timestamptz not null default now(),
  next_review_at timestamptz,
  unique (organization_id, business_profile_id, company_id),
  foreign key (organization_id, business_profile_id)
    references public.business_profiles(organization_id, id) on delete cascade,
  foreign key (organization_id, company_id)
    references public.companies(organization_id, id) on delete cascade,
  check (icp_fit between 0 and 100),
  check (intent between 0 and 100),
  check (contactability between 0 and 100),
  check (timing between 0 and 100),
  check (engagement between 0 and 100),
  check (total_score between 0 and 100),
  check (confidence between 0 and 100)
);

create index if not exists company_scores_queue_idx
  on public.company_scores(organization_id, business_profile_id, total_score desc, scored_at desc);

create table if not exists public.prospecting_states (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_profile_id uuid not null,
  company_id uuid not null,
  stage text not null default 'discovered',
  stage_reason text,
  owner_user_id uuid references auth.users(id) on delete set null,
  last_activity_at timestamptz,
  next_action_at timestamptz,
  entered_stage_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, business_profile_id, company_id),
  foreign key (organization_id, business_profile_id)
    references public.business_profiles(organization_id, id) on delete cascade,
  foreign key (organization_id, company_id)
    references public.companies(organization_id, id) on delete cascade,
  check (stage in (
    'discovered','enriched','icp_validated','decision_maker_identified','contactable',
    'prospecting','engaged','qualified','meeting','opportunity','proposal','won','lost','nurture'
  ))
);

create index if not exists prospecting_states_stage_idx
  on public.prospecting_states(organization_id, business_profile_id, stage, next_action_at);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_profile_id uuid not null,
  company_id uuid not null,
  primary_contact_id uuid,
  title text not null,
  stage text not null default 'qualified',
  status text not null default 'open',
  amount numeric(14,2),
  probability numeric(5,2),
  expected_close_date date,
  owner_user_id uuid references auth.users(id) on delete set null,
  source text,
  loss_reason text,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  foreign key (organization_id, business_profile_id)
    references public.business_profiles(organization_id, id) on delete cascade,
  foreign key (organization_id, company_id)
    references public.companies(organization_id, id) on delete cascade,
  foreign key (organization_id, primary_contact_id)
    references public.contacts(organization_id, id) on delete set null,
  check (stage in ('qualified','meeting','opportunity','proposal','negotiation','won','lost')),
  check (status in ('open','won','lost','on_hold')),
  check (probability is null or probability between 0 and 100)
);

create index if not exists opportunities_pipeline_idx
  on public.opportunities(organization_id, business_profile_id, status, stage, expected_close_date);

create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_profile_id uuid,
  company_id uuid not null,
  contact_id uuid,
  opportunity_id uuid,
  activity_type text not null,
  channel text,
  direction text,
  outcome text,
  sentiment text,
  subject text,
  body_excerpt text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (organization_id, business_profile_id)
    references public.business_profiles(organization_id, id) on delete cascade,
  foreign key (organization_id, company_id)
    references public.companies(organization_id, id) on delete cascade,
  foreign key (organization_id, contact_id)
    references public.contacts(organization_id, id) on delete set null,
  foreign key (organization_id, opportunity_id)
    references public.opportunities(organization_id, id) on delete set null,
  check (direction is null or direction in ('inbound','outbound','internal')),
  check (sentiment is null or sentiment in ('positive','neutral','negative','unknown'))
);

create index if not exists activities_company_time_idx
  on public.activities(organization_id, company_id, occurred_at desc);
create index if not exists activities_profile_time_idx
  on public.activities(organization_id, business_profile_id, occurred_at desc);

create table if not exists public.channel_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid,
  contact_id uuid,
  channel text not null,
  permission_status text not null default 'unknown',
  lawful_basis text,
  source_reference text,
  observed_at timestamptz not null default now(),
  expires_at timestamptz,
  updated_at timestamptz not null default now(),
  foreign key (organization_id, company_id)
    references public.companies(organization_id, id) on delete cascade,
  foreign key (organization_id, contact_id)
    references public.contacts(organization_id, id) on delete cascade,
  check (channel in ('email','phone','whatsapp','linkedin','facebook','instagram')),
  check (permission_status in ('unknown','allowed','blocked','opted_out'))
);

create index if not exists channel_permissions_lookup_idx
  on public.channel_permissions(organization_id, contact_id, company_id, channel, permission_status);

create table if not exists public.recommended_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_profile_id uuid not null,
  company_id uuid not null,
  contact_id uuid,
  opportunity_id uuid,
  action_type text not null,
  channel text,
  priority numeric(5,2) not null default 0,
  execution_mode text not null default 'human',
  status text not null default 'pending',
  rationale text not null,
  payload jsonb not null default '{}'::jsonb,
  assigned_to uuid references auth.users(id) on delete set null,
  due_at timestamptz not null default now(),
  expires_at timestamptz,
  completed_at timestamptz,
  outcome text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id, business_profile_id)
    references public.business_profiles(organization_id, id) on delete cascade,
  foreign key (organization_id, company_id)
    references public.companies(organization_id, id) on delete cascade,
  foreign key (organization_id, contact_id)
    references public.contacts(organization_id, id) on delete set null,
  foreign key (organization_id, opportunity_id)
    references public.opportunities(organization_id, id) on delete set null,
  check (priority between 0 and 100),
  check (execution_mode in ('human','assisted','automatic')),
  check (status in ('pending','approved','running','completed','skipped','expired','blocked'))
);

create index if not exists recommended_actions_queue_idx
  on public.recommended_actions(organization_id, business_profile_id, status, priority desc, due_at)
  where status in ('pending','approved','running');

create table if not exists public.integration_health (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null,
  channel text not null default '',
  status text not null default 'not_configured',
  last_success_at timestamptz,
  last_failure_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (organization_id, provider, channel),
  check (status in ('not_configured','connected','degraded','error','disabled'))
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  business_profile_id uuid,
  agent_name text not null,
  status text not null default 'started',
  input_context jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text,
  foreign key (organization_id, business_profile_id)
    references public.business_profiles(organization_id, id) on delete cascade,
  check (agent_name in ('scout','qualifier','sdr','growth','kernel')),
  check (status in ('started','completed','failed','skipped'))
);

create index if not exists agent_runs_org_time_idx
  on public.agent_runs(organization_id, started_at desc);

-- Índices para FKs e escala
create index if not exists activities_created_by_idx on public.activities(created_by);
create index if not exists activities_org_contact_idx on public.activities(organization_id,contact_id);
create index if not exists activities_org_opportunity_idx on public.activities(organization_id,opportunity_id);
create index if not exists agent_runs_org_profile_idx on public.agent_runs(organization_id,business_profile_id);
create index if not exists buying_signals_org_company_idx on public.buying_signals(organization_id,company_id);
create index if not exists buying_signals_org_contact_idx on public.buying_signals(organization_id,contact_id);
create index if not exists channel_permissions_org_company_idx on public.channel_permissions(organization_id,company_id);
create index if not exists company_scores_org_company_idx on public.company_scores(organization_id,company_id);
create index if not exists enrichment_facts_org_contact_idx on public.enrichment_facts(organization_id,contact_id);
create index if not exists opportunities_org_company_idx on public.opportunities(organization_id,company_id);
create index if not exists opportunities_org_primary_contact_idx on public.opportunities(organization_id,primary_contact_id);
create index if not exists opportunities_owner_idx on public.opportunities(owner_user_id);
create index if not exists prospecting_states_org_company_idx on public.prospecting_states(organization_id,company_id);
create index if not exists prospecting_states_owner_idx on public.prospecting_states(owner_user_id);
create index if not exists recommended_actions_assigned_idx on public.recommended_actions(assigned_to);
create index if not exists recommended_actions_org_company_idx on public.recommended_actions(organization_id,company_id);
create index if not exists recommended_actions_org_contact_idx on public.recommended_actions(organization_id,contact_id);
create index if not exists recommended_actions_org_opportunity_idx on public.recommended_actions(organization_id,opportunity_id);

-- RLS e grants
alter table public.business_profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.enrichment_facts enable row level security;
alter table public.buying_signals enable row level security;
alter table public.company_scores enable row level security;
alter table public.prospecting_states enable row level security;
alter table public.opportunities enable row level security;
alter table public.activities enable row level security;
alter table public.channel_permissions enable row level security;
alter table public.recommended_actions enable row level security;
alter table public.integration_health enable row level security;
alter table public.agent_runs enable row level security;

revoke all on table public.business_profiles, public.contacts, public.enrichment_facts,
  public.buying_signals, public.company_scores, public.prospecting_states,
  public.opportunities, public.activities, public.channel_permissions,
  public.recommended_actions, public.integration_health, public.agent_runs
from anon;

grant select, insert, update, delete on table
  public.business_profiles, public.contacts, public.enrichment_facts,
  public.buying_signals, public.company_scores, public.prospecting_states,
  public.opportunities, public.activities, public.channel_permissions,
  public.recommended_actions, public.integration_health, public.agent_runs
to authenticated;

grant all on table
  public.business_profiles, public.contacts, public.enrichment_facts,
  public.buying_signals, public.company_scores, public.prospecting_states,
  public.opportunities, public.activities, public.channel_permissions,
  public.recommended_actions, public.integration_health, public.agent_runs
to service_role;

do $$
declare t text;
begin
  foreach t in array array[
    'business_profiles','contacts','enrichment_facts','buying_signals','company_scores',
    'prospecting_states','opportunities','activities','channel_permissions',
    'recommended_actions','integration_health','agent_runs'
  ]
  loop
    execute format('drop policy if exists member_read on public.%I', t);
    execute format(
      'create policy member_read on public.%I for select to authenticated using (public.is_org_member(organization_id, null))',
      t
    );
  end loop;
end $$;

do $$
declare t text;
begin
  foreach t in array array[
    'contacts','enrichment_facts','buying_signals','company_scores','prospecting_states',
    'opportunities','activities','channel_permissions','recommended_actions'
  ]
  loop
    execute format('drop policy if exists operator_insert on public.%I', t);
    execute format('drop policy if exists operator_update on public.%I', t);
    execute format('drop policy if exists admin_delete on public.%I', t);
    execute format(
      'create policy operator_insert on public.%I for insert to authenticated with check (public.is_org_member(organization_id, ARRAY[''owner'',''admin'',''operator'']::text[]))',
      t
    );
    execute format(
      'create policy operator_update on public.%I for update to authenticated using (public.is_org_member(organization_id, ARRAY[''owner'',''admin'',''operator'']::text[])) with check (public.is_org_member(organization_id, ARRAY[''owner'',''admin'',''operator'']::text[]))',
      t
    );
    execute format(
      'create policy admin_delete on public.%I for delete to authenticated using (public.is_org_member(organization_id, ARRAY[''owner'',''admin'']::text[]))',
      t
    );
  end loop;
end $$;

drop policy if exists admin_insert on public.business_profiles;
drop policy if exists admin_update on public.business_profiles;
drop policy if exists admin_delete on public.business_profiles;
create policy admin_insert on public.business_profiles for insert to authenticated
with check (public.is_org_member(organization_id, ARRAY['owner','admin']::text[]));
create policy admin_update on public.business_profiles for update to authenticated
using (public.is_org_member(organization_id, ARRAY['owner','admin']::text[]))
with check (public.is_org_member(organization_id, ARRAY['owner','admin']::text[]));
create policy admin_delete on public.business_profiles for delete to authenticated
using (public.is_org_member(organization_id, ARRAY['owner','admin']::text[]));

drop policy if exists admin_insert on public.integration_health;
drop policy if exists admin_update on public.integration_health;
drop policy if exists admin_delete on public.integration_health;
create policy admin_insert on public.integration_health for insert to authenticated
with check (public.is_org_member(organization_id, ARRAY['owner','admin']::text[]));
create policy admin_update on public.integration_health for update to authenticated
using (public.is_org_member(organization_id, ARRAY['owner','admin']::text[]))
with check (public.is_org_member(organization_id, ARRAY['owner','admin']::text[]));
create policy admin_delete on public.integration_health for delete to authenticated
using (public.is_org_member(organization_id, ARRAY['owner','admin']::text[]));

drop policy if exists kernel_insert on public.agent_runs;
drop policy if exists kernel_update on public.agent_runs;
drop policy if exists admin_delete on public.agent_runs;
create policy kernel_insert on public.agent_runs for insert to authenticated
with check (public.is_org_member(organization_id, ARRAY['owner','admin','operator']::text[]));
create policy kernel_update on public.agent_runs for update to authenticated
using (public.is_org_member(organization_id, ARRAY['owner','admin','operator']::text[]))
with check (public.is_org_member(organization_id, ARRAY['owner','admin','operator']::text[]));
create policy admin_delete on public.agent_runs for delete to authenticated
using (public.is_org_member(organization_id, ARRAY['owner','admin']::text[]));

drop policy if exists audit_events_read_admins on public.audit_events;
create policy audit_events_read_admins on public.audit_events for select to authenticated
using (
  organization_id is not null
  and public.is_org_member(organization_id, ARRAY['owner','admin']::text[])
);
grant select on public.audit_events to authenticated;

-- Facebook entra como fonte/canal governado.
alter table public.social_prospect_candidates
  drop constraint if exists social_prospect_candidates_platform_check;
alter table public.social_prospect_candidates
  add constraint social_prospect_candidates_platform_check
  check (platform in ('instagram','facebook','linkedin'));

alter table public.social_prospect_candidates
  drop constraint if exists social_prospect_candidates_check;
alter table public.social_prospect_candidates
  add constraint social_prospect_candidates_check
  check (
    (platform='instagram' and profile_url = 'https://www.instagram.com/' || account_key || '/')
    or (platform='facebook' and profile_url = 'https://www.facebook.com/' || account_key || '/')
    or (platform='linkedin' and profile_url = 'https://www.linkedin.com/company/' || account_key || '/')
  );

alter table public.social_prospect_candidates
  drop constraint if exists social_prospect_candidates_check1;
alter table public.social_prospect_candidates
  add constraint social_prospect_candidates_check1
  check (
    (platform in ('instagram','facebook') and source_kind in (
      'manual_corporate_url','first_party_inbound','approved_meta_business_discovery'
    ))
    or (platform='linkedin' and source_kind in ('manual_corporate_url','first_party_inbound'))
  );

alter table public.social_channel_config
  drop constraint if exists social_channel_config_platform_check;
alter table public.social_channel_config
  add constraint social_channel_config_platform_check
  check (platform in ('instagram','facebook','linkedin'));

alter table public.social_channel_config
  drop constraint if exists social_channel_config_check1;
alter table public.social_channel_config
  add constraint social_channel_config_check1
  check (
    not discovery_enabled
    or (platform in ('instagram','facebook') and integration_mode='approved_official_api')
  );

alter table public.social_channel_config
  drop constraint if exists social_channel_config_outbound_enabled_check;
alter table public.social_channel_config
  add constraint social_channel_config_outbound_enabled_check
  check (
    outbound_enabled = false
    or (integration_mode='approved_official_api' and approval_reference is not null)
  );

-- Golden Record
create or replace function public.upsert_company_golden(
  p_organization_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_company_id uuid;
  v_name text;
  v_normalized_name text;
  v_tax_id text;
  v_domain text;
  v_city text;
  v_state text;
  v_source_type text;
  v_confidence numeric(5,2);
begin
  if not public.is_org_member(p_organization_id, ARRAY['owner','admin','operator']::text[]) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_name := coalesce(
    nullif(trim(p_payload->>'legal_name'),''),
    nullif(trim(p_payload->>'trade_name'),''),
    nullif(trim(p_payload->>'company_label'),'')
  );
  if v_name is null then
    raise exception 'company_name_required' using errcode = '22023';
  end if;

  v_normalized_name := lower(regexp_replace(trim(v_name), '\s+', ' ', 'g'));
  v_tax_id := regexp_replace(coalesce(p_payload->>'tax_id',''), '\D', '', 'g');

  if v_tax_id = '' then
    v_tax_id := null;
  elsif length(v_tax_id) <> 14 then
    raise exception 'invalid_tax_id' using errcode = '22023';
  end if;

  v_domain := coalesce(
    nullif(trim(p_payload->>'website_domain'),''),
    nullif(trim(p_payload->>'website_url'),'')
  );

  if v_domain is not null then
    v_domain := lower(
      regexp_replace(
        regexp_replace(
          regexp_replace(v_domain, '^https?://', '', 'i'),
          '^www\.', '', 'i'
        ),
        '/.*$', ''
      )
    );
  end if;

  v_city := nullif(trim(p_payload->>'city'),'');
  v_state := upper(nullif(trim(p_payload->>'state'),''));
  if v_state is not null and length(v_state) <> 2 then
    raise exception 'invalid_state' using errcode = '22023';
  end if;

  v_source_type := coalesce(nullif(p_payload->>'source_type',''),'manual');
  v_confidence := least(100, greatest(0, coalesce((p_payload->>'data_confidence')::numeric,0)));

  select c.id into v_company_id
  from public.companies c
  where c.organization_id = p_organization_id
    and (
      (v_tax_id is not null and c.tax_id = v_tax_id)
      or (
        c.normalized_name = v_normalized_name
        and coalesce(lower(c.city),'') = coalesce(lower(v_city),'')
        and coalesce(c.state,'') = coalesce(v_state,'')
      )
      or (
        v_domain is not null
        and c.website_domain = v_domain
        and c.normalized_name = v_normalized_name
      )
    )
  order by
    case when v_tax_id is not null and c.tax_id = v_tax_id then 1
         when c.normalized_name = v_normalized_name
              and coalesce(lower(c.city),'') = coalesce(lower(v_city),'')
              and coalesce(c.state,'') = coalesce(v_state,'') then 2
         else 3 end
  limit 1;

  if v_company_id is not null then
    update public.companies c
       set tax_id = coalesce(c.tax_id, v_tax_id),
           legal_name = coalesce(nullif(trim(p_payload->>'legal_name'),''), c.legal_name),
           trade_name = coalesce(nullif(trim(p_payload->>'trade_name'),''), c.trade_name),
           website_url = coalesce(nullif(trim(p_payload->>'website_url'),''), c.website_url),
           website_domain = coalesce(v_domain, c.website_domain),
           email = coalesce(nullif(trim(p_payload->>'email'),''), c.email),
           phone = coalesce(nullif(trim(p_payload->>'phone'),''), c.phone),
           address_line = coalesce(nullif(trim(p_payload->>'address_line'),''), c.address_line),
           postal_code = coalesce(nullif(trim(p_payload->>'postal_code'),''), c.postal_code),
           city = coalesce(v_city, c.city),
           state = coalesce(v_state, c.state),
           industry = coalesce(nullif(trim(p_payload->>'industry'),''), c.industry),
           cnae = coalesce(nullif(trim(p_payload->>'cnae'),''), c.cnae),
           employee_band = coalesce(nullif(trim(p_payload->>'employee_band'),''), c.employee_band),
           revenue_band = coalesce(nullif(trim(p_payload->>'revenue_band'),''), c.revenue_band),
           source_type = v_source_type,
           source_reference = coalesce(nullif(trim(p_payload->>'source_reference'),''), c.source_reference),
           data_confidence = greatest(c.data_confidence, v_confidence),
           source_last_seen_at = now(),
           last_enriched_at = case
             when v_source_type in ('api','google','google_maps','website','facebook','instagram','linkedin','enrichment')
             then now()
             else c.last_enriched_at
           end
     where c.id = v_company_id;
    return v_company_id;
  end if;

  insert into public.companies (
    organization_id, tax_id, legal_name, trade_name, city, state,
    source_type, source_reference, website_url, website_domain,
    email, phone, address_line, postal_code, industry, cnae,
    employee_band, revenue_band, data_confidence, last_enriched_at
  ) values (
    p_organization_id, v_tax_id, v_name,
    nullif(trim(p_payload->>'trade_name'),''),
    v_city, v_state,
    v_source_type, nullif(trim(p_payload->>'source_reference'),''),
    nullif(trim(p_payload->>'website_url'),''), v_domain,
    nullif(trim(p_payload->>'email'),''),
    nullif(trim(p_payload->>'phone'),''),
    nullif(trim(p_payload->>'address_line'),''),
    nullif(trim(p_payload->>'postal_code'),''),
    nullif(trim(p_payload->>'industry'),''),
    nullif(trim(p_payload->>'cnae'),''),
    nullif(trim(p_payload->>'employee_band'),''),
    nullif(trim(p_payload->>'revenue_band'),''),
    v_confidence,
    case when v_source_type in ('api','google','google_maps','website','facebook','instagram','linkedin','enrichment')
         then now() else null end
  )
  returning id into v_company_id;

  return v_company_id;
end
$$;

revoke all on function public.upsert_company_golden(uuid, jsonb) from public;
grant execute on function public.upsert_company_golden(uuid, jsonb) to authenticated, service_role;

create or replace function public.prospecting_stage_rank(p_stage text)
returns integer
language sql
immutable
security invoker
set search_path = public, pg_temp
as $$
  select case p_stage
    when 'discovered' then 10
    when 'enriched' then 20
    when 'icp_validated' then 30
    when 'decision_maker_identified' then 40
    when 'contactable' then 50
    when 'prospecting' then 60
    when 'engaged' then 70
    when 'qualified' then 80
    when 'meeting' then 90
    when 'opportunity' then 100
    when 'proposal' then 110
    when 'won' then 120
    when 'lost' then 120
    when 'nurture' then 25
    else 0
  end
$$;

revoke all on function public.prospecting_stage_rank(text) from public;
grant execute on function public.prospecting_stage_rank(text) to authenticated, service_role;

create or replace function public.refresh_company_score(
  p_business_profile_id uuid,
  p_company_id uuid,
  p_icp_fit numeric default null
)
returns public.company_scores
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  v_weights jsonb;
  v_icp numeric := 0;
  v_intent numeric := 0;
  v_contactability numeric := 0;
  v_timing numeric := 0;
  v_engagement numeric := 0;
  v_confidence numeric := 0;
  v_company_conf numeric := 0;
  v_signal_conf numeric := 0;
  v_contact_conf numeric := 0;
  w_icp numeric := 30;
  w_intent numeric := 25;
  w_contact numeric := 15;
  w_timing numeric := 15;
  w_engagement numeric := 15;
  w_total numeric := 100;
  v_total numeric := 0;
  v_stage text := 'discovered';
  v_row public.company_scores%rowtype;
begin
  select bp.organization_id, bp.score_weights, c.data_confidence
    into v_org, v_weights, v_company_conf
  from public.business_profiles bp
  join public.companies c on c.organization_id = bp.organization_id
  where bp.id = p_business_profile_id
    and c.id = p_company_id
    and bp.active = true;

  if v_org is null then
    raise exception 'profile_company_not_found' using errcode = 'P0002';
  end if;

  if not public.is_org_member(v_org, null) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(p_icp_fit, cs.icp_fit, 0)
    into v_icp
  from (select 1) x
  left join public.company_scores cs
    on cs.organization_id=v_org
   and cs.business_profile_id=p_business_profile_id
   and cs.company_id=p_company_id;

  v_icp := least(100, greatest(0, coalesce(v_icp,0)));

  select
    coalesce(max(least(100, s.signal_strength * (s.confidence / 100.0))),0),
    coalesce(max(s.confidence),0),
    coalesce(max(
      least(100,
        s.signal_strength *
        case
          when s.detected_at >= now() - interval '7 days' then 1.00
          when s.detected_at >= now() - interval '30 days' then 0.80
          when s.detected_at >= now() - interval '90 days' then 0.50
          else 0.20
        end
      )
    ),0)
    into v_intent, v_signal_conf, v_timing
  from public.buying_signals s
  where s.organization_id=v_org
    and s.company_id=p_company_id
    and (s.business_profile_id is null or s.business_profile_id=p_business_profile_id)
    and s.status='active'
    and (s.expires_at is null or s.expires_at > now());

  select
    coalesce(max(
      least(100,
        c.data_confidence
        + case when c.email is not null and c.email<>'' then 12 else 0 end
        + case when c.phone is not null and c.phone<>'' then 10 else 0 end
        + case when c.whatsapp is not null and c.whatsapp<>'' then 8 else 0 end
        + case when c.is_decision_maker then 10 else 0 end
      )
    ),0),
    coalesce(max(c.data_confidence),0)
    into v_contactability, v_contact_conf
  from public.contacts c
  where c.organization_id=v_org
    and c.company_id=p_company_id
    and c.active=true
    and c.verification_status <> 'rejected';

  select coalesce(max(
    case lower(coalesce(a.outcome,a.activity_type))
      when 'meeting_held' then 100
      when 'meeting_booked' then 100
      when 'proposal_requested' then 100
      when 'positive_reply' then 95
      when 'replied_positive' then 95
      when 'qualified' then 90
      when 'reply' then 70
      when 'replied' then 70
      when 'clicked' then 60
      when 'click' then 60
      when 'opened' then 25
      when 'open' then 25
      when 'no_answer' then 10
      when 'negative_reply' then 0
      when 'opt_out' then 0
      else 0
    end
  ),0)
  into v_engagement
  from public.activities a
  where a.organization_id=v_org
    and a.company_id=p_company_id
    and (a.business_profile_id is null or a.business_profile_id=p_business_profile_id)
    and a.occurred_at >= now() - interval '60 days';

  w_icp := coalesce((v_weights->>'icp_fit')::numeric,30);
  w_intent := coalesce((v_weights->>'intent')::numeric,25);
  w_contact := coalesce((v_weights->>'contactability')::numeric,15);
  w_timing := coalesce((v_weights->>'timing')::numeric,15);
  w_engagement := coalesce((v_weights->>'engagement')::numeric,15);
  w_total := nullif(w_icp+w_intent+w_contact+w_timing+w_engagement,0);

  v_total := round(least(100, greatest(0,
    (v_icp*w_icp + v_intent*w_intent + v_contactability*w_contact +
     v_timing*w_timing + v_engagement*w_engagement) / coalesce(w_total,100)
  )),2);

  v_confidence := round(least(100, greatest(0,
    (coalesce(v_company_conf,0) + coalesce(v_signal_conf,0) + coalesce(v_contact_conf,0)) / 3.0
  )),2);

  insert into public.company_scores (
    organization_id,business_profile_id,company_id,
    icp_fit,intent,contactability,timing,engagement,total_score,confidence,reasons,scored_at,next_review_at
  ) values (
    v_org,p_business_profile_id,p_company_id,
    round(v_icp,2),round(v_intent,2),round(v_contactability,2),round(v_timing,2),round(v_engagement,2),
    v_total,v_confidence,
    jsonb_build_array(
      jsonb_build_object('component','icp_fit','score',round(v_icp,2)),
      jsonb_build_object('component','intent','score',round(v_intent,2)),
      jsonb_build_object('component','contactability','score',round(v_contactability,2)),
      jsonb_build_object('component','timing','score',round(v_timing,2)),
      jsonb_build_object('component','engagement','score',round(v_engagement,2))
    ),
    now(), now()+interval '24 hours'
  )
  on conflict (organization_id,business_profile_id,company_id)
  do update set
    icp_fit=excluded.icp_fit,
    intent=excluded.intent,
    contactability=excluded.contactability,
    timing=excluded.timing,
    engagement=excluded.engagement,
    total_score=excluded.total_score,
    confidence=excluded.confidence,
    reasons=excluded.reasons,
    scored_at=excluded.scored_at,
    next_review_at=excluded.next_review_at
  returning * into v_row;

  update public.companies c
     set last_signal_at = (
       select max(s.detected_at)
       from public.buying_signals s
       where s.organization_id=v_org and s.company_id=p_company_id and s.status='active'
     )
   where c.organization_id=v_org and c.id=p_company_id;

  if exists (
    select 1 from public.activities a
    where a.organization_id=v_org and a.company_id=p_company_id
      and lower(coalesce(a.outcome,a.activity_type)) in ('meeting_booked','meeting_held')
  ) then
    v_stage := 'meeting';
  elsif v_engagement >= 70 then
    v_stage := 'engaged';
  elsif v_contactability >= 55 then
    v_stage := 'contactable';
  elsif exists (
    select 1 from public.contacts c
    where c.organization_id=v_org and c.company_id=p_company_id
      and c.active and c.is_decision_maker
  ) then
    v_stage := 'decision_maker_identified';
  elsif v_icp >= 60 then
    v_stage := 'icp_validated';
  elsif exists (
    select 1 from public.enrichment_facts e
    where e.organization_id=v_org and e.company_id=p_company_id and e.is_current
  ) then
    v_stage := 'enriched';
  end if;

  insert into public.prospecting_states(
    organization_id,business_profile_id,company_id,stage,stage_reason,entered_stage_at,updated_at
  ) values (
    v_org,p_business_profile_id,p_company_id,v_stage,
    'Atualizado pelo GRIT Score',now(),now()
  )
  on conflict (organization_id,business_profile_id,company_id)
  do update set
    stage = case
      when prospecting_states.stage in ('won','lost') then prospecting_states.stage
      when public.prospecting_stage_rank(excluded.stage) > public.prospecting_stage_rank(prospecting_states.stage)
        then excluded.stage
      else prospecting_states.stage
    end,
    stage_reason = case
      when public.prospecting_stage_rank(excluded.stage) > public.prospecting_stage_rank(prospecting_states.stage)
        then excluded.stage_reason
      else prospecting_states.stage_reason
    end,
    entered_stage_at = case
      when public.prospecting_stage_rank(excluded.stage) > public.prospecting_stage_rank(prospecting_states.stage)
        then now()
      else prospecting_states.entered_stage_at
    end,
    updated_at = now();

  return v_row;
end
$$;

revoke all on function public.refresh_company_score(uuid, uuid, numeric) from public;
grant execute on function public.refresh_company_score(uuid, uuid, numeric) to authenticated, service_role;

create or replace function public.refresh_profile_scores(
  p_business_profile_id uuid,
  p_limit integer default 500
)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  rec record;
  v_count integer := 0;
begin
  select organization_id into v_org
  from public.business_profiles
  where id=p_business_profile_id and active=true;

  if v_org is null then
    raise exception 'business_profile_not_found' using errcode='P0002';
  end if;
  if not public.is_org_member(v_org, null) then
    raise exception 'forbidden' using errcode='42501';
  end if;

  for rec in
    select c.id
    from public.companies c
    where c.organization_id=v_org
    order by c.source_last_seen_at desc, c.created_at desc
    limit greatest(1,least(coalesce(p_limit,500),5000))
  loop
    perform public.refresh_company_score(p_business_profile_id,rec.id,null);
    v_count := v_count + 1;
  end loop;

  return v_count;
end
$$;

revoke all on function public.refresh_profile_scores(uuid, integer) from public;
grant execute on function public.refresh_profile_scores(uuid, integer) to authenticated, service_role;

create or replace function public.refresh_revenue_queue(
  p_business_profile_id uuid,
  p_limit integer default 50
)
returns setof public.recommended_actions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_org uuid;
  rec record;
  v_contact public.contacts%rowtype;
  v_action_type text;
  v_channel text;
  v_execution text;
  v_priority numeric(5,2);
  v_rationale text;
  v_action public.recommended_actions%rowtype;
  v_permission text;
begin
  select organization_id into v_org
  from public.business_profiles
  where id=p_business_profile_id and active=true;

  if v_org is null then
    raise exception 'business_profile_not_found' using errcode='P0002';
  end if;
  if not public.is_org_member(v_org, null) then
    raise exception 'forbidden' using errcode='42501';
  end if;

  update public.recommended_actions
     set status='expired', updated_at=now()
   where organization_id=v_org
     and business_profile_id=p_business_profile_id
     and status in ('pending','approved')
     and expires_at is not null
     and expires_at <= now();

  for rec in
    select cs.*, c.legal_name, c.trade_name, ps.stage
    from public.company_scores cs
    join public.companies c
      on c.organization_id=cs.organization_id and c.id=cs.company_id
    left join public.prospecting_states ps
      on ps.organization_id=cs.organization_id
     and ps.business_profile_id=cs.business_profile_id
     and ps.company_id=cs.company_id
    where cs.organization_id=v_org
      and cs.business_profile_id=p_business_profile_id
      and cs.total_score >= 40
      and coalesce(ps.stage,'discovered') not in ('won','lost')
      and not exists (
        select 1
        from public.recommended_actions ra
        where ra.organization_id=cs.organization_id
          and ra.business_profile_id=cs.business_profile_id
          and ra.company_id=cs.company_id
          and ra.status in ('pending','approved','running')
      )
    order by cs.total_score desc, cs.intent desc, cs.timing desc, cs.scored_at desc
    limit greatest(1,least(coalesce(p_limit,50),200))
  loop
    select c.* into v_contact
    from public.contacts c
    where c.organization_id=v_org
      and c.company_id=rec.company_id
      and c.active=true
      and c.verification_status <> 'rejected'
    order by
      c.is_decision_maker desc,
      case when c.email is not null or c.phone is not null or c.whatsapp is not null then 1 else 0 end desc,
      c.data_confidence desc,
      c.updated_at desc
    limit 1;

    v_action_type := 'research_account';
    v_channel := 'research';
    v_execution := 'human';

    if v_contact.id is null then
      v_action_type := 'find_decision_maker';
    elsif rec.engagement >= 70 then
      if v_contact.phone is not null and v_contact.phone<>'' then
        v_action_type := 'follow_up_engaged';
        v_channel := 'phone';
      elsif v_contact.email is not null and v_contact.email<>'' then
        v_action_type := 'follow_up_engaged';
        v_channel := 'email';
        v_execution := 'assisted';
      end if;
    elsif rec.total_score >= 80 and v_contact.phone is not null and v_contact.phone<>'' then
      v_action_type := 'call_decision_maker';
      v_channel := 'phone';
    elsif rec.intent >= 60 and v_contact.email is not null and v_contact.email<>'' then
      v_action_type := 'signal_based_email';
      v_channel := 'email';
      v_execution := 'assisted';
    elsif v_contact.email is not null and v_contact.email<>'' then
      v_action_type := 'personalized_email';
      v_channel := 'email';
      v_execution := 'assisted';
    elsif v_contact.whatsapp is not null and v_contact.whatsapp<>'' then
      select cp.permission_status into v_permission
      from public.channel_permissions cp
      where cp.organization_id=v_org
        and cp.contact_id=v_contact.id
        and cp.channel='whatsapp'
      order by cp.observed_at desc
      limit 1;

      if v_permission='allowed' then
        v_action_type := 'whatsapp_followup';
        v_channel := 'whatsapp';
        v_execution := 'assisted';
      else
        v_action_type := 'verify_contact_channel';
      end if;
    end if;

    if v_channel in ('email','phone','whatsapp','linkedin','facebook','instagram') then
      select cp.permission_status into v_permission
      from public.channel_permissions cp
      where cp.organization_id=v_org
        and (cp.contact_id=v_contact.id or (cp.contact_id is null and cp.company_id=rec.company_id))
        and cp.channel=v_channel
      order by cp.contact_id nulls last, cp.observed_at desc
      limit 1;

      if v_permission in ('blocked','opted_out') then
        v_action_type := 'review_suppression';
        v_channel := 'research';
        v_execution := 'human';
      end if;
    end if;

    v_priority := least(100,
      rec.total_score
      + case when rec.intent >= 70 then 5 else 0 end
      + case when rec.timing >= 70 then 5 else 0 end
    );

    v_rationale := format(
      'GRIT Score %s/100 · ICP %s · intenção %s · contatabilidade %s · timing %s · engajamento %s. %s',
      round(rec.total_score,0),
      round(rec.icp_fit,0),
      round(rec.intent,0),
      round(rec.contactability,0),
      round(rec.timing,0),
      round(rec.engagement,0),
      case
        when rec.intent >= 70 then 'Há sinal forte de intenção; priorizar agora.'
        when rec.engagement >= 70 then 'Já existe engajamento; follow-up é a ação de maior valor.'
        when rec.contactability >= 60 then 'Há decisor/contato utilizável; executar abordagem contextual.'
        else 'Completar dados e decisor antes de abordar.'
      end
    );

    insert into public.recommended_actions(
      organization_id,business_profile_id,company_id,contact_id,
      action_type,channel,priority,execution_mode,status,rationale,payload,due_at,expires_at
    ) values (
      v_org,p_business_profile_id,rec.company_id,v_contact.id,
      v_action_type,v_channel,v_priority,v_execution,'pending',v_rationale,
      jsonb_build_object(
        'score',rec.total_score,
        'confidence',rec.confidence,
        'stage',coalesce(rec.stage,'discovered'),
        'company_name',coalesce(rec.trade_name,rec.legal_name),
        'requires_human_approval',(v_execution <> 'human')
      ),
      now(),
      now()+interval '72 hours'
    )
    returning * into v_action;

    return next v_action;
  end loop;

  return;
end
$$;

revoke all on function public.refresh_revenue_queue(uuid, integer) from public;
grant execute on function public.refresh_revenue_queue(uuid, integer) to authenticated, service_role;

create or replace function public.complete_recommended_action(
  p_action_id uuid,
  p_outcome text,
  p_metadata jsonb default '{}'::jsonb
)
returns public.recommended_actions
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_action public.recommended_actions%rowtype;
  v_stage text;
begin
  select * into v_action
  from public.recommended_actions
  where id=p_action_id
  for update;

  if v_action.id is null then
    raise exception 'action_not_found' using errcode='P0002';
  end if;

  if not public.is_org_member(v_action.organization_id, ARRAY['owner','admin','operator']::text[]) then
    raise exception 'forbidden' using errcode='42501';
  end if;

  update public.recommended_actions
     set status='completed',
         completed_at=now(),
         outcome=p_outcome,
         updated_at=now()
   where id=p_action_id
   returning * into v_action;

  insert into public.activities(
    organization_id,business_profile_id,company_id,contact_id,opportunity_id,
    activity_type,channel,direction,outcome,sentiment,metadata,occurred_at,created_by
  ) values (
    v_action.organization_id,v_action.business_profile_id,v_action.company_id,v_action.contact_id,v_action.opportunity_id,
    v_action.action_type,v_action.channel,
    case when v_action.channel='research' then 'internal' else 'outbound' end,
    p_outcome,
    case
      when lower(coalesce(p_outcome,'')) in ('positive_reply','replied_positive','meeting_booked','meeting_held','qualified') then 'positive'
      when lower(coalesce(p_outcome,'')) in ('negative_reply','rejected','opt_out') then 'negative'
      else 'neutral'
    end,
    coalesce(p_metadata,'{}'::jsonb),
    now(),
    (select auth.uid())
  );

  v_stage := case lower(coalesce(p_outcome,''))
    when 'meeting_booked' then 'meeting'
    when 'meeting_held' then 'meeting'
    when 'qualified' then 'qualified'
    when 'positive_reply' then 'engaged'
    when 'replied_positive' then 'engaged'
    else 'prospecting'
  end;

  update public.prospecting_states
     set last_activity_at=now(),
         updated_at=now(),
         stage=case
           when stage in ('won','lost') then stage
           when public.prospecting_stage_rank(v_stage) > public.prospecting_stage_rank(stage) then v_stage
           else stage
         end,
         entered_stage_at=case
           when public.prospecting_stage_rank(v_stage) > public.prospecting_stage_rank(stage) then now()
           else entered_stage_at
         end,
         stage_reason=case
           when public.prospecting_stage_rank(v_stage) > public.prospecting_stage_rank(stage)
             then 'Resultado de ação: '||coalesce(p_outcome,'')
           else stage_reason
         end
   where organization_id=v_action.organization_id
     and business_profile_id=v_action.business_profile_id
     and company_id=v_action.company_id;

  if lower(coalesce(p_outcome,''))='opt_out'
     and v_action.channel in ('email','phone','whatsapp','linkedin','facebook','instagram')
  then
    insert into public.channel_permissions(
      organization_id,company_id,contact_id,channel,permission_status,lawful_basis,source_reference,observed_at
    ) values (
      v_action.organization_id,v_action.company_id,v_action.contact_id,v_action.channel,'opted_out',null,
      'recommended_action:'||v_action.id::text,now()
    );
  end if;

  perform public.refresh_company_score(v_action.business_profile_id,v_action.company_id,null);
  return v_action;
end
$$;

revoke all on function public.complete_recommended_action(uuid, text, jsonb) from public;
grant execute on function public.complete_recommended_action(uuid, text, jsonb) to authenticated, service_role;

create or replace view public.revenue_queue_v
with (security_invoker = true)
as
select
  ra.id as action_id,
  ra.organization_id,
  ra.business_profile_id,
  bp.name as business_profile,
  ra.company_id,
  coalesce(c.trade_name,c.legal_name) as company_name,
  c.city,
  c.state,
  cs.total_score as grit_score,
  cs.confidence as score_confidence,
  cs.icp_fit,
  cs.intent,
  cs.contactability,
  cs.timing,
  cs.engagement,
  ps.stage,
  ra.contact_id,
  ct.full_name as contact_name,
  ct.job_title,
  ct.is_decision_maker,
  ra.action_type,
  ra.channel,
  ra.priority,
  ra.execution_mode,
  ra.status,
  ra.rationale,
  ra.payload,
  ra.due_at,
  ra.expires_at,
  ra.assigned_to
from public.recommended_actions ra
join public.business_profiles bp
  on bp.organization_id=ra.organization_id and bp.id=ra.business_profile_id
join public.companies c
  on c.organization_id=ra.organization_id and c.id=ra.company_id
left join public.company_scores cs
  on cs.organization_id=ra.organization_id
 and cs.business_profile_id=ra.business_profile_id
 and cs.company_id=ra.company_id
left join public.prospecting_states ps
  on ps.organization_id=ra.organization_id
 and ps.business_profile_id=ra.business_profile_id
 and ps.company_id=ra.company_id
left join public.contacts ct
  on ct.organization_id=ra.organization_id and ct.id=ra.contact_id
where ra.status in ('pending','approved','running')
order by ra.priority desc, ra.due_at asc;

create or replace view public.profile_revenue_summary_v
with (security_invoker = true)
as
select
  bp.organization_id,
  bp.id as business_profile_id,
  bp.name as business_profile,
  bp.slug,
  (select count(*) from public.company_scores cs
    where cs.organization_id=bp.organization_id and cs.business_profile_id=bp.id) as scored_accounts,
  (select count(*) from public.company_scores cs
    where cs.organization_id=bp.organization_id and cs.business_profile_id=bp.id and cs.total_score>=80) as hot_accounts,
  (select count(*) from public.company_scores cs
    where cs.organization_id=bp.organization_id and cs.business_profile_id=bp.id and cs.total_score>=60 and cs.total_score<80) as warm_accounts,
  (select count(*) from public.company_scores cs
    where cs.organization_id=bp.organization_id and cs.business_profile_id=bp.id and cs.total_score>=40 and cs.total_score<60) as nurture_accounts,
  (select count(*) from public.prospecting_states ps
    where ps.organization_id=bp.organization_id and ps.business_profile_id=bp.id
      and ps.stage in ('contactable','prospecting','engaged','qualified','meeting','opportunity','proposal')) as contactable_or_beyond,
  (select count(*) from public.prospecting_states ps
    where ps.organization_id=bp.organization_id and ps.business_profile_id=bp.id and ps.stage='engaged') as engaged_accounts,
  (select count(*) from public.prospecting_states ps
    where ps.organization_id=bp.organization_id and ps.business_profile_id=bp.id and ps.stage='meeting') as meeting_accounts,
  (select count(*) from public.buying_signals bs
    where bs.organization_id=bp.organization_id
      and (bs.business_profile_id is null or bs.business_profile_id=bp.id)
      and bs.status='active' and bs.detected_at>=now()-interval '7 days') as signals_7d,
  (select count(*) from public.recommended_actions ra
    where ra.organization_id=bp.organization_id and ra.business_profile_id=bp.id
      and ra.status in ('pending','approved','running')) as open_actions,
  (select count(*) from public.recommended_actions ra
    where ra.organization_id=bp.organization_id and ra.business_profile_id=bp.id
      and ra.status in ('pending','approved','running') and ra.due_at<now()) as overdue_actions,
  (select count(*) from public.opportunities o
    where o.organization_id=bp.organization_id and o.business_profile_id=bp.id and o.status='open') as open_opportunities,
  (select coalesce(sum(o.amount),0) from public.opportunities o
    where o.organization_id=bp.organization_id and o.business_profile_id=bp.id and o.status='open') as pipeline_value
from public.business_profiles bp
where bp.active=true;

create or replace view public.account_360_v
with (security_invoker = true)
as
select
  c.organization_id,
  bp.id as business_profile_id,
  bp.name as business_profile,
  c.id as company_id,
  coalesce(c.trade_name,c.legal_name) as company_name,
  c.tax_id,
  c.city,
  c.state,
  c.website_domain,
  c.industry,
  c.cnae,
  c.data_confidence as account_confidence,
  cs.total_score as grit_score,
  cs.confidence as score_confidence,
  cs.icp_fit,
  cs.intent,
  cs.contactability,
  cs.timing,
  cs.engagement,
  ps.stage,
  ps.stage_reason,
  ps.last_activity_at,
  ps.next_action_at,
  (select count(*) from public.contacts ct
    where ct.organization_id=c.organization_id and ct.company_id=c.id and ct.active=true) as active_contacts,
  (select count(*) from public.contacts ct
    where ct.organization_id=c.organization_id and ct.company_id=c.id and ct.active=true and ct.is_decision_maker=true) as decision_makers,
  (select count(*) from public.buying_signals s
    where s.organization_id=c.organization_id and s.company_id=c.id
      and (s.business_profile_id is null or s.business_profile_id=bp.id)
      and s.status='active') as active_signals,
  (select count(*) from public.opportunities o
    where o.organization_id=c.organization_id and o.company_id=c.id
      and o.business_profile_id=bp.id and o.status='open') as open_opportunities,
  (select ra.id from public.recommended_actions ra
    where ra.organization_id=c.organization_id and ra.business_profile_id=bp.id
      and ra.company_id=c.id and ra.status in ('pending','approved','running')
    order by ra.priority desc,ra.due_at asc limit 1) as next_action_id,
  (select ra.action_type from public.recommended_actions ra
    where ra.organization_id=c.organization_id and ra.business_profile_id=bp.id
      and ra.company_id=c.id and ra.status in ('pending','approved','running')
    order by ra.priority desc,ra.due_at asc limit 1) as next_action_type,
  (select ra.channel from public.recommended_actions ra
    where ra.organization_id=c.organization_id and ra.business_profile_id=bp.id
      and ra.company_id=c.id and ra.status in ('pending','approved','running')
    order by ra.priority desc,ra.due_at asc limit 1) as next_action_channel,
  (select ra.priority from public.recommended_actions ra
    where ra.organization_id=c.organization_id and ra.business_profile_id=bp.id
      and ra.company_id=c.id and ra.status in ('pending','approved','running')
    order by ra.priority desc,ra.due_at asc limit 1) as next_action_priority,
  (select ra.rationale from public.recommended_actions ra
    where ra.organization_id=c.organization_id and ra.business_profile_id=bp.id
      and ra.company_id=c.id and ra.status in ('pending','approved','running')
    order by ra.priority desc,ra.due_at asc limit 1) as next_action_rationale
from public.companies c
join public.business_profiles bp
  on bp.organization_id=c.organization_id and bp.active=true
left join public.company_scores cs
  on cs.organization_id=c.organization_id and cs.business_profile_id=bp.id and cs.company_id=c.id
left join public.prospecting_states ps
  on ps.organization_id=c.organization_id and ps.business_profile_id=bp.id and ps.company_id=c.id;

revoke all on public.revenue_queue_v, public.profile_revenue_summary_v, public.account_360_v from anon;
grant select on public.revenue_queue_v, public.profile_revenue_summary_v, public.account_360_v to authenticated, service_role;

commit;
