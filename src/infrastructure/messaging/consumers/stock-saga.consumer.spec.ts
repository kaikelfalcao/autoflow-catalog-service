import { Nack } from '@golevelup/nestjs-rabbitmq';
import { StockSagaConsumer } from './stock-saga.consumer';
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

type ReservePayload = {
  osId: string;
  items: Array<{ partId: string; quantity: number }>;
};
type ConsumePayload = { osId: string; reservationId: string };

function makeEnvelope<T>(payload: T, sagaId = 'saga-1'): EventEnvelope<T> {
  return {
    eventId: 'evt-1',
    correlationId: 'corr-1',
    sagaId,
    occurredAt: new Date().toISOString(),
    version: '1.0',
    source: 'saga-orchestrator',
    payload,
  };
}

describe('StockSagaConsumer', () => {
  let consumer: StockSagaConsumer;
  let stockService: {
    reserveStock: jest.Mock;
    consumeStock: jest.Mock;
    releaseReservation: jest.Mock;
  };

  beforeEach(() => {
    stockService = {
      reserveStock: jest.fn().mockResolvedValue(undefined),
      consumeStock: jest.fn().mockResolvedValue(undefined),
      releaseReservation: jest.fn().mockResolvedValue(undefined),
    };
    consumer = new StockSagaConsumer(stockService as unknown as StockService);
  });

  describe('handleReserveStock', () => {
    it('calls stockService.reserveStock and returns void on success', async () => {
      const env = makeEnvelope<ReservePayload>({ osId: 'os-1', items: [] });
      const result = await consumer.handleReserveStock(env);
      expect(stockService.reserveStock).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('returns Nack(false) on error', async () => {
      stockService.reserveStock.mockRejectedValue(new Error('fail'));
      const env = makeEnvelope<ReservePayload>({ osId: 'os-1', items: [] });
      const result = await consumer.handleReserveStock(env);
      expect(result).toBeInstanceOf(Nack);
    });
  });

  describe('handleConsumeStock', () => {
    it('calls stockService.consumeStock and returns void on success', async () => {
      const env = makeEnvelope<ConsumePayload>({
        osId: 'os-1',
        reservationId: 'res-1',
      });
      const result = await consumer.handleConsumeStock(env);
      expect(stockService.consumeStock).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('returns Nack(false) on error', async () => {
      stockService.consumeStock.mockRejectedValue(new Error('fail'));
      const env = makeEnvelope<ConsumePayload>({
        osId: 'os-1',
        reservationId: 'res-1',
      });
      const result = await consumer.handleConsumeStock(env);
      expect(result).toBeInstanceOf(Nack);
    });
  });

  describe('handleReleaseReservation', () => {
    it('calls stockService.releaseReservation and returns void on success', async () => {
      const env = makeEnvelope<ConsumePayload>({
        osId: 'os-1',
        reservationId: 'res-1',
      });
      const result = await consumer.handleReleaseReservation(env);
      expect(stockService.releaseReservation).toHaveBeenCalled();
      expect(result).toBeUndefined();
    });

    it('returns Nack(false) on error', async () => {
      stockService.releaseReservation.mockRejectedValue(new Error('fail'));
      const env = makeEnvelope<ConsumePayload>({
        osId: 'os-1',
        reservationId: 'res-1',
      });
      const result = await consumer.handleReleaseReservation(env);
      expect(result).toBeInstanceOf(Nack);
    });
  });
});
