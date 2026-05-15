import { InvalidQuantityError } from './invalid-quantity.error';
import { PartNotFoundError } from './part-not-found.error';
import { ServiceNotFoundError } from './service-not-found.error';
import { PartHasActiveReservationsError } from './part-has-active-reservations.error';
import { InsufficientStockError } from './insufficient-stock.error';

describe('Domain Errors', () => {
  it('InvalidQuantityError has correct name and message', () => {
    const e = new InvalidQuantityError('bad qty');
    expect(e.name).toBe('InvalidQuantityError');
    expect(e.message).toBe('bad qty');
    expect(e).toBeInstanceOf(Error);
  });

  it('PartNotFoundError includes part id', () => {
    const e = new PartNotFoundError('abc');
    expect(e.name).toBe('PartNotFoundError');
    expect(e.message).toContain('abc');
  });

  it('ServiceNotFoundError includes service id', () => {
    const e = new ServiceNotFoundError('svc-1');
    expect(e.name).toBe('ServiceNotFoundError');
    expect(e.message).toContain('svc-1');
  });

  it('PartHasActiveReservationsError includes part id', () => {
    const e = new PartHasActiveReservationsError('p-1');
    expect(e.name).toBe('PartHasActiveReservationsError');
    expect(e.message).toContain('p-1');
  });

  it('InsufficientStockError stores failures', () => {
    const failures = [{ partId: 'p1', requested: 5, available: 2 }];
    const e = new InsufficientStockError(failures);
    expect(e.name).toBe('InsufficientStockError');
    expect(e.failures).toEqual(failures);
  });
});
