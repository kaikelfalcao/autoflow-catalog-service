import { StockReservation } from '../entities/stock-reservation.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { MovementType } from '../enums/movement-type.enum';

export interface ListMovementsFilter {
  type?: MovementType;
  from?: Date;
  to?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedMovements {
  data: StockMovement[];
  total: number;
  page: number;
  limit: number;
}

export interface ReservationRepository {
  findById(id: string): Promise<StockReservation | null>;
  findBySagaId(sagaId: string): Promise<StockReservation | null>;
  findByOsId(osId: string): Promise<StockReservation[]>;
  hasActiveReservationsForPart(partId: string): Promise<boolean>;
  save(reservation: StockReservation): Promise<StockReservation>;
  update(reservation: StockReservation): Promise<StockReservation>;
  saveMovement(movement: StockMovement): Promise<StockMovement>;
  findMovementsByPartId(
    partId: string,
    filter: ListMovementsFilter,
  ): Promise<PaginatedMovements>;
}
