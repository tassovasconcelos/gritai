import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity, Building2, CalendarDays, CircleDollarSign, Flame, LogOut,
  Radio, RefreshCw, Sparkles, Target, Clock3, CheckCircle2,
} from "lucide-react";
import type { Database } from "./database.types";
import { AuthGate } from "./components/AuthGate";
import { MetricCard } from "./components/MetricCard";
import { RevenueQueue } from "./components/RevenueQueue";
import { AccountDrawer } from "./components/AccountDrawer";
import { supabase } from "./lib/supabase";
import {
  bootstrapWorkspace, completeRecommendedAction, getAccount360,
  getProfileRevenueSummary, getRevenueQueue, listBusinessProfiles,
  runRevenueOrchestrator, type ActionOutcome,
} from "./lib/gritai-api";

type Profile = Awaited<ReturnType<typeof listBusinessProfiles>>[number];
type QueueRow = Database["public"]["Views"]["revenue_queue_v"]["Row"];
type Summary = Database["public"]["Views"]["profile_revenue_summary_v"]["Row"];
type Account = Database["public"]["Views"]["account_360_v"]["Row"];

function compact(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR",{notation:"compact",maximumFractionDigits:1}).format(Number(value||0));
}
function money(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL",maximumFractionDigits:0}).format(Number(value||0));
}

