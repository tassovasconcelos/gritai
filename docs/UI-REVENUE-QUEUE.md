# UI — Fila de Receita

## Regra de produto

A tela inicial não deve expor a complexidade interna. Ela deve responder:
1. quem merece atenção agora;
2. por quê;
3. qual é a próxima melhor ação;
4. o que aconteceu depois.

## Header

Seletor obrigatório de `business_profile`.

Trocar o perfil deve trocar:
- ICP;
- personas;
- oferta;
- fila;
- pipeline;
- métricas;
- políticas de canal.

## Home

Fonte: `profile_revenue_summary_v`.

Cards mínimos:
- Contas quentes
- Contas mornas
- Sinais nos últimos 7 dias
- Ações abertas
- Ações vencidas
- Contas engajadas
- Reuniões
- Oportunidades abertas
- Pipeline R$

CTA primário: **Iniciar prospecção**.

## Fila de Receita

Fonte: `revenue_queue_v`.

Cada card deve mostrar:
- empresa;
- GRIT Score;
- confiança;
- estágio;
- decisor/cargo;
- sinal ou razão da prioridade;
- próxima ação;
- canal;
- prioridade;
- vencimento;
- botão Executar;
- botão Pular com motivo.

A justificativa deve ficar visível, não escondida em tooltip.

## Conta 360

Fonte: `account_360_v`.

Blocos:
- identidade da empresa;
- CNPJ/CNAE/localidade/site;
- decisores;
- GRIT Score e componentes;
- sinais ativos;
- linha do tempo;
- permissões por canal;
- oportunidades;
- próxima ação.

## Comportamento

Nenhuma tela deve exigir que o vendedor navegue entre vários módulos para descobrir o que fazer.

O fluxo ideal é:
`abrir fila → executar ação → registrar resultado → próxima conta`.

## Estados de resultado

Ao concluir uma ação, chamar `complete_recommended_action` com outcome padronizado, por exemplo:
- positive_reply
- negative_reply
- no_answer
- meeting_booked
- meeting_held
- qualified
- opt_out
- invalid_contact

`opt_out` bloqueia aquele canal no motor.

## Outbound

A UI não deve oferecer disparo automático sem:
- integração oficial conectada;
- política do perfil permitindo;
- permissão/canal compatível;
- guardrails do provedor;
- trilha de auditoria.
