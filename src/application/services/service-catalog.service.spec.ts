import { ServiceCatalogService } from './service-catalog.service';
import { Service } from '../../domain/services/entities/service.entity';
import { Money } from '../../domain/services/value-objects/money.vo';
import { EstimatedDuration } from '../../domain/services/value-objects/estimated-duration.vo';
import { ServiceNotFoundError } from '../../domain/shared/errors/service-not-found.error';

const makeService = (id = 'svc-1'): Service =>
  new Service(
    id,
    'SVC-ABCD1234',
    'Oil Change',
    'Service description',
    new EstimatedDuration(30),
    new Money(5000, 'BRL'),
    true,
  );

describe('ServiceCatalogService', () => {
  let service: ServiceCatalogService;
  let serviceRepo: {
    findById: jest.Mock;
    findAll: jest.Mock;
    save: jest.Mock;
    update: jest.Mock;
  };

  beforeEach(() => {
    serviceRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      save: jest.fn().mockImplementation((s: Service) => Promise.resolve(s)),
      update: jest.fn().mockImplementation((s: Service) => Promise.resolve(s)),
    };
    service = new ServiceCatalogService(serviceRepo);
  });

  describe('findAll', () => {
    it('delegates to repository', async () => {
      const result = { data: [], total: 0, page: 1, limit: 20 };
      serviceRepo.findAll.mockResolvedValue(result);
      await expect(service.findAll({})).resolves.toBe(result);
    });
  });

  describe('findById', () => {
    it('returns service when found', async () => {
      const svc = makeService();
      serviceRepo.findById.mockResolvedValue(svc);
      await expect(service.findById('svc-1')).resolves.toBe(svc);
    });

    it('throws ServiceNotFoundError when not found', async () => {
      serviceRepo.findById.mockResolvedValue(null);
      await expect(service.findById('missing')).rejects.toThrow(
        ServiceNotFoundError,
      );
    });
  });

  describe('create', () => {
    it('creates service with auto-generated SKU', async () => {
      const result = await service.create({
        name: 'Alignment',
        estimatedMinutes: 60,
        laborCost: { amount: 8000, currency: 'BRL' },
      });
      expect(serviceRepo.save).toHaveBeenCalled();
      expect(result.name).toBe('Alignment');
      expect(result.sku).toMatch(/^SVC-/);
    });

    it('uses empty string for description when not provided', async () => {
      const result = await service.create({
        name: 'Test',
        estimatedMinutes: 15,
        laborCost: { amount: 1000, currency: 'BRL' },
      });
      expect(result.description).toBe('');
    });

    it('uses provided description', async () => {
      const result = await service.create({
        name: 'Test',
        description: 'desc',
        estimatedMinutes: 15,
        laborCost: { amount: 1000, currency: 'BRL' },
      });
      expect(result.description).toBe('desc');
    });
  });

  describe('update', () => {
    it('updates name, description, duration and cost', async () => {
      const svc = makeService();
      serviceRepo.findById.mockResolvedValue(svc);

      await service.update('svc-1', {
        name: 'Wheel Alignment',
        description: 'Updated desc',
        estimatedMinutes: 45,
        laborCost: { amount: 9000, currency: 'BRL' },
      });

      expect(svc.name).toBe('Wheel Alignment');
      expect(svc.description).toBe('Updated desc');
      expect(svc.estimatedDuration.minutes).toBe(45);
      expect(svc.laborCost.amount).toBe(9000);
      expect(serviceRepo.update).toHaveBeenCalled();
    });

    it('does not change fields that are undefined', async () => {
      const svc = makeService();
      serviceRepo.findById.mockResolvedValue(svc);
      await service.update('svc-1', {});
      expect(svc.name).toBe('Oil Change');
    });

    it('throws ServiceNotFoundError when not found', async () => {
      serviceRepo.findById.mockResolvedValue(null);
      await expect(service.update('missing', {})).rejects.toThrow(
        ServiceNotFoundError,
      );
    });
  });

  describe('softDelete', () => {
    it('deactivates the service', async () => {
      const svc = makeService();
      serviceRepo.findById.mockResolvedValue(svc);

      await service.softDelete('svc-1');

      expect(svc.active).toBe(false);
      expect(serviceRepo.update).toHaveBeenCalled();
    });

    it('throws ServiceNotFoundError when not found', async () => {
      serviceRepo.findById.mockResolvedValue(null);
      await expect(service.softDelete('missing')).rejects.toThrow(
        ServiceNotFoundError,
      );
    });
  });
});
