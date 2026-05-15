import { Injectable, Logger } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class DlqConsumer {
  private readonly logger = new Logger(DlqConsumer.name);

  @RabbitSubscribe({
    exchange: 'oficina.dlx',
    routingKey: 'catalog.stock.reserve-stock.dlq',
    queue: 'catalog.stock.reserve-stock.dlq',
    queueOptions: { durable: true },
  })
  handleReserveStockDlq(message: unknown): void {
    this.logger.error('DLQ: reserve-stock message failed after retries', {
      message,
    });
  }

  @RabbitSubscribe({
    exchange: 'oficina.dlx',
    routingKey: 'catalog.stock.consume-stock.dlq',
    queue: 'catalog.stock.consume-stock.dlq',
    queueOptions: { durable: true },
  })
  handleConsumeStockDlq(message: unknown): void {
    this.logger.error('DLQ: consume-stock message failed after retries', {
      message,
    });
  }

  @RabbitSubscribe({
    exchange: 'oficina.dlx',
    routingKey: 'catalog.stock.release-reservation.dlq',
    queue: 'catalog.stock.release-reservation.dlq',
    queueOptions: { durable: true },
  })
  handleReleaseReservationDlq(message: unknown): void {
    this.logger.error('DLQ: release-reservation message failed after retries', {
      message,
    });
  }
}
