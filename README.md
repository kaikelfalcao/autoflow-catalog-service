# autoflow-catalog-service

> Microsserviço de **catálogo de peças e serviços** com controle de estoque saga-aware do ecossistema **autoflow** (FIAP Tech Challenge — Fase 4).

Dois subdomínios em um mesmo serviço:

- **Parts** — peças/insumos com controle de estoque físico em duas fases (reserve → consume) e compensação (release).
- **Services** — serviços oferecidos pela oficina (troca de óleo, alinhamento, …), apenas CRUD.

Parts participam do **Saga Pattern** orquestrado pelo `saga-orchestrator`; Services são apenas consultados pelos demais.

---

## 🧱 Stack

| Camada       | Tecnologia                                |
|--------------|-------------------------------------------|
| Runtime      | Node.js 24 (LTS)                          |
| Linguagem    | TypeScript (strict)                       |
| Framework    | NestJS 11                                 |
| Banco        | MongoDB 7 (Mongoose)                      |
| Mensageria   | RabbitMQ (`@golevelup/nestjs-rabbitmq`)   |
| Observ.      | New Relic APM + canonical logs (Winston)  |
| Testes       | Jest + mongodb-memory-server + Cucumber   |
| Container    | Docker multi-stage                        |
| Deploy       | EKS via GitHub Actions                    |

---

## 🏛️ Arquitetura

**Hexagonal (Ports & Adapters)** com DDD-lite. Domínio em TypeScript puro — nenhum import de framework dentro de `src/domain/**`.

```
src/
├── domain/                       ← núcleo, zero dependência externa
│   ├── parts/                    ← Part, StockReservation, StockMovement, VOs, ports
│   ├── services/                 ← Service, Money, EstimatedDuration, ports
│   └── shared/                   ← DomainEvent, errors
├── application/                  ← services de aplicação (não use-cases individuais)
│   ├── parts/                    ← StockService, PartCatalogService
│   └── services/                 ← ServiceCatalogService
├── infrastructure/               ← adapters
│   ├── database/                 ← schemas Mongoose + mappers + repositórios
│   ├── messaging/
│   │   ├── consumers/            ← stock-saga.consumer (3 commands)
│   │   ├── publishers/           ← rabbitmq-saga-reply.publisher
│   │   └── dlq/                  ← dlq.consumer (logging only)
│   └── http/
│       ├── parts/                ← PartsController + DTOs
│       ├── services/             ← ServicesController + DTOs
│       └── health/               ← HealthController
└── shared/                       ← config, filters, logger, middlewares, observability
```

Exchanges declaradas no `AppModule`: `oficina.commands`, `oficina.replies`, `oficina.alerts`, `oficina.dlx`.

---

## 🌐 Endpoints REST (via Kong → `/catalog/*`)

### Parts
| Método | Path                                | Descrição                                  |
|--------|-------------------------------------|--------------------------------------------|
| GET    | `/parts`                            | Listagem (query: category, active, search, page, limit) |
| GET    | `/parts/low-stock`                  | Peças com estoque ≤ mínimo                 |
| GET    | `/parts/:id`                        | Detalhe (com `availableQuantity` calculado)|
| GET    | `/parts/:id/movements`              | Histórico de movimentações                 |
| POST   | `/parts`                            | Criar (SKU auto-gerado)                    |
| PUT    | `/parts/:id`                        | Atualizar dados não-quantitativos          |
| PATCH  | `/parts/:id/replenish`              | Repor estoque (+ reset low-stock flag)     |
| PATCH  | `/parts/:id/adjust`                 | Ajuste manual de inventário                |
| DELETE | `/parts/:id`                        | Soft-delete (bloqueado se reservas ACTIVE) |
| GET    | `/os/:osId`                         | Reservas de uma OS                         |

### Services
| Método | Path                                | Descrição                                  |
|--------|-------------------------------------|--------------------------------------------|
| GET    | `/services`                         | Listagem                                   |
| GET    | `/services/:id`                     | Detalhe                                    |
| POST   | `/services`                         | Criar                                      |
| PUT    | `/services/:id`                     | Atualizar                                  |
| DELETE | `/services/:id`                     | Soft-delete                                |

Swagger em `/api/docs`.

---

## 📬 Eventos RabbitMQ

### Consumidos — `oficina.commands` (topic)

| Routing key                  | Ação                                                          |
|------------------------------|---------------------------------------------------------------|
| `stock.reserve-stock`        | Tenta reservar (publica reserved ou insufficient)             |
| `stock.consume-stock`        | Decrementa stockQuantity + reservedQuantity (publica consumed)|
| `stock.release-reservation`  | Libera reserva ativa (publica reservation-released)           |

### Publicados — `oficina.replies` & `oficina.alerts`

