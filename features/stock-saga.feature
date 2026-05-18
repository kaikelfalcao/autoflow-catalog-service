Feature: Controle de estoque no fluxo Saga
  Como catalog-service
  Quero reservar, consumir e liberar peças via mensagens RMQ do orquestrador
  Para garantir consistência de estoque nas ordens de serviço

  Scenario: Reserva bem-sucedida
    Given a peça "p1" tem 10 unidades disponíveis
    When chega comando stock.reserve-stock com sagaId "s1" osId "o1" para 3 unidades de "p1"
    Then a peça "p1" fica com reserved=3 stock=10
    And foi publicado stock.stock-reserved para sagaId "s1"

  Scenario: Falha por estoque insuficiente
    Given a peça "p2" tem 1 unidade disponível
    When chega comando stock.reserve-stock com sagaId "s2" osId "o2" para 4 unidades de "p2"
    Then nenhuma reserva foi criada para sagaId "s2"
    And foi publicado stock.stock-insufficient para sagaId "s2"

  Scenario: Idempotência no consume — mesma sagaId duas vezes não decrementa duas
    Given a peça "p3" tem 5 unidades disponíveis
    And existe uma reserva ACTIVE com sagaId "s3" para 2 unidades de "p3"
    When chega comando stock.consume-stock com sagaId "s3" osId "o3" e reservationId da reserva
    And chega de novo o comando stock.consume-stock com a mesma reserva
    Then a peça "p3" fica com stock=3 reserved=0
