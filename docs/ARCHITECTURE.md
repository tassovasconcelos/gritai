# GRITaÍ Revenue Engine V2 — Arquitetura

## Objetivo

Substituir uma coleção de módulos desconectados por um motor único de decisão comercial: descobrir, enriquecer, priorizar, recomendar a próxima ação, registrar resultado e aprender.

## Domínios

### Workspace e contexto
- `organizations`: tenant.
- `memberships`: usuários e papéis.
- `business_profiles`: seletor operacional e configuração por negócio.

### Golden Record
- `companies`: conta mestre.
- `contacts`: pessoas, decisores e canais.
- `enrichment_facts`: evidência por campo, fonte, confiança e validade.
- RPC `upsert_company_golden`: deduplicação por CNPJ, nome+localidade e nome+domínio.

### Inteligência
- `buying_signals`: sinais de intenção/timing.
- `company_scores`: ICP, intenção, contatabilidade, timing, engajamento, total e confiança.
- RPC `refresh_company_score`: cálculo explicável.
- RPC `refresh_profile_scores`: recálculo em lote.

### Operação comercial
- `prospecting_states`: estágio único por perfil/conta.
- `recommended_actions`: Next Best Action.
- `activities`: histórico de execução e resposta.
- `opportunities`: pipeline.
- RPC `refresh_revenue_queue`: gera fila priorizada.
- RPC `complete_recommended_action`: fecha a ação, registra atividade, aplica opt-out e recalcula score.

### Governança
- `channel_permissions`: allowed / unknown / blocked / opted_out por canal.
- `integration_health`: saúde das integrações.
- `agent_runs`: auditoria de SCOUT / QUALIFIER / SDR / GROWTH / KERNEL.
- `audit_events`: auditoria administrativa.

## Funil único

`discovered → enriched → icp_validated → decision_maker_identified → contactable → prospecting → engaged → qualified → meeting → opportunity → proposal → won/lost`

`nurture` é um estado controlado para contas fora do timing imediato.

O motor não regride automaticamente contas maduras e não altera `won/lost`.

## GRIT Score

Pesos padrão:
- ICP Fit: 30
- Intenção: 25
- Contatabilidade: 15
- Timing: 15
- Engajamento: 15

Cada `business_profile` pode alterar os pesos.

O score preserva dois conceitos separados:
- `total_score`: prioridade comercial;
- `confidence`: confiança nos dados usados na decisão.

## Fila de Receita

`revenue_queue_v` é a interface operacional.

Regras atuais:
1. score < 40: não entra na fila;
2. sem contato: localizar decisor;
3. conta engajada: follow-up;
4. score alto + telefone: ligação humana;
5. sinal forte + e-mail: e-mail contextual assistido;
6. WhatsApp só é recomendado se `channel_permissions=allowed`;
7. blocked/opted_out nunca recebe ação de contato;
8. uma conta não recebe duas ações abertas concorrentes.

## Views para UI

- `profile_revenue_summary_v`: cards por operação.
- `revenue_queue_v`: fila priorizada.
- `account_360_v`: visão 360º da conta.

## Segurança

Todas as novas tabelas públicas usam RLS.

- `anon`: sem acesso.
- membro autenticado: leitura dentro do tenant.
- owner/admin/operator: escrita operacional.
- exclusões e configurações críticas: owner/admin.
- views usam `security_invoker=true`.
- `service_role` é somente backend confiável.
- autorização não depende de `user_metadata`.

## Orquestração

Edge Function `gritai-orchestrator`:
1. valida JWT;
2. trabalha com o contexto RLS do usuário;
3. opcionalmente recalcula scores do perfil;
4. gera Next Best Actions;
5. devolve a fila pronta para a UI.

Modos:
- `score_and_queue`
- `queue_only`

Payload:
```json
{
  "business_profile_id": "uuid",
  "mode": "score_and_queue",
  "limit": 200
}
```

## Agentes

O KERNEL mantém estado, autorização e fila.

- SCOUT: descoberta + enriquecimento.
- QUALIFIER: ICP + sinais + score.
- SDR: conversa/follow-up/reunião dentro das permissões.
- GROWTH: experimentação e aprendizagem.

Nenhum agente deve escrever fora do seu domínio sem passar pelo KERNEL.

## Homologação inicial

Smoke test executado em banco real, com dados temporários removidos:
- ICP: 88
- intenção: 87,40
- contatabilidade: 100
- timing: 92
- score inicial: 77,05
- ação escolhida: `signal_based_email`
- prioridade: 87,05
- resposta positiva registrada
- estágio: `engaged`
- engajamento: 95
- score pós-resposta: 91,30

A organização de teste foi excluída ao final.
