-- GRITaÍ Revenue Engine V2 — bootstrap e perfis padrão

create or replace function public.seed_default_business_profiles(p_organization_id uuid)
returns integer
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_count integer := 0;
begin
  if not public.is_org_member(p_organization_id, ARRAY['owner','admin']::text[]) then
    raise exception 'forbidden' using errcode='42501';
  end if;

  insert into public.business_profiles(
    organization_id,slug,name,segment,website,value_proposition,primary_goal,
    icp_rules,target_personas,channel_policy
  ) values
  (
    p_organization_id,'procirurgica','Procirúrgica',
    'Dispositivos e equipamentos médico-hospitalares',null,
    'Equipamentos e soluções médico-hospitalares com inteligência comercial por conta, região e demanda.',
    'Gerar reuniões, oportunidades e vendas B2B qualificadas.',
    '{"focus":["hospitais","home care","distribuidores","operadoras","compras hospitalares"]}'::jsonb,
    '["compras","suprimentos","diretoria","enfermagem","engenharia clínica","logística"]'::jsonb,
    '{"email":"assisted","phone":"human","whatsapp":"allowed_only","linkedin":"human","facebook":"signal","instagram":"signal"}'::jsonb
  ),
  (
    p_organization_id,'prohospital','Prohospital',
    'Distribuição médico-hospitalar',null,
    'Distribuição e relacionamento comercial com instituições de saúde.',
    'Priorizar contas com maior potencial de recompra, expansão e mix.',
    '{"focus":["hospitais","clínicas","home care","operadoras","instituições de saúde"]}'::jsonb,
    '["compras","suprimentos","diretoria","farmácia","enfermagem","financeiro"]'::jsonb,
    '{"email":"assisted","phone":"human","whatsapp":"allowed_only","linkedin":"human","facebook":"signal","instagram":"signal"}'::jsonb
  ),
  (
    p_organization_id,'shopping-prohospital','Shopping Prohospital',
    'Varejo, e-commerce e locação médico-hospitalar',null,
    'Soluções de compra e locação para pacientes, famílias, profissionais e instituições.',
    'Gerar demanda qualificada, locação, venda e relacionamento recorrente.',
    '{"focus":["familias","pacientes","home care","clinicas","profissionais de saúde"]}'::jsonb,
    '["familia","paciente","cuidador","profissional de saúde","gestor de home care"]'::jsonb,
    '{"email":"assisted","phone":"human","whatsapp":"allowed_only","facebook":"signal","instagram":"signal"}'::jsonb
  ),
  (
    p_organization_id,'meu-cuidador','Meu Cuidador',
    'Ecossistema e marketplace de cuidado','https://meucuidadorapp.com.br',
    'Conectar famílias, pacientes, cuidadores, profissionais, empresas e parceiros do ecossistema de cuidado.',
    'Gerar cadastros, ativações, matching, parcerias e receita.',
    '{"focus":["familias","cuidadores","enfermagem","ILPI","home care","hospitais","parceiros"]}'::jsonb,
    '["familia","cuidador","enfermeiro","técnico","médico","gestor de ILPI","gestor de home care","parceiro"]'::jsonb,
    '{"email":"assisted","phone":"human","whatsapp":"allowed_only","linkedin":"human","facebook":"signal","instagram":"signal"}'::jsonb
  ),
  (
    p_organization_id,'grit-solucoes','GRIT Soluções e Negócios',
    'Consultoria, tecnologia, inteligência comercial, automação e SaaS','https://gritnews.com.br',
    'Transformar gargalos comerciais e operacionais em crescimento mensurável com processo, tecnologia e execução.',
    'Gerar diagnóstico, reunião consultiva, proposta e contrato.',
    '{"focus":["PME","serviços","saúde","varejo","logística","indústria","provedores","operações comerciais"]}'::jsonb,
    '["sócio","CEO","diretor","gerente comercial","gerente operacional","marketing","tecnologia"]'::jsonb,
    '{"email":"assisted","phone":"human","whatsapp":"allowed_only","linkedin":"human","facebook":"signal","instagram":"signal"}'::jsonb
  ),
  (
    p_organization_id,'meu-espetinho','Meu Espetinho',
    'SaaS para operação de food service',null,
    'Digitalizar operação, pedidos, estoque e gestão de pequenos negócios de espetinhos e alimentação.',
    'Gerar trials, ativações e assinaturas.',
    '{"focus":["espetinhos","bares","quiosques","food service","pequenos restaurantes"]}'::jsonb,
    '["proprietário","gerente","operador"]'::jsonb,
    '{"email":"assisted","phone":"human","whatsapp":"allowed_only","facebook":"signal","instagram":"signal"}'::jsonb
  ),
  (
    p_organization_id,'sr-padeiro','SR Padeiro',
    'Soluções digitais para panificação e pequenos negócios',null,
    'Simplificar gestão e operação comercial de negócios de panificação.',
    'Gerar leads, demonstrações, testes e assinaturas.',
    '{"focus":["padarias","panificadoras","confeitarias","pequenos negócios de alimentação"]}'::jsonb,
    '["proprietário","gerente","administrador"]'::jsonb,
    '{"email":"assisted","phone":"human","whatsapp":"allowed_only","facebook":"signal","instagram":"signal"}'::jsonb
  )
  on conflict (organization_id,slug)
  do update set
    name=excluded.name,
    segment=excluded.segment,
    website=coalesce(excluded.website,business_profiles.website),
    value_proposition=excluded.value_proposition,
    primary_goal=excluded.primary_goal,
    icp_rules=excluded.icp_rules,
    target_personas=excluded.target_personas,
    channel_policy=excluded.channel_policy,
    active=true,
    updated_at=now();

  get diagnostics v_count = row_count;
  return v_count;
