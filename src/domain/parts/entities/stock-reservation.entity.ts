import { ReservationStatus } from '../enums/reservation-status.enum';

export interface ReservationItem {
  partId: string;
  quantity: number;
}

export class StockReservation {
  constructor(
    readonly id: string,
    readonly sagaId: string,
    readonly osId: string,
    readonly items: ReservationItem[],
    public status: ReservationStatus,
    readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  canBeConsumed(): boolean {
    return this.status === ReservationStatus.ACTIVE;
  }

  canBeReleased(): boolean {
    return this.status === ReservationStatus.ACTIVE;
  }

  markAsConsumed(): void {
    if (!this.canBeConsumed()) {
      throw new Error(
        `Reservation ${this.id} cannot be consumed (status: ${this.status})`,
      );
    }
    this.status = ReservationStatus.CONSUMED;
    this.updatedAt = new Date();
  }

  markAsReleased(): void {
    if (!this.canBeReleased()) {
      throw new Error(
        `Reservation ${this.id} cannot be released (status: ${this.status})`,
      );
    }
    this.status = ReservationStatus.RELEASED;
    this.updatedAt = new Date();
  }
}
