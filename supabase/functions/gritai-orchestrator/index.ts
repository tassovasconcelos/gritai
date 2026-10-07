import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function getPublishableKey() {
  const legacy = Deno.env.get("SUPABASE_ANON_KEY");
  if (legacy) return legacy;

  try {
    const map = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}");
    const envName = map?.default;
    if (envName) {
      const value = Deno.env.get(envName);
      if (value) return value;
    }
  } catch {
    // handled below
  }

  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const publishableKey = getPublishableKey();
  if (!supabaseUrl || !publishableKey) return json({ error: "supabase_runtime_not_configured" }, 500);

  const supabase = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return json({ error: "unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const businessProfileId = String(body?.business_profile_id ?? "");
  const mode = String(body?.mode ?? "score_and_queue");
  const limit = Math.max(1, Math.min(Number(body?.limit ?? 200), 1000));

  if (!businessProfileId) return json({ error: "business_profile_id_required" }, 400);
  if (!["score_and_queue", "queue_only"].includes(mode)) return json({ error: "invalid_mode" }, 400);

  try {
    let scored = 0;

    if (mode === "score_and_queue") {
      const { data, error } = await supabase.rpc("refresh_profile_scores", {
        p_business_profile_id: businessProfileId,
        p_limit: limit,
      });
      if (error) throw new Error(`score_refresh_failed: ${error.message}`);
      scored = Number(data ?? 0);
    }

    const { data: generated, error: queueError } = await supabase.rpc("refresh_revenue_queue", {
      p_business_profile_id: businessProfileId,
      p_limit: Math.min(limit, 200),
    });
    if (queueError) throw new Error(`queue_refresh_failed: ${queueError.message}`);

    const { data: queue, error: listError } = await supabase
      .from("revenue_queue_v")
      .select("*")
      .eq("business_profile_id", businessProfileId)
      .order("priority", { ascending: false })
      .order("due_at", { ascending: true })
      .limit(100);

    if (listError) throw new Error(`queue_read_failed: ${listError.message}`);

    return json({
      ok: true,
      user_id: userData.user.id,
      business_profile_id: businessProfileId,
      mode,
      scored_companies: scored,
      generated_actions: Array.isArray(generated) ? generated.length : 0,
      queue: queue ?? [],
      executed_at: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return json({ error: "orchestration_failed", detail: message }, 400);
  }
});
