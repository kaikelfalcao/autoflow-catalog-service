import { SKU } from './sku.vo';
import { PartCategory } from '../enums/part-category.enum';

describe('SKU', () => {
  it('accepts a valid SKU', () => {
    const sku = new SKU('PART-FILTER-AABBCCDD');
    expect(sku.value).toBe('PART-FILTER-AABBCCDD');
  });

  it('throws for invalid format', () => {
    expect(() => new SKU('invalid')).toThrow('SKU inválido');
  });

  it('throws for lowercase hex', () => {
    expect(() => new SKU('PART-FILTER-aabbccdd')).toThrow('SKU inválido');
  });

  it('generate creates a valid SKU for every category', () => {
    for (const category of Object.values(PartCategory)) {
      const sku = SKU.generate(category);
      expect(sku.value).toMatch(/^PART-[A-Z_]+-[A-F0-9]{8}$/);
    }
  });
});
