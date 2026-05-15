import { StockMovement } from './stock-movement.entity';
import { MovementType } from '../enums/movement-type.enum';

describe('StockMovement', () => {
  it('reserve factory creates RESERVE movement', () => {
    const m = StockMovement.reserve('p1', 3, 'os1', 'saga1');
    expect(m.type).toBe(MovementType.RESERVE);
    expect(m.partId).toBe('p1');
    expect(m.quantity).toBe(3);
    expect(m.osId).toBe('os1');
    expect(m.sagaId).toBe('saga1');
  });

  it('consume factory creates OUT movement', () => {
    const m = StockMovement.consume('p1', 2, 'os1', 'saga1');
    expect(m.type).toBe(MovementType.OUT);
  });

  it('release factory creates RELEASE movement', () => {
    const m = StockMovement.release('p1', 2, 'os1', 'saga1');
    expect(m.type).toBe(MovementType.RELEASE);
  });

  it('replenish factory creates IN movement with no saga/os', () => {
    const m = StockMovement.replenish('p1', 10, 'restock');
    expect(m.type).toBe(MovementType.IN);
    expect(m.osId).toBeNull();
    expect(m.sagaId).toBeNull();
    expect(m.reason).toBe('restock');
  });
});
