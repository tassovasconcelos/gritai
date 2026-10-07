import type { Database } from "../database.types";

type AccountRow = Database["public"]["Views"]["account_360_v"]["Row"];

export function AccountDrawer(props: { account: AccountRow | null; onClose: () => void }) {
  const a = props.account;
  if (!a) return null;
  return (
    <aside className="drawer">
      <header>
        <div>
          <small className="eyebrow">CONTA 360</small>
          <h2>{a.company_name}</h2>
          <p>{[a.city, a.state].filter(Boolean).join(" · ") || "Localidade não informada"}</p>
        </div>
        <button className="close" onClick={props.onClose}>×</button>
      </header>
      <div className="drawer-score">
        <div className={Number(a.grit_score || 0) >= 80 ? "score hot" : "score"}>
          <strong>{Math.round(Number(a.grit_score || 0))}</strong>
          <span>GRIT Score</span>
        </div>
        <p>{Math.round(Number(a.score_confidence || 0))}% confiança</p>
      </div>
      <div className="drawer-grid">
        <div><span>Decisores</span><strong>{a.decision_makers || 0}</strong></div>
        <div><span>Sinais</span><strong>{a.active_signals || 0}</strong></div>
        <div><span>Contatos</span><strong>{a.active_contacts || 0}</strong></div>
        <div><span>Oportunidades</span><strong>{a.open_opportunities || 0}</strong></div>
      </div>
      <section>
        <small className="eyebrow">PRÓXIMA AÇÃO</small>
        <h3>{a.next_action_type || "Aguardando priorização"}</h3>
        <p>{a.next_action_rationale || "Ainda não há recomendação para esta conta."}</p>
      </section>
      <section>
        <small className="eyebrow">IDENTIDADE</small>
        <dl>
          <div><dt>CNPJ</dt><dd>{a.tax_id || "—"}</dd></div>
          <div><dt>CNAE</dt><dd>{a.cnae || "—"}</dd></div>
          <div><dt>Segmento</dt><dd>{a.industry || "—"}</dd></div>
          <div><dt>Domínio</dt><dd>{a.website_domain || "—"}</dd></div>
        </dl>
      </section>
    </aside>
  );
}
