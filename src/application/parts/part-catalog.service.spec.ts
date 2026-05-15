import { PartCatalogService } from './part-catalog.service';
import { Part } from '../../domain/parts/entities/part.entity';
import { SKU } from '../../domain/parts/value-objects/sku.vo';
import { PartCategory } from '../../domain/parts/enums/part-category.enum';
import { Unit } from '../../domain/parts/enums/unit.enum';
import { PartNotFoundError } from '../../domain/shared/errors/part-not-found.error';
import { PartHasActiveReservationsError } from '../../domain/shared/errors/part-has-active-reservations.error';
import type { SagaReplyPublisher } from '../../domain/parts/ports/saga-reply.publisher';

const makePart = (id = 'p-1', stock = 10): Part =>
  new Part(
    id,
    new SKU('PART-FILTER-AABBCCDD'),
    'Filter',
    PartCategory.FILTER,
    Unit.UN,
    {},
    stock,
    0,
    5,
    true,
    false,
  );

describe('PartCatalogService', () => {
  let service: PartCatalogService;
  let partRepo: {
    findById: jest.Mock;
    findAll: jest.Mock;
    findLowStock: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };
  let reservationRepo: {
    findBySagaId: jest.Mock;
    findById: jest.Mock;
    findByOsId: jest.Mock;
    hasActiveReservationsForPart: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
    saveMovement: jest.Mock;
    findMovementsByPartId: jest.Mock;
  };
  let publisher: { publishLowStockAlert: jest.Mock };

  beforeEach(() => {
    partRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      findLowStock: jest.fn(),
      save: jest.fn().mockImplementation((p: Part) => Promise.resolve(p)),
      update: jest.fn().mockImplementation((p: Part) => Promise.resolve(p)),
    };
    reservationRepo = {
      findBySagaId: jest.fn(),
      findById: jest.fn(),
      findByOsId: jest.fn(),
      hasActiveReservationsForPart: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      saveMovement: jest.fn().mockResolvedValue(undefined),
      findMovementsByPartId: jest.fn(),
    };
    publisher = {
      publishLowStockAlert: jest.fn().mockResolvedValue(undefined),
    };
    service = new PartCatalogService(
      partRepo,
      reservationRepo,
      publisher as unknown as SagaReplyPublisher,
    );
  });

  describe('findAll', () => {
    it('delegates to repository', async () => {
      const result = { data: [], total: 0, page: 1, limit: 20 };
      partRepo.findAll.mockResolvedValue(result);
      await expect(service.findAll({})).resolves.toBe(result);
    });
  });

  describe('findById', () => {
    it('returns part when found', async () => {
      const part = makePart();
      partRepo.findById.mockResolvedValue(part);
      await expect(service.findById('p-1')).resolves.toBe(part);
    });

    it('throws PartNotFoundError when not found', async () => {
      partRepo.findById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(
        PartNotFoundError,
      );
    });
  });

  describe('findLowStock', () => {
    it('delegates to repository', async () => {
      partRepo.findLowStock.mockResolvedValue([]);
      await expect(service.findLowStock()).resolves.toEqual([]);
    });
  });

  describe('create', () => {
    it('creates part with auto-generated SKU and initial movement', async () => {
      const part = await service.create({
        name: 'Oil Filter',
        category: PartCategory.FILTER,
        unit: Unit.UN,
        stockQuantity: 10,
        minimumStock: 2,
      });
      expect(partRepo.save).toHaveBeenCalled();
      expect(reservationRepo.saveMovement).toHaveBeenCalled();
      expect(part.name).toBe('Oil Filter');
    });

    it('creates part without initial movement when stockQuantity is 0', async () => {
      await service.create({
        name: 'Empty Part',
        category: PartCategory.FILTER,
        unit: Unit.UN,
        stockQuantity: 0,
        minimumStock: 2,
      });
      expect(reservationRepo.saveMovement).not.toHaveBeenCalled();
    });

    it('uses custom attributes when provided', async () => {
      await service.create({
        name: 'Part',
        category: PartCategory.OIL,
        unit: Unit.L,
        stockQuantity: 5,
        minimumStock: 1,
        attributes: { brand: 'Mobil' },
      });
      expect(partRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates allowed fields', async () => {
      const part = makePart();
      partRepo.findById.mockResolvedValue(part);

      await service.update('p-1', { name: 'New Name', minimumStock: 3 });

      expect(partRepo.update).toHaveBeenCalled();
      expect(part.name).toBe('New Name');
      expect(part.minimumStock).toBe(3);
    });

    it('throws PartNotFoundError when part not found', async () => {
      partRepo.findById.mockResolvedValue(null);
      await expect(service.update('missing', {})).rejects.toThrow(
        PartNotFoundError,
      );
    });

    it('updates attributes when provided', async () => {
      const part = makePart();
      partRepo.findById.mockResolvedValue(part);
      await service.update('p-1', { attributes: { brand: 'X' } });
      expect(part.attributes).toEqual({ brand: 'X' });
    });
  });

  describe('replenish', () => {
    it('increases stock and saves movement', async () => {
      const part = makePart('p-1', 5);
      partRepo.findById.mockResolvedValue(part);

      await service.replenish('p-1', { quantity: 10, reason: 'restock' });

      expect(partRepo.update).toHaveBeenCalled();
      expect(reservationRepo.saveMovement).toHaveBeenCalled();
      expect(part.stockQuantity).toBe(15);
    });

    it('throws when part not found', async () => {
      partRepo.findById.mockResolvedValue(null);
      await expect(
        service.replenish('missing', { quantity: 5, reason: 'r' }),
      ).rejects.toThrow(PartNotFoundError);
    });
  });

  describe('adjustStock', () => {
    it('replenishes when newQuantity > current stock', async () => {
      const part = makePart('p-1', 5);
      partRepo.findById.mockResolvedValue(part);
      await service.adjustStock('p-1', {
        newQuantity: 10,
        reason: 'correction',
      });
      expect(partRepo.update).toHaveBeenCalled();
      expect(part.stockQuantity).toBe(10);
    });

    it('reduces stock and saves OUT movement', async () => {
      const part = makePart('p-1', 10);
      partRepo.findById.mockResolvedValue(part);
      await service.adjustStock('p-1', { newQuantity: 7, reason: 'shrink' });
      expect(reservationRepo.saveMovement).toHaveBeenCalled();
      expect(part.stockQuantity).toBe(7);
    });

    it('emits low-stock alert when decrease crosses minimum', async () => {
      const part = makePart('p-1', 10);
      partRepo.findById.mockResolvedValue(part);
      await service.adjustStock('p-1', { newQuantity: 3, reason: 'shrink' });
      expect(publisher.publishLowStockAlert).toHaveBeenCalledWith(
        expect.objectContaining({ partId: 'p-1', currentStock: 3 }),
      );
    });

    it('does not emit alert when stock stays above minimum', async () => {
      const part = makePart('p-1', 10);
      partRepo.findById.mockResolvedValue(part);
      await service.adjustStock('p-1', { newQuantity: 7, reason: 'trim' });
      expect(publisher.publishLowStockAlert).not.toHaveBeenCalled();
    });

    it('returns without changes when diff is 0', async () => {
      const part = makePart('p-1', 10);
      partRepo.findById.mockResolvedValue(part);
      await service.adjustStock('p-1', { newQuantity: 10, reason: 'noop' });
      expect(partRepo.update).not.toHaveBeenCalled();
    });

    it('throws when part not found', async () => {
      partRepo.findById.mockResolvedValue(null);
      await expect(
        service.adjustStock('missing', { newQuantity: 5, reason: 'r' }),
      ).rejects.toThrow(PartNotFoundError);
    });
  });

  describe('softDelete', () => {
    it('deactivates part when no active reservations', async () => {
      const part = makePart();
      partRepo.findById.mockResolvedValue(part);
      reservationRepo.hasActiveReservationsForPart.mockResolvedValue(false);

      await service.softDelete('p-1');

      expect(part.active).toBe(false);
      expect(partRepo.update).toHaveBeenCalled();
    });

    it('throws PartHasActiveReservationsError when active reservations exist', async () => {
      const part = makePart();
      partRepo.findById.mockResolvedValue(part);
      reservationRepo.hasActiveReservationsForPart.mockResolvedValue(true);

      await expect(service.softDelete('p-1')).rejects.toThrow(
        PartHasActiveReservationsError,
      );
    });

    it('throws PartNotFoundError when part not found', async () => {
      partRepo.findById.mockResolvedValue(null);
      await expect(service.softDelete('missing')).rejects.toThrow(
        PartNotFoundError,
      );
    });
  });

  describe('findMovements', () => {
    it('returns movements for a part', async () => {
      const part = makePart();
      partRepo.findById.mockResolvedValue(part);
      const result = { data: [], total: 0, page: 1, limit: 20 };
      reservationRepo.findMovementsByPartId.mockResolvedValue(result);

      await expect(service.findMovements('p-1', {})).resolves.toBe(result);
    });

    it('throws when part not found', async () => {
      partRepo.findById.mockResolvedValue(null);
      await expect(service.findMovements('missing', {})).rejects.toThrow(
        PartNotFoundError,
      );
    });
  });

  describe('findReservationsByOsId', () => {
    it('delegates to reservation repository', async () => {
      reservationRepo.findByOsId.mockResolvedValue([]);
      await expect(service.findReservationsByOsId('os-1')).resolves.toEqual([]);
    });
  });
});
