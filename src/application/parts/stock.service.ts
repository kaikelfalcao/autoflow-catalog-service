import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PART_REPO,
  RESERVATION_REPO,
  SAGA_REPLY_PUBLISHER,
} from '../shared/tokens';
import type { PartRepository } from '../../domain/parts/ports/part.repository';
import type { ReservationRepository } from '../../domain/parts/ports/reservation.repository';
import type { SagaReplyPublisher } from '../../domain/parts/ports/saga-reply.publisher';
import { StockReservation } from '../../domain/parts/entities/stock-reservation.entity';
import { StockMovement } from '../../domain/parts/entities/stock-movement.entity';
import { ReservationStatus } from '../../domain/parts/enums/reservation-status.enum';
import { Quantity } from '../../domain/parts/value-objects/quantity.vo';
import { v4 as uuidv4 } from 'uuid';

export interface ReserveStockCommand {
  eventId: string;
  correlationId: string;
  sagaId: string;
  osId: string;
  items: Array<{ partId: string; quantity: number }>;
}

export interface ConsumeStockCommand {
  eventId: string;
  correlationId: string;
  sagaId: string;
  osId: string;
  reservationId: string;
}

export interface ReleaseReservationCommand {
  eventId: string;
  correlationId: string;
  sagaId: string;
  osId: string;
  reservationId: string;
}

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    @Inject(PART_REPO) private readonly partRepo: PartRepository,
    @Inject(RESERVATION_REPO)
    private readonly reservationRepo: ReservationRepository,
    @Inject(SAGA_REPLY_PUBLISHER)
    private readonly publisher: SagaReplyPublisher,
  ) {}

  async reserveStock(cmd: ReserveStockCommand): Promise<void> {
    const existing = await this.reservationRepo.findBySagaId(cmd.sagaId);
    if (existing) {
      if (existing.status === ReservationStatus.ACTIVE) {
        await this.publisher.publishStockReserved({
          sagaId: cmd.sagaId,
          osId: cmd.osId,
          reservationId: existing.id,
        });
      }
      return;
    }

    const failures: Array<{
      partId: string;
      requested: number;
      available: number;
    }> = [];

    const parts = await Promise.all(
      cmd.items.map((item) => this.partRepo.findById(item.partId)),
    );

    for (let i = 0; i < cmd.items.length; i++) {
      const item = cmd.items[i];
      const part = parts[i];
      if (!part || !part.canReserve(item.quantity)) {
        failures.push({
          partId: item.partId,
          requested: item.quantity,
          available: part ? part.availableQuantity : 0,
        });
      }
    }

    if (failures.length > 0) {
      await this.publisher.publishStockInsufficient({
        sagaId: cmd.sagaId,
        osId: cmd.osId,
        failures,
      });
      return;
    }

    const reservation = new StockReservation(
      uuidv4(),
      cmd.sagaId,
      cmd.osId,
      cmd.items,
      ReservationStatus.ACTIVE,
      new Date(),
      new Date(),
    );
    const saved = await this.reservationRepo.save(reservation);

    for (let i = 0; i < cmd.items.length; i++) {
      const item = cmd.items[i];
      const part = parts[i]!;
      part.reserve(new Quantity(item.quantity));
      await this.partRepo.update(part);
      const movement = StockMovement.reserve(
        item.partId,
        item.quantity,
        cmd.osId,
        cmd.sagaId,
      );
      await this.reservationRepo.saveMovement(movement);
    }

    await this.publisher.publishStockReserved({
      sagaId: cmd.sagaId,
      osId: cmd.osId,
      reservationId: saved.id,
    });

    this.logger.log('Stock reserved', {
      sagaId: cmd.sagaId,
      osId: cmd.osId,
      reservationId: saved.id,
    });
  }

  async consumeStock(cmd: ConsumeStockCommand): Promise<void> {
    const reservation = await this.reservationRepo.findById(cmd.reservationId);

    if (!reservation) {
      this.logger.warn('Reservation not found for consume', {
        sagaId: cmd.sagaId,
        reservationId: cmd.reservationId,
      });
      return;
    }

    if (!reservation.canBeConsumed()) {
      await this.publisher.publishStockConsumed({
        sagaId: cmd.sagaId,
        osId: cmd.osId,
        reservationId: reservation.id,
      });
      return;
    }

    reservation.markAsConsumed();
    await this.reservationRepo.update(reservation);

    for (const item of reservation.items) {
      const part = await this.partRepo.findById(item.partId);
      if (!part) continue;

      part.consume(new Quantity(item.quantity));

      if (part.shouldEmitLowStockAlert()) {
        part.markLowStockAlertSent();
        await this.publisher.publishLowStockAlert({
          partId: part.id,
          sku: part.sku.value,
          name: part.name,
          currentStock: part.stockQuantity,
          minimumStock: part.minimumStock,
        });
      }

      await this.partRepo.update(part);
      const movement = StockMovement.consume(
        item.partId,
        item.quantity,
        cmd.osId,
        cmd.sagaId,
      );
      await this.reservationRepo.saveMovement(movement);
    }

    await this.publisher.publishStockConsumed({
      sagaId: cmd.sagaId,
      osId: cmd.osId,
      reservationId: reservation.id,
    });

    this.logger.log('Stock consumed', {
      sagaId: cmd.sagaId,
      osId: cmd.osId,
      reservationId: reservation.id,
    });
  }

  async releaseReservation(cmd: ReleaseReservationCommand): Promise<void> {
    const reservation = await this.reservationRepo.findById(cmd.reservationId);

    if (!reservation) {
      this.logger.warn('Reservation not found for release', {
        sagaId: cmd.sagaId,
        reservationId: cmd.reservationId,
      });
      return;
    }

    if (!reservation.canBeReleased()) {
      await this.publisher.publishReservationReleased({
        sagaId: cmd.sagaId,
        osId: cmd.osId,
        reservationId: reservation.id,
      });
      return;
    }

    reservation.markAsReleased();
    await this.reservationRepo.update(reservation);

    for (const item of reservation.items) {
      const part = await this.partRepo.findById(item.partId);
      if (!part) continue;

      part.releaseReservation(new Quantity(item.quantity));
      await this.partRepo.update(part);
      const movement = StockMovement.release(
        item.partId,
        item.quantity,
        cmd.osId,
        cmd.sagaId,
      );
      await this.reservationRepo.saveMovement(movement);
    }

    await this.publisher.publishReservationReleased({
      sagaId: cmd.sagaId,
      osId: cmd.osId,
      reservationId: reservation.id,
    });

    this.logger.log('Reservation released', {
      sagaId: cmd.sagaId,
      osId: cmd.osId,
      reservationId: reservation.id,
    });
  }
}
