import { useMemo, useState } from "react";
import { Check, CalendarDays, Mail, Phone, MessageCircle, Search, UserRound } from "lucide-react";
import type { Database } from "../database.types";
import type { ActionOutcome } from "../lib/gritai-api";

type QueueRow = Database["public"]["Views"]["revenue_queue_v"]["Row"];

const stages: Record<string,string> = {
  discovered:"Descoberto", enriched:"Enriquecido", icp_validated:"ICP validado",
  decision_maker_identified:"Decisor identificado", contactable:"Contatável",
  prospecting:"Em prospecção", engaged:"Engajado", qualified:"Qualificado",
  meeting:"Reunião", opportunity:"Oportunidade", proposal:"Proposta",
  won:"Ganho", lost:"Perdido", nurture:"Nurture",
};

const actions: Record<string,string> = {
  research_account:"Pesquisar conta",
  find_decision_maker:"Encontrar decisor",
  follow_up_engaged:"Fazer follow-up",
  call_decision_maker:"Ligar para decisor",
  signal_based_email:"E-mail por sinal",
  personalized_email:"E-mail personalizado",
  whatsapp_followup:"Follow-up no WhatsApp",
  verify_contact_channel:"Validar canal",
  review_suppression:"Revisar bloqueio",
};

function Channel({ channel }: { channel?: string | null }) {
  if (channel==="email") return <Mail size={15}/>;
  if (channel==="phone") return <Phone size={15}/>;
  if (channel==="whatsapp") return <MessageCircle size={15}/>;
  return <Search size={15}/>;
}

export function RevenueQueue({
  rows,
  busy,
  onOutcome,
  onOpen,
}: {
  rows: QueueRow[];
  busy: boolean;
  onOutcome: (row: QueueRow, outcome: ActionOutcome) => Promise<void>;
  onOpen: (row: QueueRow) => void;
}) {
  const [query,setQuery]=useState("");
  const [minScore,setMinScore]=useState(0);

  const filtered=useMemo(()=>rows.filter((row)=>{
    if(Number(row.grit_score||0)<minScore) return false;
    const needle=query.trim().toLowerCase();
    if(!needle) return true;
    return [row.company_name,row.contact_name,row.job_title,row.city,row.state,row.rationale]
      .filter(Boolean).join(" ").toLowerCase().includes(needle);
  }),[rows,query,minScore]);

  return <section className="queue-panel">
    <div className="panel-head">
      <div><small className="eyebrow">NEXT BEST ACTION</small><h2>Fila priorizada</h2><p>{filtered.length} contas neste recorte.</p></div>
      <div className="filters">
        <label className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Empresa, decisor, cidade..."/></label>
        <select value={minScore} onChange={e=>setMinScore(Number(e.target.value))}>
          <option value={0}>Todos os scores</option><option value={40}>40+</option><option value={60}>60+</option><option value={80}>80+ quentes</option>
        </select>
      </div>
    </div>
    {filtered.length===0 ? <div className="empty"><Search/><h3>Nenhuma ação aberta.</h3><p>Carregue contas e sinais e rode a inteligência.</p></div> :
      <div className="queue-list">{filtered.map((row,index)=><article className="queue-row" key={row.action_id||String(index)}>
        <div className="rank">{String(index+1).padStart(2,"0")}</div>
        <button className="company-cell" onClick={()=>onOpen(row)}>
          <div><strong>{row.company_name}</strong><span className="stage">{stages[row.stage||""]||row.stage||"Novo"}</span></div>
          <small>{[row.city,row.state].filter(Boolean).join(" · ")||"Localidade não informada"}</small>
          <p><UserRound size={14}/><b>{row.contact_name||"Decisor não identificado"}</b>{row.job_title?" · "+row.job_title:""}</p>
        </button>
        <div className={Number(row.grit_score||0)>=80?"score hot":Number(row.grit_score||0)>=60?"score warm":"score"}>
          <strong>{Math.round(Number(row.grit_score||0))}</strong><span>score</span><small>{Math.round(Number(row.score_confidence||0))}% conf.</small>
        </div>
        <div className="action-cell">
          <small className="eyebrow">FAZER AGORA</small>
          <h4><Channel channel={row.channel}/>{actions[row.action_type||""]||row.action_type}</h4>
          <p>{row.rationale}</p>
          <div className="contact-chips">
            {row.contact_email?<span><Mail size={13}/>{row.contact_email}</span>:null}
            {row.contact_phone?<span><Phone size={13}/>{row.contact_phone}</span>:null}
            {row.contact_whatsapp?<span><MessageCircle size={13}/>{row.contact_whatsapp}</span>:null}
          </div>
        </div>
        <div className="outcomes">
          <button disabled={busy} onClick={()=>onOutcome(row,"positive_reply")} title="Resposta positiva"><Check size={16}/></button>
          <button disabled={busy} onClick={()=>onOutcome(row,"no_answer")} title="Sem resposta">…</button>
          <button disabled={busy} onClick={()=>onOutcome(row,"meeting_booked")} title="Reunião"><CalendarDays size={16}/></button>
          <button disabled={busy} onClick={()=>onOutcome(row,"negative_reply")} title="Negativa">−</button>
          <button className="danger" disabled={busy} onClick={()=>onOutcome(row,"opt_out")} title="Opt-out">×</button>
        </div>
      </article>)}</div>}
  </section>;
}
