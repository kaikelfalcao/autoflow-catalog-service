import { StockReservation } from '../../../domain/parts/entities/stock-reservation.entity';
import { StockMovement } from '../../../domain/parts/entities/stock-movement.entity';
import { ReservationDocument } from '../schemas/reservation.schema';
import { MovementDocument } from '../schemas/movement.schema';

type WithTimestamps = { createdAt: Date; updatedAt: Date };

export class ReservationMapper {
  static toDomain(doc: ReservationDocument): StockReservation {
    const d = doc as ReservationDocument & WithTimestamps;
    return new StockReservation(
      doc._id.toString(),
      doc.sagaId,
      doc.osId,
      doc.items,
      doc.status,
      d.createdAt,
      d.updatedAt,
    );
  }

  static movementToDomain(doc: MovementDocument): StockMovement {
    const d = doc as MovementDocument & { createdAt: Date };
    return new StockMovement(
      doc._id.toString(),
      doc.partId,
      doc.type,
      doc.quantity,
      doc.reason,
      doc.osId ?? null,
      doc.sagaId ?? null,
      d.createdAt,
    );
  }
}
