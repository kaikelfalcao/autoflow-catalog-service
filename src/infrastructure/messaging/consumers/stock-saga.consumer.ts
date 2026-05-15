import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe, Nack } from '@golevelup/nestjs-rabbitmq';
import { StockService } from '../../../application/parts/stock.service';

interface EventEnvelope<T> {
  eventId: string;
  correlationId: string;
  sagaId?: string;
  occurredAt: string;
  version: string;
  source: string;
  payload: T;
}

@Injectable()
export class StockSagaConsumer {
  private readonly logger = new Logger(StockSagaConsumer.name);

  constructor(private readonly stockService: StockService) {}

  @RabbitSubscribe({
    exchange: 'oficina.commands',
    routingKey: 'stock.reserve-stock',
    queue: 'catalog.stock.reserve-stock',
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'oficina.dlx',
        'x-dead-letter-routing-key': 'catalog.stock.reserve-stock.dlq',
        'x-message-ttl': 60000,
      },
    },
  })
  async handleReserveStock(
    envelope: EventEnvelope<{
      osId: string;
      items: Array<{ partId: string; quantity: number }>;
    }>,
  ): Promise<Nack | void> {
    try {
      await this.stockService.reserveStock({
        eventId: envelope.eventId,
        correlationId: envelope.correlationId,
        sagaId: envelope.sagaId!,
        osId: envelope.payload.osId,
        items: envelope.payload.items,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Falha em reserve-stock', {
        eventId: envelope.eventId,
        sagaId: envelope.sagaId,
        error: error.message,
        stack: error.stack,
      });
      return new Nack(false);
    }
  }

  @RabbitSubscribe({
    exchange: 'oficina.commands',
    routingKey: 'stock.consume-stock',
    queue: 'catalog.stock.consume-stock',
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'oficina.dlx',
        'x-dead-letter-routing-key': 'catalog.stock.consume-stock.dlq',
        'x-message-ttl': 60000,
      },
    },
  })
  async handleConsumeStock(
    envelope: EventEnvelope<{ osId: string; reservationId: string }>,
  ): Promise<Nack | void> {
    try {
      await this.stockService.consumeStock({
        eventId: envelope.eventId,
        correlationId: envelope.correlationId,
        sagaId: envelope.sagaId!,
        osId: envelope.payload.osId,
        reservationId: envelope.payload.reservationId,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Falha em consume-stock', {
        eventId: envelope.eventId,
        sagaId: envelope.sagaId,
        error: error.message,
        stack: error.stack,
      });
      return new Nack(false);
    }
  }

  @RabbitSubscribe({
    exchange: 'oficina.commands',
    routingKey: 'stock.release-reservation',
    queue: 'catalog.stock.release-reservation',
    queueOptions: {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': 'oficina.dlx',
        'x-dead-letter-routing-key': 'catalog.stock.release-reservation.dlq',
        'x-message-ttl': 60000,
      },
    },
  })
  async handleReleaseReservation(
    envelope: EventEnvelope<{ osId: string; reservationId: string }>,
  ): Promise<Nack | void> {
    try {
      await this.stockService.releaseReservation({
        eventId: envelope.eventId,
        correlationId: envelope.correlationId,
        sagaId: envelope.sagaId!,
        osId: envelope.payload.osId,
        reservationId: envelope.payload.reservationId,
      });
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      this.logger.error('Falha em release-reservation', {
        eventId: envelope.eventId,
        sagaId: envelope.sagaId,
        error: error.message,
        stack: error.stack,
      });
      return new Nack(false);
    }
  }
}
