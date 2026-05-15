import type { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { RabbitMQSagaReplyPublisher } from './rabbitmq-saga-reply.publisher';

describe('RabbitMQSagaReplyPublisher', () => {
  let publisher: RabbitMQSagaReplyPublisher;
  let amqp: { publish: jest.Mock };

  beforeEach(() => {
    amqp = { publish: jest.fn().mockResolvedValue(undefined) };
    publisher = new RabbitMQSagaReplyPublisher(
      amqp as unknown as AmqpConnection,
    );
  });

  it('publishStockReserved publishes to oficina.replies', async () => {
    await publisher.publishStockReserved({
      sagaId: 's1',
      osId: 'os1',
      reservationId: 'r1',
    });
    expect(amqp.publish).toHaveBeenCalledWith(
      'oficina.replies',
      'stock.stock-reserved',
      expect.objectContaining({
        payload: expect.objectContaining({ sagaId: 's1' }) as unknown,
      }),
    );
  });

  it('publishStockConsumed publishes to oficina.replies', async () => {
    await publisher.publishStockConsumed({
      sagaId: 's1',
      osId: 'os1',
      reservationId: 'r1',
    });
    expect(amqp.publish).toHaveBeenCalledWith(
      'oficina.replies',
      'stock.stock-consumed',
      expect.any(Object),
    );
  });

  it('publishReservationReleased publishes to oficina.replies', async () => {
    await publisher.publishReservationReleased({
      sagaId: 's1',
      osId: 'os1',
      reservationId: 'r1',
    });
    expect(amqp.publish).toHaveBeenCalledWith(
      'oficina.replies',
      'stock.reservation-released',
      expect.any(Object),
    );
  });

  it('publishStockInsufficient publishes to oficina.replies', async () => {
    await publisher.publishStockInsufficient({
      sagaId: 's1',
      osId: 'os1',
      failures: [{ partId: 'p1', requested: 5, available: 2 }],
    });
    expect(amqp.publish).toHaveBeenCalledWith(
      'oficina.replies',
      'stock.stock-insufficient',
      expect.any(Object),
    );
  });

  it('publishLowStockAlert publishes to oficina.alerts', async () => {
    await publisher.publishLowStockAlert({
      partId: 'p1',
      sku: 'PART-FILTER-AABB1122',
      name: 'Filter',
      currentStock: 3,
      minimumStock: 5,
    });
    expect(amqp.publish).toHaveBeenCalledWith(
      'oficina.alerts',
      'stock.low-stock-alert',
      expect.any(Object),
    );
  });
});
