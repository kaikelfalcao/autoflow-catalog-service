export class PartHasActiveReservationsError extends Error {
  constructor(partId: string) {
    super(`Part ${partId} has active reservations and cannot be deleted`);
    this.name = 'PartHasActiveReservationsError';
  }
}
