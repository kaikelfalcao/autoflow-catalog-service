import { Injectable } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  SagaReplyPublisher,
  StockReservedPayload,
  StockConsumedPayload,
  ReservationReleasedPayload,
  StockInsufficientPayload,
  LowStockAlertPayload,
} from '../../../domain/parts/ports/saga-reply.publisher';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RabbitMQSagaReplyPublisher implements SagaReplyPublisher {
  constructor(private readonly amqp: AmqpConnection) {}

  private buildEnvelope<T>(payload: T, sagaId?: string) {
    return {
      eventId: uuidv4(),
      correlationId: uuidv4(),
      sagaId,
      occurredAt: new Date().toISOString(),
      version: '1.0',
      source: 'catalog-service',
      payload,
    };
  }

  async publishStockReserved(payload: StockReservedPayload): Promise<void> {
    await this.amqp.publish(
      'oficina.replies',
      'stock.stock-reserved',
      this.buildEnvelope(payload, payload.sagaId),
    );
  }

  async publishStockConsumed(payload: StockConsumedPayload): Promise<void> {
    await this.amqp.publish(
      'oficina.replies',
      'stock.stock-consumed',
      this.buildEnvelope(payload, payload.sagaId),
    );
  }

  async publishReservationReleased(
    payload: ReservationReleasedPayload,
  ): Promise<void> {
    await this.amqp.publish(
      'oficina.replies',
      'stock.reservation-released',
      this.buildEnvelope(payload, payload.sagaId),
    );
  }

  async publishStockInsufficient(
    payload: StockInsufficientPayload,
  ): Promise<void> {
    await this.amqp.publish(
      'oficina.replies',
      'stock.stock-insufficient',
      this.buildEnvelope(payload, payload.sagaId),
    );
  }

  async publishLowStockAlert(payload: LowStockAlertPayload): Promise<void> {
    await this.amqp.publish(
      'oficina.alerts',
      'stock.low-stock-alert',
      this.buildEnvelope(payload),
    );
  }
}
