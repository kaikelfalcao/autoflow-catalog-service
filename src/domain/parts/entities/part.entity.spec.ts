import { Part } from './part.entity';
import { SKU } from '../value-objects/sku.vo';
import { Quantity } from '../value-objects/quantity.vo';
import { PartCategory } from '../enums/part-category.enum';
import { Unit } from '../enums/unit.enum';
import { InsufficientStockError } from '../../shared/errors/insufficient-stock.error';

function makePart(): Part {
  return new Part(
    'part-1',
    new SKU('PART-FILTER-AABBCCDD'),
    'Oil Filter',
    PartCategory.FILTER,
    Unit.UN,
    {},
    10,
    0,
    5,
    true,
    false,
  );
}

describe('Part', () => {
  it('should calculate availableQuantity correctly', () => {
    const part = makePart();
    part.reservedQuantity = 3;
    expect(part.availableQuantity).toBe(7);
  });

  it('canReserve returns false when part is inactive', () => {
    const part = makePart();
    part.active = false;
    expect(part.canReserve(3)).toBe(false);
  });

  it('canReserve returns false when qty > available', () => {
    const part = makePart();
    expect(part.canReserve(11)).toBe(false);
  });

  it('canReserve returns true when enough stock and active', () => {
    const part = makePart();
    expect(part.canReserve(5)).toBe(true);
  });

  it('reserve increments reservedQuantity', () => {
    const part = makePart();
    part.reserve(new Quantity(3));
    expect(part.reservedQuantity).toBe(3);
  });

  it('reserve throws InsufficientStockError when not enough stock', () => {
    const part = makePart();
    expect(() => part.reserve(new Quantity(11))).toThrow(
      InsufficientStockError,
    );
  });

  it('consume decrements stockQuantity and reservedQuantity', () => {
    const part = makePart();
    part.reserve(new Quantity(3));
    part.consume(new Quantity(3));
    expect(part.stockQuantity).toBe(7);
    expect(part.reservedQuantity).toBe(0);
  });

  it('releaseReservation decrements reservedQuantity', () => {
    const part = makePart();
    part.reserve(new Quantity(4));
    part.releaseReservation(new Quantity(4));
    expect(part.reservedQuantity).toBe(0);
  });

  it('replenish resets lowStockAlertSent when stock goes above minimum', () => {
    const part = makePart();
    part.stockQuantity = 3;
    part.lowStockAlertSent = true;
    part.replenish(new Quantity(10));
    expect(part.lowStockAlertSent).toBe(false);
  });

  it('replenish does NOT reset lowStockAlertSent when stock stays below minimum', () => {
    const part = makePart();
    part.stockQuantity = 3;
    part.minimumStock = 10;
    part.lowStockAlertSent = true;
    part.replenish(new Quantity(2));
    expect(part.lowStockAlertSent).toBe(true);
  });

  it('isBelowMinimum returns true when stockQuantity <= minimumStock', () => {
    const part = makePart();
    part.stockQuantity = 5;
    expect(part.isBelowMinimum()).toBe(true);
  });

  it('isBelowMinimum returns false when stockQuantity > minimumStock', () => {
    const part = makePart();
    expect(part.isBelowMinimum()).toBe(false);
  });

  it('shouldEmitLowStockAlert returns true when below minimum and flag is false', () => {
    const part = makePart();
    part.stockQuantity = 4;
    expect(part.shouldEmitLowStockAlert()).toBe(true);
  });

  it('shouldEmitLowStockAlert returns false when flag already sent', () => {
    const part = makePart();
    part.stockQuantity = 4;
    part.lowStockAlertSent = true;
    expect(part.shouldEmitLowStockAlert()).toBe(false);
  });

  it('markLowStockAlertSent sets flag to true', () => {
    const part = makePart();
    part.markLowStockAlertSent();
    expect(part.lowStockAlertSent).toBe(true);
  });
});
