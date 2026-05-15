import { Inject, Injectable, Logger } from '@nestjs/common';
import { PART_REPO, RESERVATION_REPO } from '../shared/tokens';
import type {
  PartRepository,
  ListPartsFilter,
  PaginatedResult,
} from '../../domain/parts/ports/part.repository';
import type { ReservationRepository } from '../../domain/parts/ports/reservation.repository';
import { Part } from '../../domain/parts/entities/part.entity';
import { StockMovement } from '../../domain/parts/entities/stock-movement.entity';
import { SKU } from '../../domain/parts/value-objects/sku.vo';
import { Quantity } from '../../domain/parts/value-objects/quantity.vo';
import { PartCategory } from '../../domain/parts/enums/part-category.enum';
import { Unit } from '../../domain/parts/enums/unit.enum';
import { MovementType } from '../../domain/parts/enums/movement-type.enum';
import { PartNotFoundError } from '../../domain/shared/errors/part-not-found.error';
import { PartHasActiveReservationsError } from '../../domain/shared/errors/part-has-active-reservations.error';
import type {
  ListMovementsFilter,
  PaginatedMovements,
} from '../../domain/parts/ports/reservation.repository';
import type { SagaReplyPublisher } from '../../domain/parts/ports/saga-reply.publisher';
import { SAGA_REPLY_PUBLISHER } from '../shared/tokens';
import { v4 as uuidv4 } from 'uuid';

export interface CreatePartDto {
  name: string;
  category: PartCategory;
  unit: Unit;
  attributes?: Record<string, unknown>;
  stockQuantity: number;
  minimumStock: number;
}

export interface UpdatePartDto {
  name?: string;
  attributes?: Record<string, unknown>;
  minimumStock?: number;
}

export interface ReplenishStockDto {
  quantity: number;
  reason: string;
}

export interface AdjustStockDto {
  newQuantity: number;
  reason: string;
}

@Injectable()
export class PartCatalogService {
  private readonly logger = new Logger(PartCatalogService.name);

  constructor(
    @Inject(PART_REPO) private readonly partRepo: PartRepository,
    @Inject(RESERVATION_REPO)
    private readonly reservationRepo: ReservationRepository,
    @Inject(SAGA_REPLY_PUBLISHER)
    private readonly publisher: SagaReplyPublisher,
  ) {}

  async findAll(filter: ListPartsFilter): Promise<PaginatedResult<Part>> {
    return this.partRepo.findAll(filter);
  }

  async findById(id: string): Promise<Part> {
    const part = await this.partRepo.findById(id);
    if (!part) throw new PartNotFoundError(id);
    return part;
  }

  async findLowStock(): Promise<Part[]> {
    return this.partRepo.findLowStock();
  }

  async create(dto: CreatePartDto): Promise<Part> {
    const sku = SKU.generate(dto.category);
    const part = new Part(
      uuidv4(),
      sku,
      dto.name,
      dto.category,
      dto.unit,
      dto.attributes ?? {},
      dto.stockQuantity,
      0,
      dto.minimumStock,
      true,
      false,
    );
    const saved = await this.partRepo.save(part);

    if (dto.stockQuantity > 0) {
      const movement = StockMovement.replenish(
        saved.id,
        dto.stockQuantity,
        'Initial stock',
      );
      await this.reservationRepo.saveMovement(movement);
    }

    return saved;
  }

  async update(id: string, dto: UpdatePartDto): Promise<Part> {
    const part = await this.partRepo.findById(id);
    if (!part) throw new PartNotFoundError(id);

    if (dto.name !== undefined) part.name = dto.name;
    if (dto.attributes !== undefined) part.attributes = dto.attributes;
    if (dto.minimumStock !== undefined) part.minimumStock = dto.minimumStock;

    return this.partRepo.update(part);
  }

  async replenish(id: string, dto: ReplenishStockDto): Promise<Part> {
    const part = await this.partRepo.findById(id);
    if (!part) throw new PartNotFoundError(id);

    part.replenish(new Quantity(dto.quantity));
    const updated = await this.partRepo.update(part);

    const movement = StockMovement.replenish(id, dto.quantity, dto.reason);
    await this.reservationRepo.saveMovement(movement);

    this.logger.log('Stock replenished', {
      partId: id,
      quantity: dto.quantity,
    });
    return updated;
  }

  async adjustStock(id: string, dto: AdjustStockDto): Promise<Part> {
    const part = await this.partRepo.findById(id);
    if (!part) throw new PartNotFoundError(id);

    const diff = dto.newQuantity - part.stockQuantity;
    if (diff === 0) return part;

    if (diff > 0) {
      part.replenish(new Quantity(diff));
      const movement = StockMovement.replenish(id, diff, dto.reason);
      await this.reservationRepo.saveMovement(movement);
    } else {
      const absDiff = Math.abs(diff);
      part.reduce(new Quantity(absDiff));
      const movement = new StockMovement(
        '',
        id,
        MovementType.OUT,
        absDiff,
        dto.reason,
        null,
        null,
        new Date(),
      );
      await this.reservationRepo.saveMovement(movement);
    }

    const updated = await this.partRepo.update(part);

    if (updated.shouldEmitLowStockAlert()) {
      await this.publisher.publishLowStockAlert({
        partId: updated.id,
        sku: updated.sku.value,
        name: updated.name,
        currentStock: updated.stockQuantity,
        minimumStock: updated.minimumStock,
      });
      updated.markLowStockAlertSent();
      await this.partRepo.update(updated);
    }

    return updated;
  }

  async softDelete(id: string): Promise<void> {
    const part = await this.partRepo.findById(id);
    if (!part) throw new PartNotFoundError(id);

    const hasActive =
      await this.reservationRepo.hasActiveReservationsForPart(id);
    if (hasActive) throw new PartHasActiveReservationsError(id);

    part.active = false;
    await this.partRepo.update(part);
  }

  async findMovements(
    partId: string,
    filter: ListMovementsFilter,
  ): Promise<PaginatedMovements> {
    const part = await this.partRepo.findById(partId);
    if (!part) throw new PartNotFoundError(partId);
    return this.reservationRepo.findMovementsByPartId(partId, filter);
  }

  async findReservationsByOsId(osId: string) {
    return this.reservationRepo.findByOsId(osId);
  }
}
