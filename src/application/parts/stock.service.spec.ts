import { StockService } from './stock.service';
import { Part } from '../../domain/parts/entities/part.entity';
import { SKU } from '../../domain/parts/value-objects/sku.vo';
import { StockReservation } from '../../domain/parts/entities/stock-reservation.entity';
import { ReservationStatus } from '../../domain/parts/enums/reservation-status.enum';
import { PartCategory } from '../../domain/parts/enums/part-category.enum';
import { Unit } from '../../domain/parts/enums/unit.enum';
import type { PartRepository } from '../../domain/parts/ports/part.repository';
import type { ReservationRepository } from '../../domain/parts/ports/reservation.repository';
import type { SagaReplyPublisher } from '../../domain/parts/ports/saga-reply.publisher';

const makePart = (id: string, stock: number, reserved = 0): Part =>
  new Part(
    id,
    new SKU('PART-FILTER-AABBCCDD'),
    'Filter',
    PartCategory.FILTER,
    Unit.UN,
    {},
    stock,
    reserved,
    5,
    true,
    false,
  );

const makeReservation = (
  id: string,
  sagaId: string,
  status: ReservationStatus,
): StockReservation =>
  new StockReservation(
    id,
    sagaId,
    'os-1',
    [{ partId: 'part-1', quantity: 3 }],
    status,
    new Date(),
    new Date(),
  );

