import { setWorldConstructor, World } from '@cucumber/cucumber';

import { StockMovement } from '../../src/domain/parts/entities/stock-movement.entity';
import { Part } from '../../src/domain/parts/entities/part.entity';
import { StockReservation } from '../../src/domain/parts/entities/stock-reservation.entity';
import { PartCategory } from '../../src/domain/parts/enums/part-category.enum';
import { ReservationStatus } from '../../src/domain/parts/enums/reservation-status.enum';
import { Unit } from '../../src/domain/parts/enums/unit.enum';
import { SKU } from '../../src/domain/parts/value-objects/sku.vo';
import type { PartRepository } from '../../src/domain/parts/ports/part.repository';
import type { ReservationRepository } from '../../src/domain/parts/ports/reservation.repository';
import type { SagaReplyPublisher } from '../../src/domain/parts/ports/saga-reply.publisher';
import { StockService } from '../../src/application/parts/stock.service';

class InMemoryPartRepo implements PartRepository {
  parts = new Map<string, Part>();

  async findById(id: string): Promise<Part | null> {
    return this.parts.get(id) ?? null;
  }

  async update(part: Part): Promise<Part> {
    this.parts.set(part.id, part);
    return part;
  }

  async save(part: Part): Promise<Part> {
    this.parts.set(part.id, part);
    return part;
  }

  async findAll(): Promise<{ data: Part[]; total: number; page: number; limit: number }> {
    const data = [...this.parts.values()];
    return { data, total: data.length, page: 1, limit: data.length };
  }

  async findLowStock(): Promise<Part[]> {
    return [];
  }
}

class InMemoryReservationRepo implements ReservationRepository {
  reservations: StockReservation[] = [];
  movements: StockMovement[] = [];

  async findBySagaId(sagaId: string): Promise<StockReservation | null> {
    return this.reservations.find((r) => r.sagaId === sagaId) ?? null;
  }

  async findById(id: string): Promise<StockReservation | null> {
    return this.reservations.find((r) => r.id === id) ?? null;
  }

  async findByOsId(osId: string): Promise<StockReservation[]> {
    return this.reservations.filter((r) => r.osId === osId);
  }

  async hasActiveReservationsForPart(): Promise<boolean> {
    return false;
  }

  async save(r: StockReservation): Promise<StockReservation> {
    this.reservations.push(r);
    return r;
  }

  async update(r: StockReservation): Promise<StockReservation> {
    const idx = this.reservations.findIndex((x) => x.id === r.id);
    if (idx >= 0) this.reservations[idx] = r;
    return r;
  }

  async saveMovement(m: StockMovement): Promise<StockMovement> {
    this.movements.push(m);
    return m;
  }

  async findMovementsByPartId() {
    return { data: [], total: 0, page: 1, limit: 0 };
  }
}

class CapturingPublisher implements SagaReplyPublisher {
  reservedCalls: Array<{ sagaId: string }> = [];
  insufficientCalls: Array<{ sagaId: string }> = [];
  consumedCalls: Array<{ sagaId: string }> = [];
  releasedCalls: Array<{ sagaId: string }> = [];
  lowStockCalls: Array<{ partId: string }> = [];

  async publishStockReserved(p: { sagaId: string }): Promise<void> {
    this.reservedCalls.push({ sagaId: p.sagaId });
  }
  async publishStockInsufficient(p: { sagaId: string }): Promise<void> {
    this.insufficientCalls.push({ sagaId: p.sagaId });
  }
  async publishStockConsumed(p: { sagaId: string }): Promise<void> {
    this.consumedCalls.push({ sagaId: p.sagaId });
  }
  async publishReservationReleased(p: { sagaId: string }): Promise<void> {
    this.releasedCalls.push({ sagaId: p.sagaId });
  }
  async publishLowStockAlert(p: { partId: string }): Promise<void> {
    this.lowStockCalls.push({ partId: p.partId });
  }
}

export class StockWorld extends World {
  parts = new InMemoryPartRepo();
  reservations = new InMemoryReservationRepo();
  publisher = new CapturingPublisher();
  service = new StockService(this.parts, this.reservations, this.publisher);

  seedPart(id: string, stock: number): void {
    const part = new Part(
      id,
      SKU.generate(PartCategory.OTHER),
      `Peça ${id}`,
      PartCategory.OTHER,
      Unit.UN,
      {},
      stock,
      0,
      1,
      true,
      false,
    );
    this.parts.parts.set(id, part);
  }
}

setWorldConstructor(StockWorld);
