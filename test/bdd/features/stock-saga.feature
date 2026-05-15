Feature: Controle de estoque no fluxo Saga

  Scenario: Reserva bem-sucedida
    Given que a peça "FILTER-OIL-001" tem 10 unidades disponíveis
    When o saga-orchestrator envia stock.reserve-stock para 3 unidades
    Then o catalog-service deve reservar 3 unidades
    And publicar stock.stock-reserved com reservationId

  Scenario: Falha por estoque insuficiente
    Given que a peça "TIRE-205-55-R16" tem 1 unidade disponível
    When o saga-orchestrator envia stock.reserve-stock para 4 unidades
    Then o catalog-service NÃO deve criar reserva
    And publicar stock.stock-insufficient com partId, available=1, requested=4

  Scenario: Compensação libera reserva
    Given que existe uma reserva ACTIVE com sagaId "saga-123"
    When o saga-orchestrator envia stock.release-reservation
    Then as unidades devem ser liberadas
    And a reserva deve ter status RELEASED
    And publicar stock.reservation-released

  Scenario: Idempotência no consumo
    Given que a reserva com sagaId "saga-456" está CONSUMED
    When o saga-orchestrator envia stock.consume-stock novamente
    Then o catalog-service deve publicar stock.stock-consumed sem reprocessar
    And o estoque não deve ser alterado

  Scenario: Low-stock alert emitido uma única vez
    Given que a peça "BATTERY-001" está com 6 unidades e mínimo 5
    When o consumo baixa estoque para 4 unidades
    Then deve publicar stock.low-stock-alert uma vez
    When outro consumo baixa estoque para 2 unidades
    Then NÃO deve publicar novo alerta
    When um replenish leva estoque para 10 unidades
    And outro consumo baixa estoque para 3 unidades
    Then deve publicar stock.low-stock-alert novamente
