import { Quantity } from './quantity.vo';
import { InvalidQuantityError } from '../../shared/errors/invalid-quantity.error';

describe('Quantity', () => {
  it('should create valid quantity', () => {
    const qty = new Quantity(5);
    expect(qty.value).toBe(5);
  });

  it('should throw for zero', () => {
    expect(() => new Quantity(0)).toThrow(InvalidQuantityError);
  });

  it('should throw for negative value', () => {
    expect(() => new Quantity(-1)).toThrow(InvalidQuantityError);
  });

  it('should throw for decimal value', () => {
    expect(() => new Quantity(1.5)).toThrow(InvalidQuantityError);
  });
});
