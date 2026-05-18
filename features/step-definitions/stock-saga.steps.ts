import { Given, Then, When } from '@cucumber/cucumber';
import { strict as assert } from 'node:assert';

import type { StockWorld } from '../support/world';

Given(
  /^a peça "([^"]+)" tem (\d+) unidades? (?:disponíveis|disponível)$/,
  function (this: StockWorld, id: string, qty: string) {
    this.seedPart(id, Number(qty));
  },
);

Given(
  /^existe uma reserva ACTIVE com sagaId "([^"]+)" para (\d+) unidades de "([^"]+)"$/,
  async function (
    this: StockWorld,
    sagaId: string,
    qty: string,
    partId: string,
  ) {
    await this.service.reserveStock({
      eventId: 'evt-pre',
      correlationId: 'cor',
      sagaId,
      osId: 'pre',
      items: [{ partId, quantity: Number(qty) }],
    });
  },
);

When(
  /^chega comando stock.reserve-stock com sagaId "([^"]+)" osId "([^"]+)" para (\d+) unidades? de "([^"]+)"$/,
  async function (
    this: StockWorld,
    sagaId: string,
    osId: string,
    qty: string,
    partId: string,
  ) {
    await this.service.reserveStock({
      eventId: 'evt',
      correlationId: 'cor',
      sagaId,
      osId,
      items: [{ partId, quantity: Number(qty) }],
    });
  },
);

When(
  /^chega comando stock.consume-stock com sagaId "([^"]+)" osId "([^"]+)" e reservationId da reserva$/,
  async function (this: StockWorld, sagaId: string, osId: string) {
    const reservation = this.reservations.reservations.find(
      (r) => r.sagaId === sagaId,
    );
    assert.ok(reservation, `reserva sagaId=${sagaId} não encontrada`);
    await this.service.consumeStock({
      eventId: 'evt',
      correlationId: 'cor',
      sagaId,
      osId,
      reservationId: reservation.id,
    });
  },
);

When(
  /^chega de novo o comando stock.consume-stock com a mesma reserva$/,
  async function (this: StockWorld) {
    const last = this.reservations.reservations[this.reservations.reservations.length - 1];
    await this.service.consumeStock({
      eventId: 'evt2',
      correlationId: 'cor',
      sagaId: last.sagaId,
      osId: last.osId,
      reservationId: last.id,
    });
  },
);

Then(
  /^a peça "([^"]+)" fica com reserved=(\d+) stock=(\d+)$/,
  async function (this: StockWorld, id: string, reserved: string, stock: string) {
    const part = await this.parts.findById(id);
    assert.ok(part);
    assert.equal(part.reservedQuantity, Number(reserved));
    assert.equal(part.stockQuantity, Number(stock));
  },
);

Then(
  /^a peça "([^"]+)" fica com stock=(\d+) reserved=(\d+)$/,
  async function (this: StockWorld, id: string, stock: string, reserved: string) {
    const part = await this.parts.findById(id);
    assert.ok(part);
    assert.equal(part.stockQuantity, Number(stock));
    assert.equal(part.reservedQuantity, Number(reserved));
  },
);

Then(
  /^foi publicado stock.stock-reserved para sagaId "([^"]+)"$/,
  function (this: StockWorld, sagaId: string) {
    assert.ok(this.publisher.reservedCalls.find((c) => c.sagaId === sagaId));
  },
);

Then(
  /^foi publicado stock.stock-insufficient para sagaId "([^"]+)"$/,
  function (this: StockWorld, sagaId: string) {
    assert.ok(this.publisher.insufficientCalls.find((c) => c.sagaId === sagaId));
  },
);

Then(
  /^nenhuma reserva foi criada para sagaId "([^"]+)"$/,
  function (this: StockWorld, sagaId: string) {
    const r = this.reservations.reservations.find((x) => x.sagaId === sagaId);
    assert.equal(r, undefined);
  },
);
