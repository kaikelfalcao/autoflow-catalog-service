import { StockReservation } from './stock-reservation.entity';
import { ReservationStatus } from '../enums/reservation-status.enum';

function makeReservation(status = ReservationStatus.ACTIVE): StockReservation {
  return new StockReservation(
    'res-1',
    'saga-1',
    'os-1',
    [{ partId: 'part-1', quantity: 2 }],
    status,
    new Date(),
    new Date(),
  );
}

describe('StockReservation', () => {
  it('canBeConsumed returns true when ACTIVE', () => {
    expect(makeReservation(ReservationStatus.ACTIVE).canBeConsumed()).toBe(
      true,
    );
  });

  it('canBeConsumed returns false when CONSUMED', () => {
    expect(makeReservation(ReservationStatus.CONSUMED).canBeConsumed()).toBe(
      false,
    );
  });

  it('canBeReleased returns true when ACTIVE', () => {
    expect(makeReservation(ReservationStatus.ACTIVE).canBeReleased()).toBe(
      true,
    );
  });

  it('canBeReleased returns false when RELEASED', () => {
    expect(makeReservation(ReservationStatus.RELEASED).canBeReleased()).toBe(
      false,
    );
  });

  it('markAsConsumed changes status to CONSUMED', () => {
    const r = makeReservation();
    r.markAsConsumed();
    expect(r.status).toBe(ReservationStatus.CONSUMED);
  });

  it('markAsConsumed throws when not ACTIVE', () => {
    const r = makeReservation(ReservationStatus.CONSUMED);
    expect(() => r.markAsConsumed()).toThrow();
  });

  it('markAsReleased changes status to RELEASED', () => {
    const r = makeReservation();
    r.markAsReleased();
    expect(r.status).toBe(ReservationStatus.RELEASED);
  });

  it('markAsReleased throws when not ACTIVE', () => {
    const r = makeReservation(ReservationStatus.RELEASED);
    expect(() => r.markAsReleased()).toThrow();
  });
});