end
$$;

revoke all on function public.seed_default_business_profiles(uuid) from public;
grant execute on function public.seed_default_business_profiles(uuid) to authenticated, service_role;

create or replace function public.bootstrap_first_owner(p_user_id uuid)
returns jsonb
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_org public.organizations%rowtype;
  v_existing public.memberships%rowtype;
begin
  if p_user_id is null then
    raise exception 'owner_user_required' using errcode='22023';
  end if;

  if current_user <> 'service_role'
     and ((select auth.uid()) is null or p_user_id <> (select auth.uid()))
  then
    raise exception 'cannot_bootstrap_another_user' using errcode='42501';
  end if;

  if exists (select 1 from public.memberships) then
    select m.* into v_existing
    from public.memberships m
    join public.organizations o on o.id=m.organization_id
    where m.user_id=p_user_id
      and m.active
      and m.role='owner'
      and o.slug='grit-solucoes-e-negocios';

    if found and (select count(*) from public.memberships)=1 then
      perform public.seed_default_business_profiles(v_existing.organization_id);
      return jsonb_build_object(
        'status','already_activated',
        'organization_id',v_existing.organization_id,
        'user_id',p_user_id
      );
    end if;

    raise exception 'first_owner_already_initialized' using errcode='23505';
  end if;

  if exists (
    select 1 from public.organizations
    where slug <> 'grit-solucoes-e-negocios'
  ) then
    raise exception 'unexpected_organization_exists' using errcode='23505';
  end if;

  insert into public.organizations(name,slug)
  values ('GRIT Soluções e Negócios','grit-solucoes-e-negocios')
  on conflict (slug) do nothing;

  select * into strict v_org
  from public.organizations
  where slug='grit-solucoes-e-negocios'
  for update;

  insert into public.memberships(organization_id,user_id,role,active)
  values (v_org.id,p_user_id,'owner',true);

  perform public.seed_default_business_profiles(v_org.id);

  insert into public.audit_events(
    organization_id,actor_user_id,entity_type,entity_id,event_type,event_metadata
  ) values (
    v_org.id,p_user_id,'membership',p_user_id,'first_owner_activated',
    jsonb_build_object('method','authenticated_bootstrap','profiles_seeded',true)
  );

  return jsonb_build_object(
    'status','activated',
    'organization_id',v_org.id,
    'user_id',p_user_id
  );
end
$$;

revoke all on function public.bootstrap_first_owner(uuid) from public;
grant execute on function public.bootstrap_first_owner(uuid) to authenticated, service_role;
