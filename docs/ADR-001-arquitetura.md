# ADR-001 — Hexagonal Architecture (Ports & Adapters) com DDD-lite

## Contexto

`catalog-service` tem invariantes reais:
- Não reservar além do disponível
- Idempotência por `sagaId`
- Movimentos imutáveis (append-only)
- Alerta de estoque baixo emitido só uma vez por ciclo

Essas regras precisam ser testáveis sem infraestrutura.

## Decisão

Hexagonal com 3 camadas estritas:

```
src/
├── domain/           # Entities, VOs, Enums, Ports (zero deps externas)
├── application/      # Services (PartCatalog, Stock, ServiceCatalog)
└── infrastructure/   # Adapters: Mongoose, RabbitMQ, HTTP
```

**Regra invioável:** nada em `domain/` importa `mongoose`, `@nestjs/*`,
`amqplib`. Apenas TypeScript puro.

## Consequências

**+** Domínio 100% testável com mocks (`mongodb-memory-server` só usado para
testar adapters de persistência).
**+** Trocar Mongo por outro DB exigiria apenas reescrever os repositórios
em `infrastructure/database/`.
**−** Mais arquivos vs Service direto. Justificado pela densidade de regras.
