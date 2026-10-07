# GRITaÍ — Revenue Engine

GRITaÍ é o motor de prospecção e Revenue Operations da GRIT Soluções e Negócios.

## Arquitetura V2

O fluxo oficial é:

`PERFIL → CONTA → DECISOR → SINAL → GRIT SCORE → PRÓXIMA AÇÃO → CONVERSA → REUNIÃO → OPORTUNIDADE → VENDA → APRENDIZADO`

Princípios:
- um Golden Record por empresa;
- contexto comercial separado por operação/negócio;
- sinais e evidências com fonte e confiança;
- score explicável 0–100;
- uma próxima melhor ação por conta;
- automação assistida por padrão e outbound condicionado à política do canal;
- RLS multiempresa e trilha de auditoria;
- respostas, opt-outs e conversões realimentam o motor.

## Backend

Supabase project: `grit-prospect-360`.

Edge Function principal: `gritai-orchestrator`.

Perfis iniciais previstos no bootstrap:
- Procirúrgica
- Prohospital
- Shopping Prohospital
- Meu Cuidador
- GRIT Soluções e Negócios
- Meu Espetinho
- SR Padeiro

Consulte `docs/ARCHITECTURE.md` e `docs/UI-REVENUE-QUEUE.md`.

## Status em 07/10/2026

O núcleo V2 está implantado no Supabase e homologado por smoke test transacional. A interface de produção ainda deve ser conectada ao novo contrato; nenhuma alegação de publicação do frontend é feita por este repositório.
