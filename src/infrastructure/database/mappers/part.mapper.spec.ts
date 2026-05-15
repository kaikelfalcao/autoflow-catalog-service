import { PartMapper } from './part.mapper';
import { PartCategory } from '../../../domain/parts/enums/part-category.enum';
import { Unit } from '../../../domain/parts/enums/unit.enum';
import type { PartDocument } from '../schemas/part.schema';

function makeDoc(overrides = {}) {
  return {
    _id: { toString: () => 'part-id-1' },
    sku: 'PART-FILTER-AABBCCDD',
    name: 'Oil Filter',
    category: PartCategory.FILTER,
    unit: Unit.UN,
    attributes: { brand: 'Bosch' },
    stockQuantity: 10,
    reservedQuantity: 2,
    minimumStock: 3,
    active: true,
    lowStockAlertSent: false,
    ...overrides,
  } as unknown as PartDocument;
}

describe('PartMapper', () => {
  describe('toDomain', () => {
    it('maps document to Part entity', () => {
      const part = PartMapper.toDomain(makeDoc());
      expect(part.id).toBe('part-id-1');
      expect(part.sku.value).toBe('PART-FILTER-AABBCCDD');
      expect(part.name).toBe('Oil Filter');
      expect(part.stockQuantity).toBe(10);
      expect(part.reservedQuantity).toBe(2);
      expect(part.attributes).toEqual({ brand: 'Bosch' });
    });

    it('uses empty object for null attributes', () => {
      const part = PartMapper.toDomain(makeDoc({ attributes: null }));
      expect(part.attributes).toEqual({});
    });
  });

  describe('toPersistence', () => {
    it('maps Part entity to persistence object', () => {
      const part = PartMapper.toDomain(makeDoc());
      const data = PartMapper.toPersistence(part);
      expect(data.name).toBe('Oil Filter');
      expect(data.stockQuantity).toBe(10);
      expect(data.category).toBe(PartCategory.FILTER);
    });
  });
});