describe('StockService', () => {
  let stockService: StockService;
  let partRepo: PartRepository & {
    findById: jest.Mock;
    findAll: jest.Mock;
    findLowStock: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let reservationRepo: ReservationRepository & {
    findBySagaId: jest.Mock;
    findById: jest.Mock;
    findByOsId: jest.Mock;
    hasActiveReservationsForPart: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    saveMovement: jest.Mock;
    findMovementsByPartId: jest.Mock;
  };
  let publisher: SagaReplyPublisher & {
    publishStockReserved: jest.Mock;
    publishStockConsumed: jest.Mock;
    publishReservationReleased: jest.Mock;
    publishStockInsufficient: jest.Mock;
    publishLowStockAlert: jest.Mock;
  };

  beforeEach(() => {
    partRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findLowStock: jest.fn(),
      save: jest.fn(),
      update: jest.fn().mockImplementation((p: Part) => Promise.resolve(p)),
    };
    reservationRepo = {
      findBySagaId: jest.fn(),
      findById: jest.fn(),
      findByOsId: jest.fn(),
      hasActiveReservationsForPart: jest.fn(),
      save: jest
        .fn()
        .mockImplementation((r: StockReservation) => Promise.resolve(r)),
      update: jest
        .fn()
        .mockImplementation((r: StockReservation) => Promise.resolve(r)),
      saveMovement: jest.fn().mockResolvedValue(undefined),
      findMovementsByPartId: jest.fn(),
    };
    publisher = {
      publishStockReserved: jest.fn().mockResolvedValue(undefined),
      publishStockConsumed: jest.fn().mockResolvedValue(undefined),
      publishReservationReleased: jest.fn().mockResolvedValue(undefined),
      publishStockInsufficient: jest.fn().mockResolvedValue(undefined),
      publishLowStockAlert: jest.fn().mockResolvedValue(undefined),
    };

    stockService = new StockService(partRepo, reservationRepo, publisher);
  });

  const baseCmd = {
    eventId: 'evt-1',
    correlationId: 'corr-1',
    sagaId: 'saga-1',
    osId: 'os-1',
  };

  describe('reserveStock', () => {
    it('reserves stock when sufficient and persists', async () => {
      const part = makePart('part-1', 10);
      partRepo.findById.mockResolvedValue(part);
      reservationRepo.findBySagaId.mockResolvedValue(null);

      await stockService.reserveStock({
        ...baseCmd,
        items: [{ partId: 'part-1', quantity: 3 }],
      });

      expect(reservationRepo.save).toHaveBeenCalled();
      expect(publisher.publishStockReserved).toHaveBeenCalledWith(
        expect.objectContaining({ sagaId: 'saga-1', osId: 'os-1' }),
      );
    });

    it('publishes stock-insufficient when one item has insufficient stock', async () => {
      const part = makePart('part-1', 2);
      partRepo.findById.mockResolvedValue(part);
      reservationRepo.findBySagaId.mockResolvedValue(null);

      await stockService.reserveStock({
        ...baseCmd,
        items: [{ partId: 'part-1', quantity: 5 }],
      });

      expect(reservationRepo.save).not.toHaveBeenCalled();
      expect(publisher.publishStockInsufficient).toHaveBeenCalledWith(
        expect.objectContaining({
          failures: [{ partId: 'part-1', requested: 5, available: 2 }],
        }),
      );
    });

    it('reports all failures when multiple items fail', async () => {
      partRepo.findById
        .mockResolvedValueOnce(makePart('part-1', 1))
        .mockResolvedValueOnce(makePart('part-2', 0));
      reservationRepo.findBySagaId.mockResolvedValue(null);

      await stockService.reserveStock({
        ...baseCmd,
        items: [
          { partId: 'part-1', quantity: 5 },
          { partId: 'part-2', quantity: 3 },
        ],
      });

      type InsufficientPayload = {
        failures: Array<{
          partId: string;
          requested: number;
          available: number;
        }>;
      };
      const calls = publisher.publishStockInsufficient.mock.calls as [
        InsufficientPayload,
      ][];
      expect(calls[0]?.[0]?.failures).toHaveLength(2);
    });

    it('is idempotent — returns reply without reprocessing if sagaId ACTIVE', async () => {
      const existing = makeReservation(
        'res-1',
        'saga-1',
        ReservationStatus.ACTIVE,
      );
      reservationRepo.findBySagaId.mockResolvedValue(existing);

      await stockService.reserveStock({
        ...baseCmd,
        items: [{ partId: 'part-1', quantity: 3 }],
      });

      expect(reservationRepo.save).not.toHaveBeenCalled();
      expect(publisher.publishStockReserved).toHaveBeenCalledWith(
        expect.objectContaining({ reservationId: 'res-1' }),
      );
    });

    it('skips reply when existing sagaId is CONSUMED', async () => {
      const existing = makeReservation(
        'res-1',
        'saga-1',
        ReservationStatus.CONSUMED,
      );
      reservationRepo.findBySagaId.mockResolvedValue(existing);

      await stockService.reserveStock({
        ...baseCmd,
        items: [{ partId: 'part-1', quantity: 3 }],
      });

      expect(reservationRepo.save).not.toHaveBeenCalled();
      expect(publisher.publishStockReserved).not.toHaveBeenCalled();
    });

    it('treats missing part as insufficient stock', async () => {
      partRepo.findById.mockResolvedValue(null);
      reservationRepo.findBySagaId.mockResolvedValue(null);

      await stockService.reserveStock({
        ...baseCmd,
        items: [{ partId: 'part-missing', quantity: 1 }],
      });

      expect(publisher.publishStockInsufficient).toHaveBeenCalled();
    });
  });

  describe('consumeStock', () => {
    it('consumes ACTIVE reservation and publishes stock-consumed', async () => {
      const part = makePart('part-1', 10, 3);
      const reservation = makeReservation(
        'res-1',
        'saga-1',
        ReservationStatus.ACTIVE,
      );
      reservationRepo.findById.mockResolvedValue(reservation);
      partRepo.findById.mockResolvedValue(part);

      await stockService.consumeStock({
        ...baseCmd,
        reservationId: 'res-1',
      });

      expect(reservationRepo.update).toHaveBeenCalled();
      expect(publisher.publishStockConsumed).toHaveBeenCalledWith(
        expect.objectContaining({ reservationId: 'res-1' }),
      );
    });

    it('emits low-stock alert when stock crosses minimum after consume', async () => {
      const part = makePart('part-1', 8, 3);
      part.minimumStock = 5;
      const reservation = makeReservation(
        'res-1',
        'saga-1',
        ReservationStatus.ACTIVE,
      );
      reservationRepo.findById.mockResolvedValue(reservation);
      partRepo.findById.mockResolvedValue(part);

      await stockService.consumeStock({ ...baseCmd, reservationId: 'res-1' });

      expect(publisher.publishLowStockAlert).toHaveBeenCalled();
    });

    it('is idempotent — replies without reprocessing when CONSUMED', async () => {
      const reservation = makeReservation(
        'res-1',
        'saga-1',
        ReservationStatus.CONSUMED,
      );
      reservationRepo.findById.mockResolvedValue(reservation);

      await stockService.consumeStock({ ...baseCmd, reservationId: 'res-1' });

      expect(partRepo.findById).not.toHaveBeenCalled();
      expect(publisher.publishStockConsumed).toHaveBeenCalled();
    });

    it('returns early when reservation not found', async () => {
      reservationRepo.findById.mockResolvedValue(null);

      await stockService.consumeStock({
        ...baseCmd,
        reservationId: 'res-missing',
      });

      expect(publisher.publishStockConsumed).not.toHaveBeenCalled();
    });

    it('skips missing part without crashing', async () => {
      const reservation = makeReservation(
        'res-1',
        'saga-1',
        ReservationStatus.ACTIVE,
      );
      reservationRepo.findById.mockResolvedValue(reservation);
      partRepo.findById.mockResolvedValue(null);

      await expect(
        stockService.consumeStock({ ...baseCmd, reservationId: 'res-1' }),
      ).resolves.not.toThrow();
    });
  });

  describe('releaseReservation', () => {
    it('releases ACTIVE reservation and publishes reservation-released', async () => {
      const part = makePart('part-1', 10, 3);
      const reservation = makeReservation(
        'res-1',
        'saga-1',
        ReservationStatus.ACTIVE,
      );
      reservationRepo.findById.mockResolvedValue(reservation);
      partRepo.findById.mockResolvedValue(part);

      await stockService.releaseReservation({
        ...baseCmd,
        reservationId: 'res-1',
      });

      expect(reservationRepo.update).toHaveBeenCalled();
      expect(publisher.publishReservationReleased).toHaveBeenCalledWith(
        expect.objectContaining({ reservationId: 'res-1' }),
      );
    });

    it('is idempotent — replies without reprocessing when RELEASED', async () => {
      const reservation = makeReservation(
        'res-1',
        'saga-1',
        ReservationStatus.RELEASED,
      );
      reservationRepo.findById.mockResolvedValue(reservation);

      await stockService.releaseReservation({
        ...baseCmd,
        reservationId: 'res-1',
      });

      expect(partRepo.findById).not.toHaveBeenCalled();
      expect(publisher.publishReservationReleased).toHaveBeenCalled();
    });

    it('returns early when reservation not found', async () => {
      reservationRepo.findById.mockResolvedValue(null);

      await stockService.releaseReservation({
        ...baseCmd,
        reservationId: 'res-missing',
      });

      expect(publisher.publishReservationReleased).not.toHaveBeenCalled();
    });

    it('skips missing part without crashing', async () => {
      const reservation = makeReservation(
        'res-1',
        'saga-1',
        ReservationStatus.ACTIVE,
      );
      reservationRepo.findById.mockResolvedValue(reservation);
      partRepo.findById.mockResolvedValue(null);

      await expect(
        stockService.releaseReservation({ ...baseCmd, reservationId: 'res-1' }),
      ).resolves.not.toThrow();
    });
  });
});
