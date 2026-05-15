import { ServiceMapper } from './service.mapper';
import type { ServiceDocument } from '../schemas/service.schema';

function makeServiceDoc(overrides = {}) {
  return {
    _id: { toString: () => 'svc-id-1' },
    sku: 'SVC-ABCD1234',
    name: 'Oil Change',
    description: 'Full oil change',
    estimatedMinutes: 30,
    laborCost: { amount: 5000, currency: 'BRL' },
    active: true,
    ...overrides,
  } as unknown as ServiceDocument;
}

describe('ServiceMapper', () => {
  describe('toDomain', () => {
    it('maps document to Service entity', () => {
      const svc = ServiceMapper.toDomain(makeServiceDoc());
      expect(svc.id).toBe('svc-id-1');
      expect(svc.sku).toBe('SVC-ABCD1234');
      expect(svc.name).toBe('Oil Change');
      expect(svc.estimatedDuration.minutes).toBe(30);
      expect(svc.laborCost.amount).toBe(5000);
      expect(svc.active).toBe(true);
    });
  });

  describe('toPersistence', () => {
    it('maps Service entity back to persistence object', () => {
      const svc = ServiceMapper.toDomain(makeServiceDoc());
      const data = ServiceMapper.toPersistence(svc);
      expect(data.name).toBe('Oil Change');
      expect(data.estimatedMinutes).toBe(30);
      expect(data.laborCost?.amount).toBe(5000);
      expect(data.active).toBe(true);
    });
  });
});
