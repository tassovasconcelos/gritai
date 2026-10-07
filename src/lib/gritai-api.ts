import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "../database.types";

export type GritClient = SupabaseClient<Database>;

export type OrchestratorMode = "score_and_queue" | "queue_only";

export type ActionOutcome =
  | "positive_reply"
  | "negative_reply"
  | "no_answer"
  | "meeting_booked"
  | "meeting_held"
  | "qualified"
  | "opt_out"
  | "invalid_contact";

export async function listBusinessProfiles(client: GritClient) {
  const { data, error } = await client
    .from("business_profiles")
    .select("id,organization_id,slug,name,segment,website,primary_goal,active")
    .eq("active", true)
    .order("name");

  if (error) throw error;
  return data;
}

export async function getProfileRevenueSummary(
  client: GritClient,
  businessProfileId: string,
) {
  const { data, error } = await client
    .from("profile_revenue_summary_v")
    .select("*")
    .eq("business_profile_id", businessProfileId)
    .single();

  if (error) throw error;
  return data;
}

export async function getRevenueQueue(
  client: GritClient,
  businessProfileId: string,
) {
  const { data, error } = await client
    .from("revenue_queue_v")
    .select("*")
    .eq("business_profile_id", businessProfileId)
    .order("priority", { ascending: false })
    .order("due_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getAccount360(
  client: GritClient,
  businessProfileId: string,
  companyId: string,
) {
  const { data, error } = await client
    .from("account_360_v")
    .select("*")
    .eq("business_profile_id", businessProfileId)
    .eq("company_id", companyId)
    .single();

  if (error) throw error;
  return data;
}

export async function runRevenueOrchestrator(
  client: GritClient,
  businessProfileId: string,
  mode: OrchestratorMode = "score_and_queue",
  limit = 200,
) {
  const { data, error } = await client.functions.invoke("gritai-orchestrator", {
    body: {
      business_profile_id: businessProfileId,
      mode,
      limit,
    },
  });

  if (error) throw error;
  return data as {
    ok: boolean;
    user_id: string;
    business_profile_id: string;
    mode: OrchestratorMode;
    scored_companies: number;
    generated_actions: number;
    queue: Database["public"]["Views"]["revenue_queue_v"]["Row"][];
    executed_at: string;
  };
}

export async function completeRecommendedAction(
  client: GritClient,
  actionId: string,
  outcome: ActionOutcome,
  metadata: Json = {},
) {
  const { data, error } = await client.rpc("complete_recommended_action", {
    p_action_id: actionId,
    p_outcome: outcome,
    p_metadata: metadata,
  });

  if (error) throw error;
  return data;
}

export async function upsertGoldenCompany(
  client: GritClient,
  organizationId: string,
  payload: Json,
) {
  const { data, error } = await client.rpc("upsert_company_golden", {
    p_organization_id: organizationId,
    p_payload: payload,
  });

  if (error) throw error;
  return data;
}

export async function bootstrapWorkspace(
  client: GritClient,
  userId: string,
) {
  const { data, error } = await client.rpc("bootstrap_first_owner", {
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
}
