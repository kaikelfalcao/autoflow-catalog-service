import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ReservationRepository,
  ListMovementsFilter,
  PaginatedMovements,
} from '../../../domain/parts/ports/reservation.repository';
import { StockReservation } from '../../../domain/parts/entities/stock-reservation.entity';
import { StockMovement } from '../../../domain/parts/entities/stock-movement.entity';
import { ReservationStatus } from '../../../domain/parts/enums/reservation-status.enum';
import {
  ReservationDoc,
  ReservationDocument,
} from '../schemas/reservation.schema';
import { MovementDoc, MovementDocument } from '../schemas/movement.schema';
import { ReservationMapper } from '../mappers/reservation.mapper';

@Injectable()
export class MongoReservationRepository implements ReservationRepository {
  constructor(
    @InjectModel(ReservationDoc.name)
    private readonly reservationModel: Model<ReservationDocument>,
    @InjectModel(MovementDoc.name)
    private readonly movementModel: Model<MovementDocument>,
  ) {}

  async findById(id: string): Promise<StockReservation | null> {
    const doc = await this.reservationModel.findById(id).exec();
    return doc ? ReservationMapper.toDomain(doc) : null;
  }

  async findBySagaId(sagaId: string): Promise<StockReservation | null> {
    const doc = await this.reservationModel.findOne({ sagaId }).exec();
    return doc ? ReservationMapper.toDomain(doc) : null;
  }

  async findByOsId(osId: string): Promise<StockReservation[]> {
    const docs = await this.reservationModel.find({ osId }).exec();
    return docs.map((doc) => ReservationMapper.toDomain(doc));
  }

  async hasActiveReservationsForPart(partId: string): Promise<boolean> {
    const count = await this.reservationModel
      .countDocuments({
        'items.partId': partId,
        status: ReservationStatus.ACTIVE,
      })
      .exec();
    return count > 0;
  }

  async save(reservation: StockReservation): Promise<StockReservation> {
    const created = await this.reservationModel.create({
      sagaId: reservation.sagaId,
      osId: reservation.osId,
      items: reservation.items,
      status: reservation.status,
    });
    return ReservationMapper.toDomain(created);
  }

  async update(reservation: StockReservation): Promise<StockReservation> {
    const updated = await this.reservationModel
      .findByIdAndUpdate(
        reservation.id,
        { status: reservation.status, updatedAt: reservation.updatedAt },
        { new: true },
      )
      .exec();
    if (!updated) throw new Error(`Reservation ${reservation.id} not found`);
    return ReservationMapper.toDomain(updated);
  }

  async saveMovement(movement: StockMovement): Promise<StockMovement> {
    const created = await this.movementModel.create({
      partId: movement.partId,
      type: movement.type,
      quantity: movement.quantity,
      reason: movement.reason,
      osId: movement.osId ?? undefined,
      sagaId: movement.sagaId ?? undefined,
    });
    return ReservationMapper.movementToDomain(created);
  }

  async findMovementsByPartId(
    partId: string,
    filter: ListMovementsFilter,
  ): Promise<PaginatedMovements> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { partId };
    if (filter.type) query.type = filter.type;
    if (filter.from || filter.to) {
      const dateFilter: Record<string, Date> = {};
      if (filter.from) dateFilter.$gte = filter.from;
      if (filter.to) dateFilter.$lte = filter.to;
      query.createdAt = dateFilter;
    }

    const [docs, total] = await Promise.all([
      this.movementModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.movementModel.countDocuments(query).exec(),
    ]);

    return {
      data: docs.map((doc) => ReservationMapper.movementToDomain(doc)),
      total,
      page,
      limit,
    };
  }
}
