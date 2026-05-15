import { ReservationMapper } from './reservation.mapper';
import { ReservationStatus } from '../../../domain/parts/enums/reservation-status.enum';
import { MovementType } from '../../../domain/parts/enums/movement-type.enum';
import type { ReservationDocument } from '../schemas/reservation.schema';
import type { MovementDocument } from '../schemas/movement.schema';

function makeReservationDoc(overrides = {}) {
  return {
    _id: { toString: () => 'res-id-1' },
    sagaId: 'saga-1',
    osId: 'os-1',
    items: [{ partId: 'p-1', quantity: 3 }],
    status: ReservationStatus.ACTIVE,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
    ...overrides,
  } as unknown as ReservationDocument;
}

function makeMovementDoc(overrides = {}) {
  return {
    _id: { toString: () => 'mov-id-1' },
    partId: 'p-1',
    type: MovementType.RESERVE,
    quantity: 3,
    reason: 'test',
    osId: 'os-1',
    sagaId: 'saga-1',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  } as unknown as MovementDocument;
}

describe('ReservationMapper', () => {
  describe('toDomain', () => {
    it('maps document to StockReservation', () => {
      const r = ReservationMapper.toDomain(makeReservationDoc());
      expect(r.id).toBe('res-id-1');
      expect(r.sagaId).toBe('saga-1');
      expect(r.status).toBe(ReservationStatus.ACTIVE);
      expect(r.items).toHaveLength(1);
    });
  });

  describe('movementToDomain', () => {
    it('maps document to StockMovement', () => {
      const m = ReservationMapper.movementToDomain(makeMovementDoc());
      expect(m.id).toBe('mov-id-1');
      expect(m.partId).toBe('p-1');
      expect(m.type).toBe(MovementType.RESERVE);
      expect(m.osId).toBe('os-1');
    });

    it('handles null osId and sagaId', () => {
      const m = ReservationMapper.movementToDomain(
        makeMovementDoc({ osId: undefined, sagaId: undefined }),
      );
      expect(m.osId).toBeNull();
      expect(m.sagaId).toBeNull();
    });
  });
});