function Workspace({ session }: { session: Session }) {
  const [profiles,setProfiles]=useState<Profile[]>([]);
  const [profileId,setProfileId]=useState("");
  const [summary,setSummary]=useState<Summary|null>(null);
  const [queue,setQueue]=useState<QueueRow[]>([]);
  const [account,setAccount]=useState<Account|null>(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [notice,setNotice]=useState("");

  const loadProfiles=useCallback(async()=>{
    if(!supabase) return;
    const rows=await listBusinessProfiles(supabase);
    setProfiles(rows);
    if(rows.length){
      const saved=localStorage.getItem("gritai:profile");
      const selected=rows.find(p=>p.id===saved)?.id||rows[0].id;
      setProfileId(current=>current||selected);
    }
  },[]);

  const loadWorkspace=useCallback(async(id:string)=>{
    if(!supabase||!id) return;
    const [s,q]=await Promise.all([
      getProfileRevenueSummary(supabase,id),
      getRevenueQueue(supabase,id),
    ]);
    setSummary(s); setQueue(q);
  },[]);

  useEffect(()=>{
    setLoading(true);
    loadProfiles().catch(e=>setNotice(String(e))).finally(()=>setLoading(false));
  },[loadProfiles]);

  useEffect(()=>{
    if(!profileId) return;
    localStorage.setItem("gritai:profile",profileId);
    setAccount(null); setLoading(true);
    loadWorkspace(profileId).catch(e=>setNotice(String(e))).finally(()=>setLoading(false));
  },[profileId,loadWorkspace]);

  async function activate(){
    if(!supabase) return;
    setBusy(true); setNotice("");
    try{
      await bootstrapWorkspace(supabase,session.user.id);
      await loadProfiles();
      setNotice("Workspace ativado com os perfis operacionais.");
    }catch(e){setNotice(String(e));}
    finally{setBusy(false);}
  }

  async function orchestrate(){
    if(!supabase||!profileId) return;
    setBusy(true); setNotice("");
    try{
      const result=await runRevenueOrchestrator(supabase,profileId,"score_and_queue",500);
      await loadWorkspace(profileId);
      setNotice("Motor atualizado: "+result.scored_companies+" contas recalculadas e "+result.generated_actions+" novas ações.");
    }catch(e){setNotice(String(e));}
    finally{setBusy(false);}
  }

  async function outcome(row:QueueRow,value:ActionOutcome){
    if(!supabase||!row.action_id) return;
    setBusy(true); setNotice("");
    try{
      await completeRecommendedAction(supabase,row.action_id,value,{ui:"revenue_console_v2"});
      await runRevenueOrchestrator(supabase,profileId,"queue_only",100);
      await loadWorkspace(profileId);
      setAccount(null);
      setNotice("Resultado registrado. Score e fila recalculados.");
    }catch(e){setNotice(String(e));}
    finally{setBusy(false);}
  }

  async function openAccount(row:QueueRow){
    if(!supabase||!profileId||!row.company_id) return;
    try{setAccount(await getAccount360(supabase,profileId,row.company_id));}
    catch(e){setNotice(String(e));}
  }

  if(!loading&&profiles.length===0){
    return <div className="center-screen workspace-empty">
      <Sparkles size={36}/><small className="eyebrow">WORKSPACE NÃO ATIVADO</small>
      <h1>Núcleo pronto para receber a operação.</h1>
      <p>O owner precisa de autorização administrativa de bootstrap antes da primeira ativação.</p>
      <button className="primary" disabled={busy} onClick={activate}>{busy?<RefreshCw className="spin" size={17}/>:<Sparkles size={17}/>}Ativar workspace autorizado</button>
      {notice?<div className="notice">{notice}</div>:null}
    </div>;
  }

  const selected=profiles.find(p=>p.id===profileId);

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand sidebar-brand"><b>G</b><div><strong>GRITaÍ</strong><span>Revenue Engine</span></div></div>
      <div className="operation"><small>OPERAÇÃO</small><select value={profileId} onChange={e=>setProfileId(e.target.value)}>{profiles.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
      <nav><button className="active"><Target size={17}/>Fila de Receita</button><button><Activity size={17}/>Inteligência</button><button><Building2 size={17}/>Contas</button><button><CircleDollarSign size={17}/>Pipeline</button></nav>
      <div className="sidebar-foot"><span><i/>Núcleo V2</span><strong>Motor ativo</strong><small>{session.user.email}</small></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div><small className="eyebrow">FILA DE RECEITA · {selected?.name?.toUpperCase()}</small><h1>Quem atacar agora — e por quê.</h1><p>Prioridade, sinal, decisor e próxima melhor ação em uma única jornada.</p></div>
        <div className="top-actions">
          <button className="secondary" disabled={busy} onClick={()=>loadWorkspace(profileId)}><RefreshCw size={17}/>Atualizar</button>
          <button className="primary" disabled={busy||!profileId} onClick={orchestrate}>{busy?<RefreshCw className="spin" size={17}/>:<Sparkles size={17}/>}Rodar inteligência</button>
          <button className="icon" onClick={()=>supabase?.auth.signOut()} title="Sair"><LogOut size={17}/></button>
        </div>
      </header>

      {notice?<div className="notice"><Sparkles size={15}/>{notice}</div>:null}

      <section className="metrics">
        <MetricCard label="Contas quentes" value={compact(summary?.hot_accounts)} hint="GRIT Score ≥ 80" icon={<Flame/>} emphasis/>
        <MetricCard label="Sinais 7 dias" value={compact(summary?.signals_7d)} hint="intenção e timing" icon={<Radio/>}/>
        <MetricCard label="Ações abertas" value={compact(summary?.open_actions)} hint="fila operacional" icon={<Target/>}/>
        <MetricCard label="Engajadas" value={compact(summary?.engaged_accounts)} hint="interação real" icon={<CheckCircle2/>}/>
        <MetricCard label="Reuniões" value={compact(summary?.meeting_accounts)} hint="contas em reunião" icon={<CalendarDays/>}/>
        <MetricCard label="Oportunidades" value={compact(summary?.open_opportunities)} hint="pipeline aberto" icon={<CircleDollarSign/>}/>
        <MetricCard label="Pipeline" value={money(summary?.pipeline_value)} hint="valor em aberto" icon={<CircleDollarSign/>}/>
        <MetricCard label="Atrasadas" value={compact(summary?.overdue_actions)} hint="exigem ação" icon={<Clock3/>}/>
      </section>

      {loading?<div className="center-inline"><RefreshCw className="spin"/>Atualizando prioridades...</div>:
        <RevenueQueue rows={queue} busy={busy} onOutcome={outcome} onOpen={openAccount}/>}
    </main>

    <AccountDrawer account={account} onClose={()=>setAccount(null)}/>
  </div>;
}

export default function App(){
  return <AuthGate>{session=><Workspace session={session}/>}</AuthGate>;
}
