# ADR-003 — Reserva em duas fases (reserve + consume)

## Contexto

OS pode ser cancelada após reservar peças, antes da execução começar. Baixar
estoque imediatamente geraria inconsistência (estoque negativo + retorno
manual no cancelamento).

## Decisão

Reservas em duas fases distintas, com `reservedQuantity` separada de
`stockQuantity`:

1. **Reserve** (`reserve-stock` command) → `reservedQuantity += qty`,
   sem alterar `stockQuantity`. `available = stock - reserved`.
2. **Consume** (`consume-stock` command) → `stockQuantity -= qty`,
   `reservedQuantity -= qty`. É quando a peça sai do estoque de verdade.
3. **Release** (`release-reservation` command, compensação) →
   `reservedQuantity -= qty`. Volta a `available` sem mexer em `stockQuantity`.

Cada operação cria um `StockMovement` append-only (`RESERVE`, `OUT`,
`RELEASE`, `IN` para replenish).

## Consequências

**+** Estoque disponível sempre consistente: `availableQuantity = stockQuantity - reservedQuantity`.
**+** Rollback simples (release).
**+** Auditoria total via movements.
**−** Dois contadores. Mitigado por getter `availableQuantity` na entidade,
nunca recalculado fora dela.