| Exchange          | Routing key                   | Quando                                  |
|-------------------|-------------------------------|-----------------------------------------|
| `oficina.replies` | `stock.stock-reserved`        | Reserva bem-sucedida                    |
| `oficina.replies` | `stock.stock-insufficient`    | Estoque insuficiente (com lista)        |
| `oficina.replies` | `stock.stock-consumed`        | Consumo confirmado                      |
| `oficina.replies` | `stock.reservation-released`  | Reserva liberada (compensação)          |
| `oficina.alerts`  | `stock.low-stock-alert`       | Peça cruzou o mínimo (1× por ciclo)     |

**DLQ:** cada fila tem `x-dead-letter-exchange: oficina.dlx`. Após 3 retries com backoff (1s, 5s, 25s), mensagem vai para DLQ. O `DLQConsumer` apenas **loga** — não reprocessa.

---

## 🧠 Regras de domínio críticas

- **Reserva em duas fases**: `reservedQuantity` é incrementado no reserve; `stockQuantity` é decrementado apenas no consume. `availableQuantity = stockQuantity − reservedQuantity`.
- **Idempotência via sagaId**: índice único em `reservations.sagaId`. O `StockService` verifica idempotência **antes** de processar — se `sagaId` já existe com status ACTIVE, republica a reply original sem reprocessar.
- **Low-stock alert one-shot**: a entidade `Part` mantém flag `lowStockAlertSent`. Emite só ao **cruzar** o mínimo; `replenish` acima do mínimo reseta a flag.
- **StockMovement append-only**: cada operação cria um `StockMovement` imutável (type IN / OUT / RESERVE / RELEASE).
- **Lock otimista** via `versionKey` do Mongoose — sem MongoDB transactions.
- **Domínio puro**: nada em `src/domain/**` importa de `mongoose`, `amqplib`, `@nestjs/*` ou qualquer framework.

---

## 🔧 Variáveis de ambiente

| Variável                | Default                                   | Descrição              |
|-------------------------|-------------------------------------------|------------------------|
| `PORT`                  | `3003`                                    | porta HTTP             |
| `MONGODB_URI`           | `mongodb://localhost:27017/catalog`       | conexão Mongo          |
| `RABBITMQ_URL`          | `amqp://admin:admin@localhost:5672`       | conexão RMQ            |
| `RABBITMQ_PREFETCH`     | `10`                                      | mensagens em flight   |
| `CORRELATION_ID_HEADER` | `x-correlation-id`                        |                        |
| `NEW_RELIC_LICENSE_KEY` | —                                         | (opcional) APM         |

Validação via `class-validator` em `EnvConfig` — app **não sobe** sem as obrigatórias.

---

## 🚀 Rodar localmente

```bash
docker compose up -d        # Mongo + RMQ
npm install
npm run start:dev
```

Ou integrado via `autoflow-infra/local/bootstrap.sh`.

---

## 🧪 Testes

```bash
npm run test           # unit
npm run test:cov       # threshold 80% global
npm run test:integration  # mongodb-memory-server
npm run test:bdd       # Cucumber
npm run test:e2e       # supertest
npm run lint           # ESLint (TS strict)
```

**Coverage atual:** **96.79 / 85.04 / 95.74 / 97.02** (statements / branches / functions / lines).

> **TODO:** SonarQube Community.

---

## 🐳 Docker / ☸️ Deploy

| Workflow | Trigger                          | Jobs                              |
|----------|----------------------------------|-----------------------------------|
| `ci.yml` | push/PR em qualquer branch       | lint + test:cov + bdd             |
| `cd.yml` | `workflow_run` (CI ok em `main`) | DockerHub + EKS rollout           |

Imagem: `kaikelfalcao/autoflow-catalog:<sha>`. Cluster `autoflow-dev-eks` / namespace `autoflow`.

---

## 📊 Observabilidade

- Logs canônicos por request HTTP **e** por evento RMQ (com `correlationId`, `sagaId`, `partId`, `reservationId`).
- Custom events no New Relic: `StockReserved`, `StockInsufficient`, `LowStockAlert`, `SagaCompensation`.
- DLQ logada (sem reprocessar) — investigação manual via collection `dlq`.

---

## 🔗 Ecossistema

[`autoflow-infra`](https://github.com/kaikelfalcao/autoflow-infra) · [`autoflow-identity-service`](https://github.com/kaikelfalcao/autoflow-identity-service) · [`autoflow-order-service`](https://github.com/kaikelfalcao/autoflow-order-service) · [`autoflow-payment-service`](https://github.com/kaikelfalcao/autoflow-payment-service) · [`autoflow-saga-orchestrator`](https://github.com/kaikelfalcao/autoflow-saga-orchestrator) · [`autoflow-notification-service`](https://github.com/kaikelfalcao/autoflow-notification-service)
