# ADR-002 — MongoDB para o catálogo

## Contexto

Peças têm atributos **heterogêneos por categoria**:

- Pneu: aro, perfil, índice de velocidade
- Filtro: tipo de filtro, vazão
- Óleo: viscosidade, base (mineral/sintético)
- Bateria: amperagem, voltagem

Modelar em relacional forçaria muitos `NULL` ou EAV.

## Decisão

- **MongoDB 7** com Mongoose
- Schema fixo para campos invariantes (`sku`, `name`, `category`, quantidades)
- Campo `attributes: Mixed` para atributos por categoria, sem validação por
  categoria no MVP
- Lock otimista (`optimisticConcurrency: true`) — não usamos transactions
  (exigiriam replica set)

## Consequências

**+** Schema evolutivo sem migrations no campo `attributes`.
**+** Cumpre requisito do challenge de usar NoSQL com justificativa real.
**−** Validação de atributos por categoria fica fora do banco (TODO no
domain: validators por `PartCategory`).
**−** Conflict resolution com lock otimista requer retry no consumer. OK
para o volume do MVP.
