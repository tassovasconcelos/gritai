drop view if exists public.revenue_queue_v;

create view public.revenue_queue_v
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
  ct.email as contact_email,
  ct.phone as contact_phone,
  ct.whatsapp as contact_whatsapp,
  ct.linkedin_url as contact_linkedin_url,
  ct.facebook_url as contact_facebook_url,
  ct.instagram_url as contact_instagram_url,
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
  on cs.organization_id=ra.organization_id and cs.business_profile_id=ra.business_profile_id and cs.company_id=ra.company_id
left join public.prospecting_states ps
  on ps.organization_id=ra.organization_id and ps.business_profile_id=ra.business_profile_id and ps.company_id=ra.company_id
left join public.contacts ct
  on ct.organization_id=ra.organization_id and ct.id=ra.contact_id
where ra.status in ('pending','approved','running')
order by ra.priority desc,ra.due_at asc;

revoke all on public.revenue_queue_v from anon;
grant select on public.revenue_queue_v to authenticated, service_role;
