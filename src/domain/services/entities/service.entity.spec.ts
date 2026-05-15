import { Service } from './service.entity';
import { Money } from '../value-objects/money.vo';
import { EstimatedDuration } from '../value-objects/estimated-duration.vo';

function makeService(): Service {
  return new Service(
    'svc-1',
    'SVC-ABCD1234',
    'Oil Change',
    'Full oil change service',
    new EstimatedDuration(30),
    new Money(5000, 'BRL'),
    true,
  );
}

describe('Service', () => {
  it('activate sets active to true', () => {
    const svc = makeService();
    svc.deactivate();
    svc.activate();
    expect(svc.active).toBe(true);
  });

  it('deactivate sets active to false', () => {
    const svc = makeService();
    svc.deactivate();
    expect(svc.active).toBe(false);
  });
});
